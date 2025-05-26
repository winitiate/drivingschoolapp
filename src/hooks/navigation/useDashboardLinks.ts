// src/hooks/navigation/useDashboardLinks.ts

import { useState, useEffect, useMemo } from 'react'
import { NavItem } from '../../components/Layout/NavMenu'
import { useAuth } from '../../auth/useAuth'
import { FirestoreServiceLocationStore } from '../../data/FirestoreServiceLocationStore'
import { FirestoreServiceProviderStore } from '../../data/FirestoreServiceProviderStore'

export function useDashboardLinks(): NavItem[] {
  const { user, signOutUser } = useAuth()

  // For single‐location naming
  const [singleLocName, setSingleLocName] = useState('Service Location')
  const [loadingLocName, setLoadingLocName] = useState(false)

  // For single‐provider selection
  const [providerId, setProviderId] = useState<string | null>(null)
  const [providerCount, setProviderCount] = useState(0)

  // ——————————————————————————————————————————
  // 1) Load single location’s name if only one
  // ——————————————————————————————————————————
  useEffect(() => {
    if (!user) return
    const ids = Array.from(
      new Set([
        ...(user.ownedLocationIds || []),
        ...(user.adminLocationIds || []),
      ]),
    )
    if (ids.length === 1) {
      setLoadingLocName(true)
      const store = new FirestoreServiceLocationStore()
      const singleId = ids[0]

      // Firestore store may offer .get or fallback to .listAll()
      const load =
        typeof (store as any).get === 'function'
          ? (store as any).get(singleId)
          : store.listAll().then((all: any[]) =>
              all.find(l => l.id === singleId),
            )

      load
        .then((loc: any) => {
          if (loc?.name) setSingleLocName(loc.name)
        })
        .finally(() => {
          setLoadingLocName(false)
        })
    }
  }, [user])

  // ——————————————————————————————————————————
  // 2) Load provider docs if “serviceProvider” role
  // ——————————————————————————————————————————
  useEffect(() => {
    if (!user?.roles?.includes('serviceProvider')) return

    ;(async () => {
      const store = new FirestoreServiceProviderStore()
      const all = await store.listAll()
      const mine = all.filter(p => p.userId === user.uid)

      setProviderCount(mine.length)
      setProviderId(mine.length === 1 ? mine[0].id : null)
    })()
  }, [user])

  // ——————————————————————————————————————————
  // 3) Build nav list (memoized)
  // ——————————————————————————————————————————
  return useMemo<NavItem[]>(() => {
    const out: NavItem[] = [{ label: 'Home', to: '/' }]

    // Not signed in → show sign-in links
    if (!user) {
      out.push(
        { label: 'Client Sign In', to: '/sign-in' },
        { label: 'Service Provider Sign In', to: '/service-provider/sign-in' },
        { label: 'Business Sign In', to: '/business/sign-in' },
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
    const bizIds = Array.from(new Set([...ownedBusinessIds, ...memberBusinessIds]))
    if (bizIds.length > 1) {
      out.push({ label: 'Business Owner Dashboard', to: '/business' })
    } else if (bizIds.length === 1) {
      out.push({
        label: 'Business Owner Dashboard',
        to: `/business/${bizIds[0]}`,
      })
    }

    // Service-Location Admin / Owner
    const slIds = Array.from(
      new Set([...(user.ownedLocationIds || []), ...(user.adminLocationIds || [])]),
    )
    if (slIds.length > 1) {
      out.push({ label: 'Service Locations', to: '/service-location' })
    } else if (slIds.length === 1) {
      out.push({
        label: loadingLocName ? 'Loading…' : `${singleLocName} Dashboard`,
        to: `/service-location/${slIds[0]}`,
      })
    }

    // Service-Provider
    if (roles.includes('serviceProvider')) {
      if (providerCount > 1) {
        out.push({ label: 'Service Provider Dashboard', to: '/service-provider' })
      } else if (providerId) {
        out.push({
          label: 'Service Provider Dashboard',
          to: `/service-provider/${providerId}`,
        })
        // ← **We removed** the “My Appointments” entry here
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

    // Always include “Sign Out”
    out.push({ label: 'Sign Out', action: () => signOutUser() })

    return out
  }, [
    user,
    signOutUser,
    singleLocName,
    loadingLocName,
    providerId,
    providerCount,
  ])
}
