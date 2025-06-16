// src/pages/Client/BookingPage/components/SquarePayForm.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  CircularProgress,
  Box,
  Alert,
  Button,
} from "@mui/material";
import { createPayment, CreatePaymentResponse } from "../../../../services/SquareBillingService";

/**
 * SquarePayForm.tsx
 *
 * Renders the Square Web Payments SDK card form, handles tokenization,
 * and then calls our backend to actually create the payment.
 *
 * We collect:
 *  - appointmentId      (required)  → which appointment doc to charge for
 *  - serviceLocationId  (required)  → which location’s Square credentials to use
 *  - amountCents        (required)  → how much to charge, in cents
 *
 * When the user clicks “Pay”, we:
 *  1. Tokenize the card (gets a `nonce`)
 *  2. Call createPayment({ appointmentId, toBeUsedBy, amountCents, nonce })
 *  3. If success, invoke onSuccess with the transaction ID
 */

interface PaymentResult {
  transactionId: string;
  // you can extend this with receiptUrl, feesCents, etc.
}

interface Props {
  applicationId:     string;    // Square Web SDK application ID
  locationId?:       string;    // (optional) Square location ID for card form
  appointmentId:     string;    // ID of the appointment document
  amountCents:       number;    // amount to charge, in cents
  serviceLocationId: string;    // the “toBeUsedBy” ID for lookup
  onSuccess:         (paymentResult: PaymentResult) => void;
  onCancel:          () => void;
}

/* Tell TypeScript that `window.Square` exists after loading the SDK script */
declare global {
  interface Window {
    Square?: any;
  }
}

export default function SquarePayForm({
  applicationId,
  locationId,
  appointmentId,
  amountCents,
  serviceLocationId,
  onSuccess,
  onCancel,
}: Props) {
  const [error,        setError]        = useState<string | null>(null);
  const [initialising, setInitialising] = useState(true);
  const [paying,       setPaying]       = useState(false);

  /** References to the SDK objects */
  const paymentsRef      = useRef<any>(null);
  const cardRef          = useRef<any>(null);
  const attachInFlight   = useRef(false);

  /** Attaches the Square Card element to the DOM */
  const attachCard = async () => {
    if (cardRef.current || attachInFlight.current) return;
    attachInFlight.current = true;

    const container = document.getElementById("card-container");
    if (container) container.innerHTML = "";

    if (!paymentsRef.current) {
      paymentsRef.current = window.Square.payments(applicationId, locationId);
    }

    const card = await paymentsRef.current.card();
    await card.attach("#card-container");
    cardRef.current = card;
    attachInFlight.current = false;
  };

  /** Load the Square Web Payments SDK script and attach the card */
  useEffect(() => {
    // Validate the App ID
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
        script.id  = "sq-sdk";
        script.src = applicationId.startsWith("sandbox-")
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

    // Cleanup on unmount
    return () => {
      if (cardRef.current?.destroy) {
        cardRef.current.destroy();
        cardRef.current = null;
      }
      const container = document.getElementById("card-container");
      if (container) container.innerHTML = "";
    };
  }, [applicationId, locationId]);

  /** Handle the Pay button click */
  const pay = async () => {
    if (!cardRef.current || paying) return;

    setPaying(true);
    setError(null);

    try {
      // 1️⃣ Tokenize the card
      const { token, status } = await cardRef.current.tokenize();
      if (status !== "OK") throw new Error("Card tokenisation failed");

      // 2️⃣ Call our backend createPayment with the new `toBeUsedBy` field
      const resp: CreatePaymentResponse = await createPayment({
        appointmentId,
        toBeUsedBy: serviceLocationId,
        amountCents,
        nonce:       token,
      });

      if (!resp.success) {
        throw new Error("Payment failed on server");
      }
      const paymentId = resp.payment.paymentId;
      if (!paymentId) {
        throw new Error("Payment succeeded but no paymentId was returned");
      }

      // 3️⃣ Notify the parent component
      onSuccess({ transactionId: paymentId });
    } catch (e: any) {
      setError(e.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  // Show loading spinner while initialising
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
            {`PAY $${(amountCents / 100).toFixed(2)}`}
          </Button>

          <Button
            fullWidth
            sx={{ mt: 1 }}
            onClick={onCancel}
            disabled={paying}
          >
            Cancel
          </Button>
        </>
      )}
    </Box>
  );
}
