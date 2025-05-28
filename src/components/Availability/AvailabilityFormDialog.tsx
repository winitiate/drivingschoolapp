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
  // form state
  const [weekly, setWeekly] = useState<DailySchedule[]>([])
  const [blocked, setBlocked] = useState<BlockPeriod[]>([])
  const [maxPerDay, setMaxPerDay] = useState<number | ''>('')
  const [maxConcurrent, setMaxConcurrent] = useState<number | ''>('')

  // initialize
  useEffect(() => {
    const defaults = weekdayNames.map((_, i) => ({
      weekday: i as DailySchedule['weekday'],
      slots: [] as DailySlot[],
    }))
    if (!initialData) {
      setWeekly(defaults)
      setBlocked([])
      setMaxPerDay('')
      setMaxConcurrent('')
    } else {
      // weekly
      const mapByDay = new Map<number, DailySchedule>()
      initialData.weekly.forEach(ds => mapByDay.set(ds.weekday, ds))
      setWeekly(defaults.map(d => mapByDay.get(d.weekday) || d))
      // blocked
      setBlocked(
        initialData.blocked.map(str => {
          const [from, to] = str.split('_')
          const start = dayjs(from)
          const end = to ? dayjs(to) : start.endOf('day')
          const allDay = !to || from.endsWith('T00:00')
          return { start, end, allDay }
        })
      )
      // limits
      setMaxPerDay(initialData.maxPerDay ?? '')
      setMaxConcurrent(initialData.maxConcurrent ?? '')
    }
  }, [initialData])

  // weekday handlers
  const toggleDay = (wd: number, on: boolean) =>
    setWeekly(w =>
      w.map(d =>
        d.weekday === wd
          ? {
              ...d,
              slots: on
                ? d.slots.length
                  ? d.slots
                  : [{ start: '09:00', end: '17:00' }]
                : [],
            }
          : d
      )
    )
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

  // blocked handlers
  const addBlock = () =>
    setBlocked(b => [
      ...b,
      { start: dayjs(), end: dayjs().add(1, 'hour'), allDay: true },
    ])
  const updateBlock = (
    i: number,
    field: 'start' | 'end',
    val: Dayjs | null
  ) => {
    if (!val) return
    setBlocked(b =>
      b.map((blk, idx) => (idx === i ? { ...blk, [field]: val } : blk))
    )
  }
  const toggleAllDay = (i: number, allDay: boolean) =>
    setBlocked(b =>
      b.map((blk, idx) => (idx === i ? { ...blk, allDay } : blk))
    )
  const removeBlock = (i: number) =>
    setBlocked(b => b.filter((_, idx) => idx !== i))

  // save
  const handleSave = () => {
    // sanitize weekly: ensure each entry has weekday + slots only
    const sanitizedWeekly: DailySchedule[] = weekly.map(ws => ({
      weekday: ws.weekday,
      slots: ws.slots.map(s => ({
        start: s.start,
        end: s.end,
      })),
    }))

    const out: Availability = {
      id: initialData?.id,
      scope,
      scopeId,
      weekly: sanitizedWeekly,
      blocked: blocked.map(blk => {
        const fmt = blk.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm'
        return `${blk.start.format(fmt)}_${blk.end.format(fmt)}`
      }),
      maxPerDay: typeof maxPerDay === 'number' ? maxPerDay : undefined,
      maxConcurrent:
        typeof maxConcurrent === 'number' ? maxConcurrent : undefined,
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
          {/* Max simultaneous */}
          <Box mb={3}>
            <Typography fontWeight="bold" gutterBottom>
              Max simultaneous clients
            </Typography>
            <TextField
              fullWidth
              type="number"
              placeholder="Leave blank for one at a time"
              value={maxConcurrent}
              onChange={e => {
                const v = e.target.value
                setMaxConcurrent(v === '' ? '' : Math.max(1, +v))
              }}
            />
          </Box>

          {/* weekly schedule */}
          <Typography gutterBottom>
            Toggle each day “On” to open it, then add slots below.
          </Typography>
          {weekly.map(ds => {
            const isOpen = ds.slots.length > 0
            return (
              <Box key={ds.weekday} mb={3} width="100%">
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography fontWeight="bold">
                    {weekdayNames[ds.weekday]}
                  </Typography>
                  <Switch
                    sx={{ marginLeft: 'auto' }}
                    checked={isOpen}
                    onChange={(_, v) =>
                      toggleDay(ds.weekday, v)
                    }
                  />
                </Box>
                {isOpen && (
                  <Box pl={2}>
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
                            updateSlot(ds.weekday, i, 'start', v)
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
                            updateSlot(ds.weekday, i, 'end', v)
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

          {/* blocked periods */}
          <Box mb={3}>
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
                  {blk.allDay ? 'All-day' : 'Specific time'}
                </Typography>
                {blk.allDay ? (
                  <>
                    <DatePicker
                      label="From"
                      value={blk.start}
                      onChange={d => updateBlock(i, 'start', d)}
                      slotProps={{ textField: { size: 'small' } }}
                      sx={{ mr: 1, width: 140 }}
                    />
                    <DatePicker
                      label="To"
                      value={blk.end}
                      onChange={d => updateBlock(i, 'end', d)}
                      slotProps={{ textField: { size: 'small' } }}
                      sx={{ mr: 1, width: 140 }}
                    />
                  </>
                ) : (
                  <>
                    <DateTimePicker
                      label="From"
                      value={blk.start}
                      onChange={d => updateBlock(i, 'start', d)}
                      slotProps={{ textField: { size: 'small' } }}
                      sx={{ mr: 1, width: 180 }}
                    />
                    <DateTimePicker
                      label="To"
                      value={blk.end}
                      onChange={d => updateBlock(i, 'end', d)}
                      slotProps={{ textField: { size: 'small' } }}
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

          {/* max per day */}
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
