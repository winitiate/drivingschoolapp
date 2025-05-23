// src/pages/ServiceProvider/ServiceProviderSelect.tsx

import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, List, ListItemButton, ListItemText } from '@mui/material'
import { useAuth } from '../../auth/useAuth'

export default function ServiceProviderSelect() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // providerLocationIds may be undefined
  const ids = useMemo(() => user?.providerLocationIds || [], [user])

  useEffect(() => {
    if (!user) return
    if (ids.length === 1) {
      navigate(`/service-provider/${ids[0]}`)
    } else if (ids.length === 0) {
      navigate('/')
    }
  }, [user, ids, navigate])

  if (ids.length <= 1) return null

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Select a Service Provider Location
      </Typography>
      <List>
        {ids.map((id) => (
          <ListItemButton
            key={id}
            onClick={() => navigate(`/service-provider/${id}`)}
          >
            <ListItemText primary={id} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}
