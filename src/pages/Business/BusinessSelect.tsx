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
      setLoading(true)
      setError(null)

      // 1) Fetch businesses where user is an owner
      const ownerPromise = businessStore.queryByOwner(user.uid)

      // 2) Fetch businesses where user is a member
      const memberPromise = businessStore.queryByMember(user.uid)

      Promise.all([ownerPromise, memberPromise])
        .then(([ownedList, memberList]) => {
          const combined: Business[] = []
          const seen = new Set<string>()

          // Add owned businesses first
          for (const b of ownedList) {
            combined.push(b)
            seen.add(b.id)
          }

          // Add member businesses if not already included
          for (const b of memberList) {
            if (!seen.has(b.id)) {
              combined.push(b)
              seen.add(b.id)
            }
          }

          if (combined.length === 0) {
            setBusinesses([])
            setLoading(false)
          } else if (combined.length === 1) {
            // Only one business → go straight there
            navigate(`/business/${combined[0].id}`, { replace: true })
          } else {
            setBusinesses(combined)
            setLoading(false)
          }
        })
        .catch((e) => {
          setError(e.message || 'Failed to load businesses')
          setLoading(false)
        })
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
