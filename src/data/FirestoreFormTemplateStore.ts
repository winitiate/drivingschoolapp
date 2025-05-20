// src/data/FirestoreFormTemplateStore.ts

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { FormTemplate } from '../models/FormTemplate';
import { FormTemplateStore } from './FormTemplateStore';

const COLLECTION = 'formTemplates';

function toEntity(id: string, data: any): FormTemplate {
  return {
    id,
    title: data.title,
    description: data.description,
    fields: data.fields,
    entityType: data.entityType,
    ownerType: data.ownerType,
    ownerId: data.ownerId,
    // ← pull editableBy out of Firestore, default to []
    editableBy: Array.isArray(data.editableBy) ? data.editableBy : [],
    // BaseEntity
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
    status: data.status,
  };
}

export class FirestoreFormTemplateStore implements FormTemplateStore {
  private db = getFirestore();
  private coll = collection(this.db, COLLECTION);

  async getById(id: string): Promise<FormTemplate | null> {
    const snap = await getDoc(doc(this.db, COLLECTION, id));
    if (!snap.exists()) return null;
    return toEntity(snap.id, snap.data());
  }

  async listByOwner(ownerType: FormTemplate['ownerType'], ownerId?: string): Promise<FormTemplate[]> {
    let q;
    if (ownerType === 'global') {
      q = query(this.coll, where('ownerType', '==', 'global'));
    } else {
      q = query(
        this.coll,
        where('ownerType', '==', ownerType),
        where('ownerId', '==', ownerId || '')
      );
    }
    const snaps = await getDocs(q);
    return snaps.docs.map(d => toEntity(d.id, d.data()));
  }

  async save(template: FormTemplate): Promise<void> {
    const now = Timestamp.now();
    const ref = template.id
      ? doc(this.db, COLLECTION, template.id)
      : doc(this.coll);

    // Spread in editableBy so it gets saved
    const payload = {
      ...template,
      createdAt: template.createdAt
        ? Timestamp.fromDate(template.createdAt)
        : now,
      updatedAt: now,
    };

    await setDoc(ref, payload, { merge: true });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLLECTION, id));
  }
}
