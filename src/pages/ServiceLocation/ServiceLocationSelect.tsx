// src/pages/ServiceLocation/ServiceLocationSelect.tsx

import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, List, ListItemButton, ListItemText } from '@mui/material'
import { useAuth } from '../../auth/useAuth'

export default function ServiceLocationSelect() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // combine owned + admin IDs, dedupe
  const ids = useMemo(
    () =>
      Array.from(
        new Set([
          ...(user?.ownedLocationIds || []),
          ...(user?.adminLocationIds || []),
        ])
      ),
    [user]
  )

  useEffect(() => {
    if (!user) return
    if (ids.length === 1) {
      navigate(`/service-location/${ids[0]}`)
    } else if (ids.length === 0) {
      navigate('/')
    }
  }, [user, ids, navigate])

  // nothing to render while redirecting for 0 or 1
  if (ids.length <= 1) return null

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Select a Service Location
      </Typography>
      <List>
        {ids.map((id) => (
          <ListItemButton
            key={id}
            onClick={() => navigate(`/service-location/${id}`)}
          >
            <ListItemText primary={id} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}
