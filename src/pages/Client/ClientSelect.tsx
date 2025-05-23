// src/pages/Client/ClientSelect.tsx

import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, List, ListItemButton, ListItemText } from '@mui/material'
import { useAuth } from '../../auth/useAuth'

export default function ClientSelect() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const ids = useMemo(() => user?.clientLocationIds || [], [user])

  useEffect(() => {
    if (!user) return
    if (ids.length === 1) {
      navigate(`/client/${ids[0]}`)
    } else if (ids.length === 0) {
      navigate('/')
    }
  }, [user, ids, navigate])

  if (ids.length <= 1) return null

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Select a Client Profile
      </Typography>
      <List>
        {ids.map((id) => (
          <ListItemButton
            key={id}
            onClick={() => navigate(`/client/${id}`)}
          >
            <ListItemText primary={id} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}
