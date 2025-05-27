// src/pages/Business/Settings/BusinessAvailabilityPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { DateCalendar, PickersDay } from '@mui/x-date-pickers';

import { FirestoreAvailabilityStore } from '../../../data/FirestoreAvailabilityStore';
import type { Availability, DailySchedule } from '../../../models/Availability';

export default function BusinessAvailabilityPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const store = new FirestoreAvailabilityStore();

  const [data, setData] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);

  // load or initialize
  useEffect(() => {
    if (!businessId) return;
    store.getByScope('business', businessId).then((doc) => {
      if (doc) {
        setData(doc);
      } else {
        setData({
          scope: 'business',
          scopeId: businessId,
          weekly: Array.from({ length: 7 }, (_, i) => ({
            weekday: i as DailySchedule['weekday'],
            slots: [],
          })),
          blocked: [],
          maxPerDay: undefined,
        });
      }
    }).finally(() => setLoading(false));
  }, [businessId]);

  if (loading || !data) {
    return <Box p={4}><Typography>Loading availability…</Typography></Box>;
  }

  const saveField = (changes: Partial<Availability>) => {
    setData((d) => (d ? { ...d, ...changes } : d));
  };

  const toggleBlocked = (dayIso: string) => {
    const blocked = data.blocked.includes(dayIso)
      ? data.blocked.filter((d) => d !== dayIso)
      : [...data.blocked, dayIso];
    saveField({ blocked });
  };

  const addSlot = (weekday: number) => {
    const weekly = data.weekly.map((day) =>
      day.weekday === weekday
        ? { ...day, slots: [...day.slots, { start: '09:00', end: '10:00' }] }
        : day
    );
    saveField({ weekly });
  };

  const updateSlot = (
    weekday: number,
    idx: number,
    slot: { start: string; end: string }
  ) => {
    const weekly = data.weekly.map((day) =>
      day.weekday === weekday
        ? {
            ...day,
            slots: day.slots.map((s, i) => (i === idx ? slot : s)),
          }
        : day
    );
    saveField({ weekly });
  };

  const removeSlot = (weekday: number, idx: number) => {
    const weekly = data.weekly.map((day) =>
      day.weekday === weekday
        ? { ...day, slots: day.slots.filter((_, i) => i !== idx) }
        : day
    );
    saveField({ weekly });
  };

  const handleSave = async () => {
    await store.save(data);
    alert('Availability saved');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Business Availability
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Weekly Schedule</Typography>
          {data.weekly.map((day) => {
            const name = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day.weekday];
            return (
              <Box key={day.weekday} sx={{ mb: 2 }}>
                <Typography><strong>{name}</strong></Typography>
                {day.slots.map((slot, idx) => (
                  <Grid container spacing={1} alignItems="center" key={idx} sx={{ mb: 1 }}>
                    <Grid item xs={3}>
                      <TextField
                        label="Start"
                        type="time"
                        fullWidth
                        value={slot.start}
                        onChange={(e) =>
                          updateSlot(day.weekday, idx, { ...slot, start: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        label="End"
                        type="time"
                        fullWidth
                        value={slot.end}
                        onChange={(e) =>
                          updateSlot(day.weekday, idx, { ...slot, end: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Button color="error" onClick={() => removeSlot(day.weekday, idx)}>
                        Remove
                      </Button>
                    </Grid>
                  </Grid>
                ))}
                <Button onClick={() => addSlot(day.weekday)}>+ Add Slot</Button>
                <Divider sx={{ my: 2 }} />
              </Box>
            );
          })}
          <TextField
            label="Max Appointments/Day"
            type="number"
            value={data.maxPerDay ?? ''}
            onChange={(e) =>
              saveField({ maxPerDay: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Block Specific Dates</Typography>
          <DateCalendar
            date={null}
            onChange={(d) => d && toggleBlocked(d.format('YYYY-MM-DD'))}
            renderDay={(day, _value, DayProps) => (
              <PickersDay
                {...DayProps}
                disabled={data.blocked.includes(day.format('YYYY-MM-DD'))}
              />
            )}
          />
        </CardContent>
      </Card>

      <Button variant="contained" onClick={handleSave}>
        Save Availability
      </Button>
    </Box>
  );
}
