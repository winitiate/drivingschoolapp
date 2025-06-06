// src/pages/Business/CheckoutPage.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
} from "@mui/material";
import { useAuth } from "../../auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import type { ServicePackage } from "../../models/ServicePackage";
import type { ServicePackageStore } from "../../data/ServicePackageStore";
import { FirestoreServicePackageStore } from "../../data/FirestoreServicePackageStore";

interface LocationState {
  planId?: string;
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation<LocationState>();
  const planId = location.state?.planId;

  // Use abstraction to fetch the plan
  const pkgStore: ServicePackageStore = new FirestoreServicePackageStore();

  const [plan, setPlan] = useState<ServicePackage | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);

  // 1) If not signed in, redirect to signup (preserving planId in state)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/business/signup", { state: { planId } });
    }
  }, [authLoading, user, planId, navigate]);

  // 2) Fetch the chosen plan
  useEffect(() => {
    if (planId) {
      (async () => {
        setLoadingPlan(true);
        setError(null);
        try {
          const p = await pkgStore.getById(planId);
          if (!p) throw new Error("Selected plan not found");
          setPlan(p);
        } catch (e: any) {
          setError(e.message || "Failed to load selected plan");
        } finally {
          setLoadingPlan(false);
        }
      })();
    } else {
      setError("No plan selected");
      setLoadingPlan(false);
    }
  }, [planId, pkgStore]);

  // 3) Call Cloud Function to create a Stripe Checkout Session
  const handleSubscribe = async () => {
    setCreatingSession(true);
    setError(null);

    try {
      // Replace <REGION> and <PROJECT> with your actual Cloud Functions domain
      const CREATE_FN_URL =
        "https://us-central1-<PROJECT>.cloudfunctions.net/createSubscription";

      const resp = await fetch(CREATE_FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user!.uid, planId }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json.error || "Failed to create subscription");
      }

      // Redirect the browser to Stripe Checkout
      window.location.assign(json.sessionUrl);
    } catch (e: any) {
      setError(e.message || "Subscription creation failed");
      setCreatingSession(false);
    }
  };

  if (authLoading || loadingPlan) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Confirm Subscription
      </Typography>
      <Typography>
        Plan: <b>{plan!.name}</b>
      </Typography>
      <Typography>
        Price: <b>${(plan!.priceCents / 100).toFixed(2)} / {plan!.interval}</b>
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubscribe}
          disabled={creatingSession}
        >
          {creatingSession ? <CircularProgress size={20} /> : "Proceed to Payment"}
        </Button>
      </Box>
    </Container>
  );
}
