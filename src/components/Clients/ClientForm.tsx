import React from 'react'
import { Grid, TextField, Checkbox, FormControlLabel } from '@mui/material'
import type { Client } from '../../models/Client'

interface Props {
  form: Partial<Client> & {
    firstName: string
    lastName: string
    email: string
    dateOfBirthStr: string
    learnerPermitExpiryStr: string
    roadTestAppointmentStr: string
    skillsMasteredStr: string
    otherDocsStr: string
  }
  onChange(
    data: Partial<Client> & {
      firstName?: string
      lastName?: string
      email?: string
      dateOfBirthStr?: string
      learnerPermitExpiryStr?: string
      roadTestAppointmentStr?: string
      skillsMasteredStr?: string
      otherDocsStr?: string
    }
  ): void
}

export default function ClientForm({ form, onChange }: Props) {
  return (
    <Grid container spacing={2}>
      {/* User profile */}
      <Grid item xs={12} sm={4}>
        <TextField
          label="First Name"
          fullWidth
          value={form.firstName}
          onChange={e => onChange({ firstName: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Last Name"
          fullWidth
          value={form.lastName}
          onChange={e => onChange({ lastName: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          value={form.email}
          onChange={e => onChange({ email: e.target.value })}
        />
      </Grid>

      {/* License / DOB */}
      <Grid item xs={6} sm={3}>
        <TextField
          label="License #"
          fullWidth
          value={form.licenceNumber || ''}
          onChange={e => onChange({ licenceNumber: e.target.value })}
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField
          label="License Class"
          fullWidth
          value={form.licenceClass || ''}
          onChange={e => onChange({ licenceClass: e.target.value })}
        />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField
          label="Date of Birth"
          type="date"
          InputLabelProps={{ shrink: true }}
          fullWidth
          value={form.dateOfBirthStr}
          onChange={e => onChange({ dateOfBirthStr: e.target.value })}
        />
      </Grid>

      {/* Address */}
      <Grid item xs={12} sm={4}>
        <TextField
          label="Street"
          fullWidth
          value={form.address?.street || ''}
          onChange={e =>
            onChange({
              address: {
                ...(form.address || { street: '', city: '', postalCode: '' }),
                street: e.target.value,
              },
            })
          }
        />
      </Grid>
      <Grid item xs={6} sm={4}>
        <TextField
          label="City"
          fullWidth
          value={form.address?.city || ''}
          onChange={e =>
            onChange({
              address: {
                ...(form.address || { street: '', city: '', postalCode: '' }),
                city: e.target.value,
              },
            })
          }
        />
      </Grid>
      <Grid item xs={6} sm={4}>
        <TextField
          label="Postal Code"
          fullWidth
          value={form.address?.postalCode || ''}
          onChange={e =>
            onChange({
              address: {
                ...(form.address || { street: '', city: '', postalCode: '' }),
                postalCode: e.target.value,
              },
            })
          }
        />
      </Grid>

      {/* Permit Expiry */}
      <Grid item xs={12} sm={4}>
        <TextField
          label="Permit Expiry"
          type="date"
          InputLabelProps={{ shrink: true }}
          fullWidth
          value={form.learnerPermitExpiryStr}
          onChange={e => onChange({ learnerPermitExpiryStr: e.target.value })}
        />
      </Grid>

      {/* Emergency Contact */}
      <Grid item xs={4}>
        <TextField
          label="Emergency Name"
          fullWidth
          value={form.emergencyContact?.name || ''}
          onChange={e =>
            onChange({
              emergencyContact: {
                ...(form.emergencyContact || { name: '', relation: '', phone: '' }),
                name: e.target.value,
              },
            })
          }
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Relation"
          fullWidth
          value={form.emergencyContact?.relation || ''}
          onChange={e =>
            onChange({
              emergencyContact: {
                ...(form.emergencyContact || { name: '', relation: '', phone: '' }),
                relation: e.target.value,
              },
            })
          }
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          label="Phone"
          fullWidth
          value={form.emergencyContact?.phone || ''}
          onChange={e =>
            onChange({
              emergencyContact: {
                ...(form.emergencyContact || { name: '', relation: '', phone: '' }),
                phone: e.target.value,
              },
            })
          }
        />
      </Grid>

      {/* Road Test */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Road Test Appt"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          fullWidth
          value={form.roadTestAppointmentStr}
          onChange={e => onChange({ roadTestAppointmentStr: e.target.value })}
        />
      </Grid>

      {/* Banned */}
      <Grid item xs={12} sm={6}>
        <FormControlLabel
          control={
            <Checkbox
              checked={form.banned || false}
              onChange={e => onChange({ banned: e.target.checked })}
            />
          }
          label="Banned"
        />
      </Grid>
      {form.banned && (
        <Grid item xs={12}>
          <TextField
            label="Ban Reason"
            fullWidth
            value={form.banReason || ''}
            onChange={e => onChange({ banReason: e.target.value })}
          />
        </Grid>
      )}

      {/* Progress */}
      <Grid item xs={6}>
        <TextField
          label="Total Lessons"
          type="number"
          fullWidth
          value={form.progress?.totalLessons ?? 0}
          onChange={e =>
            onChange({
              progress: {
                ...(form.progress || { totalLessons: 0, skillsMastered: [] }),
                totalLessons: parseInt(e.target.value, 10),
              },
            })
          }
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Skills Mastered (comma)"
          fullWidth
          value={form.skillsMasteredStr}
          onChange={e => onChange({ skillsMasteredStr: e.target.value })}
        />
      </Grid>

      {/* Docs */}
      <Grid item xs={12} sm={4}>
        <TextField
          label="License Copy URL"
          fullWidth
          value={form.docs?.licenceCopyUrl || ''}
          onChange={e =>
            onChange({
              docs: {
                ...(form.docs || { licenceCopyUrl: '', permitCopyUrl: '', other: [] }),
                licenceCopyUrl: e.target.value,
              },
            })
          }
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Permit Copy URL"
          fullWidth
          value={form.docs?.permitCopyUrl || ''}
          onChange={e =>
            onChange({
              docs: {
                ...(form.docs || { licenceCopyUrl: '', permitCopyUrl: '', other: [] }),
                permitCopyUrl: e.target.value,
              },
            })
          }
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Other Docs (comma URLs)"
          fullWidth
          value={form.otherDocsStr}
          onChange={e => onChange({ otherDocsStr: e.target.value })}
        />
      </Grid>
    </Grid>
  )
}
