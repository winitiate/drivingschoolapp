import React, { useEffect, useRef, useState } from "react";
import { CircularProgress, Box, Alert, Button } from "@mui/material";
import { createPayment } from "../../../../api/createPayment";

/* ──────────────────────────────────────────────────────────── */

interface Props {
  applicationId:     string;
  locationId?:       string;
  amountCents:       number;
  appointmentTypeId: string;
  serviceLocationId: string;
  onSuccess:         () => void;
  onCancel:          () => void;
}

/* Let TypeScript know Square is loaded on window */
declare global {
  interface Window {
    Square?: any;
  }
}

/* ──────────────────────────────────────────────────────────── */

export default function SquarePayForm({
  applicationId,
  locationId,
  amountCents,
  appointmentTypeId,
  serviceLocationId,
  onSuccess,
  onCancel,
}: Props) {
  const [error,       setError]       = useState<string | null>(null);
  const [initialising, setInitialising] = useState(true);
  const [paying,       setPaying]       = useState(false);

  /** Live Square objects */
  const paymentsRef = useRef<any>(null);
  const cardRef     = useRef<any>(null);

  /** Prevents two concurrent `.attach()` calls */
  const attachInFlightRef = useRef(false);

  /* ───────── attach card safely ───────── */
  const attachCard = async () => {
    if (cardRef.current || attachInFlightRef.current) return;      // already have one or attaching
    attachInFlightRef.current = true;

    /* clear any stale markup first (strict-mode double-mount safety) */
    const holder = document.getElementById("card-container");
    if (holder) holder.innerHTML = "";

    if (!paymentsRef.current) {
      paymentsRef.current = window.Square.payments(applicationId, locationId);
    }

    const card = await paymentsRef.current.card();
    await card.attach("#card-container");

    cardRef.current = card;
    attachInFlightRef.current = false;
  };

  /* ───────── load Square SDK & attach once ───────── */
  useEffect(() => {
    /* quick sanity check on the applicationId format */
    if (!/^sandbox-|^sq0idp-/.test(applicationId)) {
      setError("Invalid Square applicationId");
      setInitialising(false);
      return;
    }

    const start = async () => {
      try {
        await attachCard();
      } catch (e: any) {
        setError(e?.message ?? "Failed to initialise payment form");
      } finally {
        setInitialising(false);
      }
    };

    if (window.Square) {
      /* SDK already present (likely re-open of dialog) */
      start();
    } else {
      /* Inject the SDK script exactly once */
      const existing = document.getElementById("sq-sdk") as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", start, { once: true });
      } else {
        const script = document.createElement("script");
        script.id  = "sq-sdk";
        script.src = applicationId.startsWith("sandbox-")
          ? "https://sandbox.web.squarecdn.com/v1/square.js"
          : "https://web.squarecdn.com/v1/square.js";
        script.async = true;
        script.onload  = start;
        script.onerror = () => {
          setError("Failed to load Square SDK");
          setInitialising(false);
        };
        document.body.appendChild(script);
      }
    }

    /* ───────── cleanup on unmount ───────── */
    return () => {
      if (cardRef.current?.destroy) {
        cardRef.current.destroy();
        cardRef.current = null;
      }
      const holder = document.getElementById("card-container");
      if (holder) holder.innerHTML = "";
    };
  }, [applicationId, locationId]);

  /* ───────── payment handler ───────── */
  const pay = async () => {
    if (!cardRef.current || paying) return;

    setPaying(true);
    setError(null);

    try {
      const { token, status } = await cardRef.current.tokenize();
      if (status !== "OK") throw new Error("Card tokenisation failed");

      /* call your serverless function / backend */
      await createPayment({
        ownerType: "serviceLocation",
        ownerId:   serviceLocationId,
        appointmentTypeId,
        amountCents,
        nonce: token,
      });

      onSuccess();
    } catch (e: any) {
      setError(e?.message ?? "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  /* ───────── UI ───────── */
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <div id="card-container" />

      {initialising ? (
        <Box textAlign="center" mt={2}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={pay}
            disabled={paying}
          >
            {paying ? (
              <CircularProgress size={24} />
            ) : (
              `PAY $${(amountCents / 100).toFixed(2)}`
            )}
          </Button>

          <Button fullWidth sx={{ mt: 1 }} onClick={onCancel} disabled={paying}>
            Cancel
          </Button>
        </>
      )}
    </Box>
  );
}
