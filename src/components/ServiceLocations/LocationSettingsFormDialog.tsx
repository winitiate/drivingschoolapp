/**
 * LocationSettingsFormDialog.tsx
 * --------------------------------------------------------------------------
 * Lets owners / location-admins override appointment-type, booking-window,
 * **and now per-role self-registration** settings for a single location.
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Box,
  IconButton,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { ServiceLocation } from "../../models/ServiceLocation";
import { AppointmentType } from "../../models/AppointmentType";
import type { SelfRegisterSettings } from "../../models/Business"; // ← NEW

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */
interface Props {
  open: boolean;
  initialData: ServiceLocation;
  onClose: () => void;
  onSave: (loc: ServiceLocation) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function LocationSettingsFormDialog({
  open,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [data, setData] = useState<ServiceLocation>(initialData);

  /* keep dialog state fresh */
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  /* generic flag toggler (existing) */
  const toggleFlag = (key: keyof ServiceLocation, value: boolean) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  /* generic field setter (existing) */
  const handleField = (key: keyof ServiceLocation, value: any) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  /* NEW: toggle per-role self-registration flag */
  const toggleSelfReg = (
    key: keyof SelfRegisterSettings,
    value: boolean
  ) => {
    setData((d) => ({
      ...d,
      selfRegister: { ...(d.selfRegister || {}), [key]: value },
    }));
  };

  /* add blank appointment-type row (existing) */
  const addType = () => {
    const newType: AppointmentType = {
      id: `temp-${Date.now()}`,
      serviceLocationId: initialData.id!,
      title: "",
      durationMinutes: 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      price: 0,
      order: (data.locationAppointmentTypes?.length || 0) + 1,
      createdAt: undefined,
      updatedAt: undefined,
    };
    setData((d) => ({
      ...d,
      locationAppointmentTypes: [
        ...(d.locationAppointmentTypes || []),
        newType,
      ],
    }));
  };

  /* update individual AppointmentType field (existing) */
  const updateTypeField = (
    idx: number,
    field: keyof AppointmentType,
    value: any
  ) => {
    const updated = [...(data.locationAppointmentTypes || [])];
    (updated[idx] as any)[field] = value;
    setData((d) => ({ ...d, locationAppointmentTypes: updated }));
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Edit Location Overrides</DialogTitle>

      <DialogContent dividers>
        {/* ───────────────── Appointment-type override ───────────────── */}
        <Box mb={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!data.allowAppointmentTypeOverride}
                onChange={(e) =>
                  toggleFlag("allowAppointmentTypeOverride", e.target.checked)
                }
              />
            }
            label="Allow Appointment-Type Overrides"
          />
        </Box>

        {data.allowAppointmentTypeOverride && (
          <Box mb={3}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1">Appointment Types</Typography>
              <IconButton onClick={addType}>
                <AddIcon />
              </IconButton>
            </Box>

            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Buffer Before</TableCell>
                    <TableCell>Buffer After</TableCell>
                    <TableCell>Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.locationAppointmentTypes || []).map((t, idx) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <TextField
                          value={t.title}
                          onChange={(e) =>
                            updateTypeField(idx, "title", e.target.value)
                          }
                          margin="dense"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={t.durationMinutes}
                          onChange={(e) =>
                            updateTypeField(
                              idx,
                              "durationMinutes",
                              Number(e.target.value)
                            )
                          }
                          margin="dense"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={t.bufferBeforeMinutes}
                          onChange={(e) =>
                            updateTypeField(
                              idx,
                              "bufferBeforeMinutes",
                              Number(e.target.value)
                            )
                          }
                          margin="dense"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={t.bufferAfterMinutes}
                          onChange={(e) =>
                            updateTypeField(
                              idx,
                              "bufferAfterMinutes",
                              Number(e.target.value)
                            )
                          }
                          margin="dense"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={t.price}
                          onChange={(e) =>
                            updateTypeField(idx, "price", Number(e.target.value))
                          }
                          margin="dense"
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* ───────────────── Booking-window override ─────────────────── */}
        <Box mb={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!data.allowNoticeWindowOverride}
                onChange={(e) =>
                  toggleFlag("allowNoticeWindowOverride", e.target.checked)
                }
              />
            }
            label="Allow Booking-Window Override"
          />
        </Box>

        {data.allowNoticeWindowOverride && (
          <Box mb={3}>
            <TextField
              type="number"
              label="Min Notice Hours"
              value={data.minNoticeHours || 0}
              onChange={(e) =>
                handleField("minNoticeHours", Number(e.target.value))
              }
              fullWidth
              margin="dense"
            />
            <TextField
              type="number"
              label="Max Advance Days"
              value={data.maxAdvanceDays || 0}
              onChange={(e) =>
                handleField("maxAdvanceDays", Number(e.target.value))
              }
              fullWidth
              margin="dense"
            />
          </Box>
        )}

        {/* ─────────────── Self-Registration overrides ──────────────── */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Self-Registration Overrides
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={!!data.selfRegister?.provider}
                onChange={(e) =>
                  toggleSelfReg("provider", e.target.checked)
                }
              />
            }
            label="Providers"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={!!data.selfRegister?.client}
                onChange={(e) => toggleSelfReg("client", e.target.checked)}
              />
            }
            label="Clients"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={!!data.selfRegister?.locationAdmin}
                onChange={(e) =>
                  toggleSelfReg("locationAdmin", e.target.checked)
                }
              />
            }
            label="Location Admins"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={!!data.selfRegister?.owner}
                onChange={(e) => toggleSelfReg("owner", e.target.checked)}
              />
            }
            label="Business Owners"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(data)}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
