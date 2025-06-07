import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Grid,
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import type { SubscriptionPackage } from "../../models/SubscriptionPackage";
import { SubscriptionPackageStore } from "../../data/SubscriptionPackageStore";
import { FirestoreSubscriptionPackageStore } from "../../data/FirestoreSubscriptionPackageStore";

export default function PricingPage() {
  const navigate = useNavigate();

  const pkgStore: SubscriptionPackageStore = useMemo(
    () => new FirestoreSubscriptionPackageStore(),
    []
  );

  const [plans, setPlans] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const all = await pkgStore.listAllActive();
        if (!canceled) {
          // filter out hidden ones
          setPlans(all.filter((p) => p.visible));
        }
      } catch (e: any) {
        if (!canceled) {
          setError(e.message || "Failed to load plans");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [pkgStore]);

  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Choose Your Monthly Plan
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {plans.length === 0 && (
          <Grid item xs={12}>
            <Typography align="center">No plans available.</Typography>
          </Grid>
        )}

        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card
              variant="outlined"
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {plan.title}
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="textSecondary"
                  gutterBottom
                >
                  {plan.description || "—"}
                </Typography>
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 500, lineHeight: 1, my: 2 }}
                >
                  ${(plan.priceCents / 100).toFixed(2)}{" "}
                  <Typography
                    component="span"
                    variant="subtitle2"
                    color="textSecondary"
                  >
                    / month
                  </Typography>
                </Typography>
                <Typography>
                  Max Locations: {plan.maxLocations ?? "Unlimited"}
                </Typography>
                <Typography>
                  Max Providers: {plan.maxProviders ?? "Unlimited"}
                </Typography>
                <Typography>
                  Max Clients: {plan.maxClients ?? "Unlimited"}
                </Typography>
              </CardContent>

              <CardActions sx={{ p: 2 }}>
                {plan.callToAction === "contact" ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate("/contact")}
                  >
                    Contact for a Quote
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() =>
                      navigate("/business/sign-up", { state: { planId: plan.id } })
                    }
                  >
                    Get Started
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
