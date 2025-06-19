// src/pages/Client/BookingPage/components/SquarePayForm.tsx

import React, { useEffect, useRef, useState } from "react";
import { CircularProgress, Box, Alert, Button } from "@mui/material";

declare global {
  interface Window {
    Square?: any;
  }
}

interface Props {
  /** Public Square application ID */
  applicationId: string;
  /** (optional) public Square location ID */
  locationId?: string;
  /** Called once you have a one-time nonce from Square */
  onTokenize: (nonce: string) => void;
  /** Called if the user clicks “Cancel” */
  onCancel: () => void;
}

export default function SquarePayForm({
  applicationId,
  locationId,
  onTokenize,
  onCancel,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [initialising, setInitialising] = useState(true);
  const [paying, setPaying] = useState(false);

  const paymentsRef = useRef<any>(null);
  const cardRef     = useRef<any>(null);
  const attaching   = useRef(false);

  /** Attach the Square Card element */
  const attachCard = async () => {
    if (cardRef.current || attaching.current) return;
    attaching.current = true;

    const container = document.getElementById("card-container");
    if (container) container.innerHTML = "";

    if (!paymentsRef.current) {
      paymentsRef.current = window.Square!.payments(
        applicationId,
        locationId
      );
    }

    const card = await paymentsRef.current.card();
    await card.attach("#card-container");
    cardRef.current = card;
    attaching.current = false;
  };

  /** Load SDK script then attach */
  useEffect(() => {
    // quick sanity check
    if (!/^sandbox-|^sq0(idp|atp)-/.test(applicationId)) {
      setError("Invalid Square applicationId");
      setInitialising(false);
      return;
    }

    const start = async () => {
      try {
        await attachCard();
      } catch (e: any) {
        setError(e.message || "Failed to initialise payment form");
      } finally {
        setInitialising(false);
      }
    };

    if (window.Square) {
      start();
    } else {
      const existing = document.getElementById("sq-sdk") as HTMLScriptElement;
      if (existing) {
        existing.addEventListener("load", start, { once: true });
      } else {
        const script = document.createElement("script");
        script.id    = "sq-sdk";
        script.src   = applicationId.startsWith("sandbox-")
          ? "https://sandbox.web.squarecdn.com/v1/square.js"
          : "https://web.squarecdn.com/v1/square.js";
        script.async   = true;
        script.onload  = start;
        script.onerror = () => {
          setError("Failed to load Square SDK");
          setInitialising(false);
        };
        document.body.appendChild(script);
      }
    }

    return () => {
      if (cardRef.current?.destroy) {
        cardRef.current.destroy();
        cardRef.current = null;
      }
      const container = document.getElementById("card-container");
      if (container) container.innerHTML = "";
    };
  }, [applicationId, locationId]);

  /** Called when user clicks “PAY” */
  const pay = async () => {
    if (!cardRef.current || paying) return;

    setPaying(true);
    setError(null);

    try {
      const { token, status } = await cardRef.current.tokenize();
      if (status !== "OK") {
        throw new Error("Card tokenization failed");
      }
      // hand the nonce back to BookingPage
      onTokenize(token);
    } catch (e: any) {
      setError(e.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (initialising) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <div id="card-container" />

      {paying ? (
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
            Pay
          </Button>
          <Button fullWidth sx={{ mt: 1 }} onClick={onCancel} disabled={paying}>
            Cancel
          </Button>
        </>
      )}
    </Box>
  );
}
