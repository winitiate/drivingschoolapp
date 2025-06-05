// src/hooks/navigation/useDashboardLinks.ts

/**
 * useDashboardLinks.ts
 *
 * This hook builds a navigation menu for the dashboard based on the current
 * authenticated user’s roles and their associated Firestore data. We ensure
 * all Firestore reads comply with the security rules:
 *
 *  • /serviceLocations/{locationId} can only be read by users who are superAdmin,
 *    owners of that location, or admins of that location.
 *  • /serviceProviders/{providerId} can only be read by superAdmin or the provider owner.
 *
 * Accordingly, we never call a “listAll()” on these collections. Instead:
 *  - If the user has exactly one location ID, we do a direct getDoc("/serviceLocations/{id}")
 *    (permitted by rules if the user is an owner or admin of that location).
 *  - If the user has the “serviceProvider” role, we query only for documents where
 *    userId == auth.uid (permitted by rules because reading a doc whose userId matches
 *    request.auth.uid is allowed).
 */

import { useState, useEffect, useMemo } from "react";
import type { NavItem } from "../../components/Layout/NavMenu";
import { useAuth } from "../../auth/useAuth";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export function useDashboardLinks(): NavItem[] {
  const { user, signOutUser } = useAuth();
  const db = getFirestore();

  // For single‐location naming
  const [singleLocName, setSingleLocName] = useState("Service Location");
  const [loadingLocName, setLoadingLocName] = useState(false);

  // For single‐provider selection
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerCount, setProviderCount] = useState(0);

  // ────────────────────────────────────────────────────────────────────────────
  // 1) Load single location’s name if exactly one location is owned/administered.
  //    Only read that one document via getDoc, not listAll.
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Combine ownedLocationIds and adminLocationIds, deduplicate
    const allLocIds = Array.from(
      new Set([
        ...(user.ownedLocationIds || []),
        ...(user.adminLocationIds || []),
      ])
    );

    if (allLocIds.length === 1) {
      setLoadingLocName(true);
      const singleId = allLocIds[0];

      (async () => {
        try {
          const locSnap = await getDoc(
            doc(db, "serviceLocations", singleId)
          );
          if (locSnap.exists()) {
            const locData = locSnap.data() as any;
            if (locData.name) {
              setSingleLocName(locData.name);
            }
          }
        } catch (err) {
          console.error(
            "Error fetching single serviceLocation by ID:",
            err
          );
        } finally {
          setLoadingLocName(false);
        }
      })();
    }
  }, [user, db]);

  // ────────────────────────────────────────────────────────────────────────────
  // 2) Load provider documents if the user has “serviceProvider” role.
  //    We only fetch docs where userId == auth.uid via a query.
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.roles?.includes("serviceProvider")) {
      // Not a serviceProvider role → clear any previous state
      setProviderCount(0);
      setProviderId(null);
      return;
    }

    (async () => {
      try {
        const providersQuery = query(
          collection(db, "serviceProviders"),
          where("userId", "==", user.uid)
        );
        const docsSnap = await getDocs(providersQuery);
        const matched = docsSnap.docs.map((snap) => ({
          id: snap.id,
          ...(snap.data() as any),
        }));

        setProviderCount(matched.length);
        setProviderId(matched.length === 1 ? matched[0].id : null);
      } catch (err) {
        console.error(
          "Error querying serviceProviders for userId == ",
          user.uid,
          err
        );
        setProviderCount(0);
        setProviderId(null);
      }
    })();
  }, [user, db]);

  // ────────────────────────────────────────────────────────────────────────────
  // 3) Build the navigation item list (memoized).
  // ────────────────────────────────────────────────────────────────────────────
  return useMemo<NavItem[]>(() => {
    const out: NavItem[] = [{ label: "Home", to: "/" }];

    if (!user) {
      // Not signed in → show sign-in options
      out.push(
        { label: "Client Sign In", to: "/sign-in" },
        {
          label: "Service Provider Sign In",
          to: "/service-provider/sign-in",
        },
        { label: "Business Sign In", to: "/business/sign-in" }
      );
      return out;
    }

    const {
      roles,
      ownedBusinessIds = [],
      memberBusinessIds = [],
      ownedLocationIds = [],
      adminLocationIds = [],
      clientLocationIds = [],
    } = user;

    // Super-admin
    if (roles.includes("superAdmin")) {
      out.push({ label: "Superadmin Dashboard", to: "/super-admin" });
    }

    // Business Owner / Staff
    const bizIds = Array.from(
      new Set([...ownedBusinessIds, ...memberBusinessIds])
    );
    if (bizIds.length > 1) {
      out.push({ label: "Business Owner Dashboard", to: "/business" });
    } else if (bizIds.length === 1) {
      out.push({
        label: "Business Owner Dashboard",
        to: `/business/${bizIds[0]}`,
      });
    }

    // Service-Location Admin / Owner
    const slIds = Array.from(
      new Set([...ownedLocationIds, ...adminLocationIds])
    );
    if (slIds.length > 1) {
      out.push({ label: "Service Locations", to: "/service-location" });
    } else if (slIds.length === 1) {
      out.push({
        label: loadingLocName
          ? "Loading…"
          : `${singleLocName} Dashboard`,
        to: `/service-location/${slIds[0]}`,
      });
    }

    // Service-Provider
    if (roles.includes("serviceProvider")) {
      if (providerCount > 1) {
        out.push({
          label: "Service Provider Dashboard",
          to: "/service-provider",
        });
      } else if (providerId) {
        out.push({
          label: "Service Provider Dashboard",
          to: `/service-provider/${providerId}`,
        });
      }
    }

    // Client
    if (roles.includes("client")) {
      if (clientLocationIds.length > 1) {
        out.push({ label: "Client Dashboard", to: "/client" });
      } else if (clientLocationIds.length === 1) {
        out.push({
          label: "Client Dashboard",
          to: `/client/${clientLocationIds[0]}`,
        });
      }
    }

    // Always include “Sign Out” at bottom
    out.push({ label: "Sign Out", action: () => signOutUser() });

    return out;
  }, [
    user,
    signOutUser,
    singleLocName,
    loadingLocName,
    providerId,
    providerCount,
  ]);
}
