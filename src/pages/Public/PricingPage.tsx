// src/pages/Public/PricingPage.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import type { ServicePackage } from "../../models/ServicePackage";
import type { ServicePackageStore } from "../../data/ServicePackageStore";
import { FirestoreServicePackageStore } from "../../data/FirestoreServicePackageStore";

export default function PricingPage() {
  const navigate = useNavigate();

  // Use the interface type, assign a Firestore‐based implementation
  const pkgStore: ServicePackageStore = new FirestoreServicePackageStore();

  const [plans, setPlans] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const activePlans = await pkgStore.listAllActive();
        setPlans(activePlans);
      } catch (e: any) {
        setError(e.message || "Failed to load plans");
      } finally {
        setLoading(false);
      }
    })();
  }, [pkgStore]);

  if (loading) {
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
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Choose Your Plan
      </Typography>
      <Grid container spacing={4}>
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{plan.name}</Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {plan.description}
                </Typography>
                <Typography variant="h5" sx={{ my: 2 }}>
                  ${(plan.priceCents / 100).toFixed(2)} / {plan.interval}
                </Typography>
                <Box>
                  <Typography>
                    Max Locations:{" "}
                    {plan.maxLocations == null ? "Unlimited" : plan.maxLocations}
                  </Typography>
                  <Typography>
                    Max Providers:{" "}
                    {plan.maxProviders == null ? "Unlimited" : plan.maxProviders}
                  </Typography>
                  <Typography>
                    Max Clients:{" "}
                    {plan.maxClients == null ? "Unlimited" : plan.maxClients}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() =>
                    navigate("/business/signup", { state: { planId: plan.id } })
                  }
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
