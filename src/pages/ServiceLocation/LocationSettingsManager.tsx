// src/pages/ServiceLocation/LocationSettingsManager.tsx
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * LocationSettingsManager
 * ------------------------------------------------------------
 * Read-only overview page for a single ServiceLocation’s settings.
 * Shows:
 *   • Appointment-type override (and list when enabled)
 *   • Booking-window override (and limits when enabled)
 *   • NEW  Self-Registration overrides (Providers / Clients / …)
 *
 * Clicking “Edit Settings” opens LocationSettingsFormDialog so the
 * user can toggle these flags.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";

import { ServiceLocation } from "../../models/ServiceLocation";
import { AppointmentType } from "../../models/AppointmentType";
import { FirestoreServiceLocationStore } from "../../data/FirestoreServiceLocationStore";
import LocationSettingsFormDialog from "../../components/ServiceLocations/LocationSettingsFormDialog";

/* ------------------------------------------------------------------ */
/*  Utils                                                              */
/* ------------------------------------------------------------------ */
const yesNo = (v?: boolean) => (v ? "Yes" : "No");

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function LocationSettingsManager() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  const store = useMemo(() => new FirestoreServiceLocationStore(), []);

  const [location, setLocation] = useState<ServiceLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ───────── Fetch location ───────── */
  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);
    try {
      const loc = await store.getById(serviceLocationId);
      setLocation(loc);
    } catch (e: any) {
      setError(e.message || "Failed to load location");
    } finally {
      setLoading(false);
    }
  }, [serviceLocationId, store]);

  useEffect(() => {
    reload();
  }, [reload]);

  /* ───────── Save handler from dialog ───────── */
  const handleSave = useCallback(
    async (updated: ServiceLocation) => {
      setError(null);
      try {
        await store.save(updated);
        setDialogOpen(false);
        await reload();
      } catch (e: any) {
        setError(e.message || "Failed to save settings");
      }
    },
    [store, reload]
  );

  /* ------------------------------------------------------------------ */
  /*  Render states                                                     */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <Box textAlign="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  if (!location) return null;

  /* Destructure new self-registration flags (with defaults) */
  const selfReg = (location as any).selfRegister ?? {};
  const {
    provider: selfProv = false,
    client: selfClient = false,
    locationAdmin: selfLocAdmin = false,
    owner: selfOwner = false,
  } = selfReg;

  /* ------------------------------------------------------------------ */
  /*  Main view                                                         */
  /* ------------------------------------------------------------------ */
  return (
    <Box p={4}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">
          Settings for “{location.name}”
        </Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Edit Settings
        </Button>
      </Box>

      {/* ───────── Appointment-Type Override ───────── */}
      <Box mb={3}>
        <Typography variant="h6">Appointment Types Override</Typography>
        <Typography>
          Override enabled:{" "}
          {yesNo(location.allowAppointmentTypeOverride)}
        </Typography>

        {location.allowAppointmentTypeOverride && (
          <Paper variant="outlined" sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Buffer&nbsp;Before</TableCell>
                  <TableCell>Buffer&nbsp;After</TableCell>
                  <TableCell>Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(location.locationAppointmentTypes || []).map(
                  (t: AppointmentType) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.title}</TableCell>
                      <TableCell>{t.durationMinutes}</TableCell>
                      <TableCell>{t.bufferBeforeMinutes}</TableCell>
                      <TableCell>{t.bufferAfterMinutes}</TableCell>
                      <TableCell>{t.price}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>

      {/* ───────── Booking-Window Override ───────── */}
      <Box mb={3}>
        <Typography variant="h6">Booking Window Override</Typography>
        <Typography>
          Override enabled: {yesNo(location.allowNoticeWindowOverride)}
        </Typography>

        {location.allowNoticeWindowOverride && (
          <Box sx={{ mt: 1 }}>
            <Typography>
              Min notice&nbsp;(hrs): {location.minNoticeHours}
            </Typography>
            <Typography>
              Max advance&nbsp;(days): {location.maxAdvanceDays}
            </Typography>
          </Box>
        )}
      </Box>

      {/* ───────── NEW: Self-Registration Overrides ───────── */}
      <Box mb={3}>
        <Typography variant="h6">Self-Registration Overrides</Typography>
        <Typography>Providers&nbsp;:&nbsp;{yesNo(selfProv)}</Typography>
        <Typography>Clients&nbsp;:&nbsp;{yesNo(selfClient)}</Typography>
        <Typography>
          Location&nbsp;Admins&nbsp;:&nbsp;{yesNo(selfLocAdmin)}
        </Typography>
        <Typography>
          Business&nbsp;Owners&nbsp;:&nbsp;{yesNo(selfOwner)}
        </Typography>
      </Box>

      {/* Edit dialog */}
      <LocationSettingsFormDialog
        open={dialogOpen}
        initialData={location}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
