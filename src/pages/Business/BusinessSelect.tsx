// src/pages/Business/BusinessSelect.tsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material'
import { useAuth } from '../../auth/useAuth'
import { businessStore } from '../../data'
import { Business } from '../../models/Business'

export default function BusinessSelect() {
  const { user, loading: authLoading } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && user) {
      const ids = Array.from(new Set([
        ...(user.ownedBusinessIds || []),
        ...(user.memberBusinessIds || [])
      ]))

      if (ids.length === 0) {
        setBusinesses([])
        setLoading(false)
      } else if (ids.length === 1) {
        // only one business → go straight there
        navigate(`/business/${ids[0]}`)
      } else {
        businessStore.listAll()
          .then(all => {
            const assigned = all.filter(b => ids.includes(b.id))
            setBusinesses(assigned)
          })
          .catch(e => setError(e.message || 'Failed to load businesses'))
          .finally(() => setLoading(false))
      }
    }
  }, [authLoading, user, navigate])

  if (authLoading || loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box mt={2} mx="auto" maxWidth={600}>
      <Typography variant="h6" gutterBottom>
        Select Your Business
      </Typography>
      <List>
        {businesses.map(business => (
          <ListItemButton
            key={business.id}
            onClick={() => navigate(`/business/${business.id}`)}
          >
            <ListItemText primary={business.name || business.id} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}
