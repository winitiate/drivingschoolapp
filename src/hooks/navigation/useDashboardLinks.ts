// src/hooks/navigation/useDashboardLinks.ts

import { useState, useEffect, useMemo } from 'react'
import { NavItem } from '../../components/Layout/NavMenu'
import { useAuth } from '../../auth/useAuth'
import { FirestoreServiceLocationStore } from '../../data/FirestoreServiceLocationStore'

export function useDashboardLinks(): NavItem[] {
  const { user, signOutUser } = useAuth()
  const [singleLocName, setSingleLocName] = useState<string>('Service Location')
  const [loadingLocName, setLoadingLocName] = useState<boolean>(false)

  // If the user only has one service-location, fetch its name
  useEffect(() => {
    if (!user) return
    const ids = Array.from(new Set([
      ...(user.ownedLocationIds || []),
      ...(user.adminLocationIds || []),
    ]))
    if (ids.length === 1) {
      setLoadingLocName(true)
      const store = new FirestoreServiceLocationStore()
      const id = ids[0]
      if (typeof store.get === 'function') {
        store.get(id)
          .then(loc => loc?.name && setSingleLocName(loc.name))
          .finally(() => setLoadingLocName(false))
      } else {
        store.listAll()
          .then(all => {
            const loc = all.find(l => l.id === id)
            if (loc?.name) setSingleLocName(loc.name)
          })
          .finally(() => setLoadingLocName(false))
      }
    }
  }, [
    user?.ownedLocationIds?.join(','),
    user?.adminLocationIds?.join(','),
  ])

  return useMemo<NavItem[]>(() => {
    const out: NavItem[] = [{ label: 'Home', to: '/' }]

    // 👉 Not signed in → show all available sign-in flows
    if (!user) {
      out.push(
        { label: 'Client Sign In',            to: '/sign-in' },
        { label: 'Service Provider Sign In',  to: '/service-provider/sign-in' },
        { label: 'Business Sign In',          to: '/business/sign-in' },
      )
      return out
    }

    const {
      roles,
      ownedBusinessIds = [],
      memberBusinessIds = [],
      providerLocationIds = [],
      clientLocationIds = [],
    } = user

    // Super-admin
    if (roles.includes('superAdmin')) {
      out.push({ label: 'Superadmin Dashboard', to: '/super-admin' })
    }

    // Business Owner / Staff
    const bizIds = Array.from(new Set([
      ...ownedBusinessIds,
      ...memberBusinessIds,
    ]))
    if (bizIds.length > 1) {
      out.push({ label: 'Business Owner Dashboard', to: '/business' })
    } else if (bizIds.length === 1) {
      out.push({
        label: 'Business Owner Dashboard',
        to: `/business/${bizIds[0]}`,
      })
    }

    // Service-Location Admin / Owner
    const slIds = Array.from(new Set([
      ...(user.ownedLocationIds || []),
      ...(user.adminLocationIds || []),
    ]))
    if (slIds.length > 1) {
      out.push({ label: 'Service Locations', to: '/service-location' })
    } else if (slIds.length === 1) {
      out.push({
        label: loadingLocName
          ? 'Loading…'
          : `${singleLocName} Dashboard`,
        to: `/service-location/${slIds[0]}`,
      })
    }

    // Service-Provider
    if (roles.includes('serviceProvider')) {
      if (providerLocationIds.length > 1) {
        out.push({
          label: 'Service Provider Dashboard',
          to: '/service-provider',
        })
      } else if (providerLocationIds.length === 1) {
        out.push({
          label: 'Service Provider Dashboard',
          to: `/service-provider/${providerLocationIds[0]}`,
        })
      }
    }

    // Client
    if (roles.includes('client')) {
      if (clientLocationIds.length > 1) {
        out.push({ label: 'Client Dashboard', to: '/client' })
      } else if (clientLocationIds.length === 1) {
        out.push({
          label: 'Client Dashboard',
          to: `/client/${clientLocationIds[0]}`,
        })
      }
    }

    // Sign Out
    out.push({ label: 'Sign Out', action: () => signOutUser() })

    return out
  }, [
    user,
    signOutUser,
    singleLocName,
    loadingLocName,
  ])
}
