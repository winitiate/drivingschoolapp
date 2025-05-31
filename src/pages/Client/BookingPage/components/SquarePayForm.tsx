// src/pages/Client/BookingPage/components/SquarePayForm.tsx

import React, { useEffect, useRef, useState } from "react";
import { CircularProgress, Box, Alert, Button } from "@mui/material";
import { createPayment } from "../../../../api/createPayment";

/**
 * The shape of data returned by our server’s createPayment endpoint.
 * It looks like:
 * {
 *   success: true,
 *   payment: {
 *     paymentId: string,
 *     status: "COMPLETED" | "PENDING",
 *     // (other fields like receiptUrl, feesCents, etc., if you extend the backend)
 *   }
 * }
 */
interface CreatePaymentResponse {
  success: boolean;
  payment: {
    paymentId: string;
    status: "COMPLETED" | "PENDING";
    // You can add more fields here if your backend returns them,
    // e.g. receiptUrl?: string;
    //      feesCents?: number;
    //      netTotalCents?: number;
    //      cardBrand?: string;
    //      panSuffix?: string;
    //      detailsUrl?: string;
  };
}

/**
 * What we pass back to BookingPage’s handlePaid callback.
 * transactionId is the Square payment ID; others are optional.
 */
interface PaymentResult {
  transactionId: string;
  receiptUrl?: string;
  feesCents?: number;
  netTotalCents?: number;
  cardBrand?: string;
  panSuffix?: string;
  detailsUrl?: string;
}

interface Props {
  applicationId:     string;
  locationId?:       string;
  amountCents:       number;
  appointmentTypeId: string;
  serviceLocationId: string;
  /**
   * Called when payment succeeds, passing a PaymentResult
   */
  onSuccess:         (paymentResult: PaymentResult) => void;
  onCancel:          () => void;
}

/* Let TypeScript know Square is loaded on window */
declare global {
  interface Window {
    Square?: any;
  }
}

export default function SquarePayForm({
  applicationId,
  locationId,
  amountCents,
  appointmentTypeId,
  serviceLocationId,
  onSuccess,
  onCancel,
}: Props) {
  const [error,        setError]        = useState<string | null>(null);
  const [initialising, setInitialising] = useState(true);
  const [paying,       setPaying]       = useState(false);

  /** Live Square objects */
  const paymentsRef = useRef<any>(null);
  const cardRef     = useRef<any>(null);

  /** Prevents two concurrent `.attach()` calls */
  const attachInFlightRef = useRef(false);

  /* ───────── attach card safely ───────── */
  const attachCard = async () => {
    if (cardRef.current || attachInFlightRef.current) return;
    attachInFlightRef.current = true;

    // Clear any stale DOM in strict mode double-mount scenarios
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
    // Simple sanity check for application ID prefix
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
      // Already loaded (likely re-open of dialog)
      start();
    } else {
      // Inject the SDK script once
      const existing = document.getElementById("sq-sdk") as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", start, { once: true });
      } else {
        const script = document.createElement("script");
        script.id = "sq-sdk";
        script.src = applicationId.startsWith("sandbox-")
          ? "https://sandbox.web.squarecdn.com/v1/square.js"
          : "https://web.squarecdn.com/v1/square.js";
        script.async = true;
        script.onload = start;
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
      // Tokenize the card
      const { token, status } = await cardRef.current.tokenize();
      if (status !== "OK") throw new Error("Card tokenisation failed");

      // Call our backend to create a payment
      const resp: CreatePaymentResponse = await createPayment({
        ownerType:        "serviceLocation",
        ownerId:          serviceLocationId,
        appointmentTypeId,
        amountCents,
        nonce:            token,
      });

      if (!resp.success) {
        throw new Error("Payment failed on server");
      }

      const paymentId = resp.payment.paymentId;
      if (!paymentId) {
        throw new Error("Payment succeeded but paymentId is missing");
      }

      // Build the result to return to BookingPage
      const paymentResult: PaymentResult = {
        transactionId: paymentId,
        // These optional fields can be populated if your backend returns them
        // receiptUrl:    resp.payment.receiptUrl,
        // feesCents:     resp.payment.feesCents,
        // netTotalCents: resp.payment.netTotalCents,
        // cardBrand:     resp.payment.cardBrand,
        // panSuffix:     resp.payment.panSuffix,
        // detailsUrl:    resp.payment.detailsUrl,
      };

      onSuccess(paymentResult);
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
