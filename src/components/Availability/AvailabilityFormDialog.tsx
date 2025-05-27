// src/components/Availability/AvailabilityFormDialog.tsx

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  IconButton,
  TextField,
} from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import {
  DatePicker,
  DateTimePicker,
  TimePicker,
} from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'

import type {
  Availability,
  DailySchedule,
  DailySlot,
} from '../../models/Availability'

const weekdayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

interface BlockPeriod {
  start: Dayjs
  end:   Dayjs
  allDay: boolean
}

export interface AvailabilityFormDialogProps {
  open: boolean
  initialData?: Availability
  scope: Availability['scope']
  scopeId: string
  onClose: () => void
  onSave: (avail: Availability) => void
}

export default function AvailabilityFormDialog({
  open,
  initialData,
  scope,
  scopeId,
  onClose,
  onSave,
}: AvailabilityFormDialogProps) {
  // --- Form State ---
  const [weekly, setWeekly] = useState<DailySchedule[]>([])
  const [blocked, setBlocked] = useState<BlockPeriod[]>([])
  const [maxPerDay, setMaxPerDay] = useState<number | ''>('')

  // --- Initialize from initialData or defaults ---
  useEffect(() => {
    // 7-day default
    const defaults = weekdayNames.map((_, idx) => ({
      weekday: idx as DailySchedule['weekday'],
      slots: [] as DailySlot[],
    }))
    if (!initialData) {
      setWeekly(defaults)
      setBlocked([])
      setMaxPerDay('')
    } else {
      // weekly
      const byDay = new Map<number, DailySchedule>()
      initialData.weekly.forEach(ds => byDay.set(ds.weekday, ds))
      setWeekly(
        defaults.map(d =>
          byDay.get(d.weekday) || { ...d, slots: [] }
        )
      )
      // blocked
      setBlocked(
        initialData.blocked.map(str => {
          // if it's a range (YYYY-MM-DD_YYYY-MM-DD) or single date
          const parts = str.split('_')
          const start = dayjs(parts[0], 'YYYY-MM-DDTHH:mm')
          const end = parts[1]
            ? dayjs(parts[1], 'YYYY-MM-DDTHH:mm')
            : start.endOf('day')
          const allDay = parts.length === 1 || parts[0].endsWith('T00:00')
          return { start, end, allDay }
        })
      )
      // max
      setMaxPerDay(
        initialData.maxPerDay != null ? initialData.maxPerDay : ''
      )
    }
  }, [initialData])

  // --- Weekday handlers ---
  const toggleDay = (wd: number, open: boolean) => {
    setWeekly(w =>
      w.map(d =>
        d.weekday === wd
          ? {
              ...d,
              slots: open
                ? d.slots.length
                  ? d.slots
                  : [{ start: '09:00', end: '17:00' }]
                : [],
            }
          : d
      )
    )
  }
  const addSlot = (wd: number) =>
    setWeekly(w =>
      w.map(d =>
        d.weekday === wd
          ? {
              ...d,
              slots: [...d.slots, { start: '09:00', end: '10:00' }],
            }
          : d
      )
    )
  const removeSlot = (wd: number, idx: number) =>
    setWeekly(w =>
      w.map(d =>
        d.weekday === wd
          ? { ...d, slots: d.slots.filter((_, i) => i !== idx) }
          : d
      )
    )
  const updateSlot = (
    wd: number,
    idx: number,
    field: 'start' | 'end',
    dt: Dayjs | null
  ) => {
    if (!dt) return
    setWeekly(w =>
      w.map(d =>
        d.weekday === wd
          ? {
              ...d,
              slots: d.slots.map((s, i) =>
                i === idx
                  ? { ...s, [field]: dt.format('HH:mm') }
                  : s
              ),
            }
          : d
      )
    )
  }

  // --- Blocked periods handlers ---
  const addBlock = () =>
    setBlocked(b => [
      ...b,
      {
        start: dayjs(),
        end: dayjs().add(1, 'hour'),
        allDay: true,
      },
    ])
  const updateBlock = (
    idx: number,
    field: 'start' | 'end',
    val: Dayjs | null
  ) => {
    if (!val) return
    setBlocked(b =>
      b.map((blk, i) =>
        i === idx ? { ...blk, [field]: val } : blk
      )
    )
  }
  const toggleAllDay = (idx: number, allDay: boolean) =>
    setBlocked(b =>
      b.map((blk, i) =>
        i === idx ? { ...blk, allDay } : blk
      )
    )
  const removeBlock = (idx: number) =>
    setBlocked(b => b.filter((_, i) => i !== idx))

  // --- Save ---
  const handleSave = () => {
    const out: Availability = {
      id: initialData?.id,
      scope,
      scopeId,
      weekly,
      blocked: blocked.map(blk => {
        // encode single or range, including time if needed
        const fmt = blk.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm'
        return blk.allDay
          ? `${blk.start.format('YYYY-MM-DD')}_${blk.end.format('YYYY-MM-DD')}`
          : `${blk.start.format(fmt)}_${blk.end.format(fmt)}`
      }),
      maxPerDay: typeof maxPerDay === 'number' ? maxPerDay : undefined,
      createdAt: initialData?.createdAt,
      updatedAt: initialData?.updatedAt,
    }
    onSave(out)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Edit Availability</DialogTitle>
        <DialogContent dividers>
          {/* Weekly Schedule */}
          <Typography gutterBottom>
            Toggle each day “On” to open it and add time slots.
          </Typography>
          {weekly.map(ds => {
            const isOpen = ds.slots.length > 0
            return (
              <Box key={ds.weekday} mb={3}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography fontWeight="bold">
                    {weekdayNames[ds.weekday]}
                  </Typography>
                  <Switch
                    checked={isOpen}
                    onChange={(_, v) =>
                      toggleDay(ds.weekday, v)
                    }
                  />
                </Box>

                {isOpen && (
                  <Box pl={2} mt={1}>
                    {ds.slots.map((s, i) => (
                      <Box
                        key={i}
                        display="flex"
                        alignItems="center"
                        mb={1}
                      >
                        <TimePicker
                          label="Start"
                          value={dayjs(s.start, 'HH:mm')}
                          onChange={v =>
                            updateSlot(
                              ds.weekday,
                              i,
                              'start',
                              v
                            )
                          }
                          renderInput={props => (
                            <TextField
                              {...props}
                              size="small"
                              sx={{ mr: 1, width: 110 }}
                            />
                          )}
                        />
                        <TimePicker
                          label="End"
                          value={dayjs(s.end, 'HH:mm')}
                          onChange={v =>
                            updateSlot(
                              ds.weekday,
                              i,
                              'end',
                              v
                            )
                          }
                          renderInput={props => (
                            <TextField
                              {...props}
                              size="small"
                              sx={{ mr: 1, width: 110 }}
                            />
                          )}
                        />
                        <IconButton
                          size="small"
                          onClick={() =>
                            removeSlot(ds.weekday, i)
                          }
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    ))}

                    <Button
                      startIcon={<Add />}
                      size="small"
                      onClick={() => addSlot(ds.weekday)}
                    >
                      Add Slot
                    </Button>
                  </Box>
                )}
              </Box>
            )
          })}

          {/* Blocked Periods */}
          <Box mt={2} mb={3}>
            <Typography fontWeight="bold" gutterBottom>
              Blocked Periods
            </Typography>
            {blocked.map((blk, i) => (
              <Box
                key={i}
                display="flex"
                alignItems="center"
                mb={2}
              >
                <Switch
                  checked={blk.allDay}
                  onChange={(_, v) => toggleAllDay(i, v)}
                />
                <Typography sx={{ mr: 2 }}>
                  {blk.allDay ? 'All-day' : 'Custom time'}
                </Typography>

                {blk.allDay ? (
                  <>
                    <DatePicker
                      label="From"
                      value={blk.start}
                      onChange={d =>
                        updateBlock(i, 'start', d)
                      }
                      slotProps={{ textField: { size: 'small' } }}
                      sx={{ mr: 1, width: 140 }}
                    />
                    <DatePicker
                      label="To"
                      value={blk.end}
                      onChange={d =>
                        updateBlock(i, 'end', d)
                      }
                      slotProps={{ textField: { size: 'small' } }}
                      sx={{ mr: 1, width: 140 }}
                    />
                  </>
                ) : (
                  <>
                    <DateTimePicker
                      label="From"
                      value={blk.start}
                      onChange={d =>
                        updateBlock(i, 'start', d)
                      }
                      slotProps={{
                        textField: { size: 'small' },
                      }}
                      sx={{ mr: 1, width: 180 }}
                    />
                    <DateTimePicker
                      label="To"
                      value={blk.end}
                      onChange={d =>
                        updateBlock(i, 'end', d)
                      }
                      slotProps={{
                        textField: { size: 'small' },
                      }}
                      sx={{ mr: 1, width: 180 }}
                    />
                  </>
                )}

                <IconButton
                  size="small"
                  onClick={() => removeBlock(i)}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}

            <Button
              startIcon={<Add />}
              onClick={addBlock}
              size="small"
            >
              Add Blocked Period
            </Button>
          </Box>

          {/* Max per Day */}
          <Box mb={2}>
            <Typography fontWeight="bold" gutterBottom>
              Max Appointments Per Day
            </Typography>
            <TextField
              fullWidth
              type="number"
              placeholder="Leave blank for no limit"
              value={maxPerDay}
              onChange={e => {
                const v = e.target.value
                setMaxPerDay(
                  v === '' ? '' : Math.max(0, +v)
                )
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}
