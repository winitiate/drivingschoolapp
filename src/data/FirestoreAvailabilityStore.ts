// src/data/FirestoreAvailabilityStore.ts

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from 'firebase/firestore'
import type { Availability } from '../models/Availability'
import type { AvailabilityStore } from './AvailabilityStore'

export class FirestoreAvailabilityStore implements AvailabilityStore {
  private db = getFirestore()
  private coll = collection(this.db, 'availabilities')       // <-- plural

  /** Fetch the single Availability for a given scope+scopeId */
  async getByScope(
    scope: Availability['scope'],
    scopeId: string
  ): Promise<Availability | null> {
    const q = query(
      this.coll,
      where('scope', '==', scope),
      where('scopeId', '==', scopeId)
    )
    const snaps = await getDocs(q)
    if (snaps.empty) return null
    const d = snaps.docs[0]
    return { id: d.id, ...(d.data() as Availability) }
  }

  /** Return *all* Availability documents */
  async listAll(): Promise<Availability[]> {
    const snaps = await getDocs(this.coll)
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Availability) }))
  }

  /** Create or update an Availability record */
  async save(avail: Availability): Promise<void> {
    // determine doc ID
    const id = avail.id || doc(this.coll).id
    // build a clean payload, never including undefined
    const payload: any = {
      scope: avail.scope,
      scopeId: avail.scopeId,
      weekly: avail.weekly || [],
      blocked: avail.blocked || [],
    }
    // only set maxPerDay if provided, otherwise explicitly null to clear
    payload.maxPerDay =
      avail.maxPerDay != null ? avail.maxPerDay : null

    // only set maxConcurrent if provided, otherwise null
    payload.maxConcurrent =
      avail.maxConcurrent != null ? avail.maxConcurrent : null

    // perform the merge
    await setDoc(
      doc(this.db, 'availabilities', id),
      payload,
      { merge: true }
    )
  }
}
