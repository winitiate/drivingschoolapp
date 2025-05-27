import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";

import { FirestoreAvailabilityStore } from "../../data/FirestoreAvailabilityStore";
import type { Availability } from "../../models/Availability";
import AvailabilityFormDialog from "../../components/Availability/AvailabilityFormDialog";

export default function ServiceProviderAvailabilityPage() {
  const { serviceProviderId } = useParams<{ serviceProviderId: string }>();
  const store = useMemo(() => new FirestoreAvailabilityStore(), []);

  const [availability, setAvailability] = useState<Availability | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!serviceProviderId) return;
    setLoading(true);
    setError(null);
    try {
      const av = await store.getByScope("provider", serviceProviderId);
      setAvailability(av);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [serviceProviderId, store]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSave = async (newAvail: Availability) => {
    await store.save({
      ...newAvail,
      scope: "provider",
      scopeId: serviceProviderId!,
    });
    setDialogOpen(false);
    // reload so we get the doc ID, timestamps, etc.
    reload();
  };

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
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        My Weekly Availability
      </Typography>

      {!availability ? (
        <Typography color="textSecondary">
          No availability set yet.
        </Typography>
      ) : (
        availability.weekly.map((ds) => {
          const slots = ds.slots
            .map((s) => `${s.start} – ${s.end}`)
            .join(", ");
          return (
            <Box key={ds.weekday} mb={1}>
              <Typography fontWeight="bold">
                {[
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ][ds.weekday]}
              </Typography>
              <Typography>{slots || "Closed"}</Typography>
            </Box>
          );
        })
      )}

      {availability?.blocked.length ? (
        <Box mt={2}>
          <Typography fontWeight="bold">Blocked Dates</Typography>
          <Typography>{availability.blocked.join(", ")}</Typography>
        </Box>
      ) : null}

      {availability?.maxPerDay != null ? (
        <Box mt={2}>
          <Typography fontWeight="bold">
            Max Appointments/Day
          </Typography>
          <Typography>{availability.maxPerDay}</Typography>
        </Box>
      ) : null}

      <Box mt={3}>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Edit Availability
        </Button>
      </Box>

      {dialogOpen && (
        <AvailabilityFormDialog
          open={dialogOpen}
          initialData={availability || undefined}
          scope="provider"
          scopeId={serviceProviderId!}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
        />
      )}
    </Box>
  );
}
