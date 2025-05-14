// src/data/FirestoreFAQStore.ts
import { FAQ }                       from "../models/FAQ";
import { FAQStore }                  from "./FAQStore";
import { db }                         from "../firebase";
import { collection, doc, getDoc, getDocs, query, where, setDoc, Timestamp } from "firebase/firestore";

const FAQ_COLLECTION = "faqs";

export class FirestoreFAQStore implements FAQStore {
  async getById(id: string): Promise<FAQ | null> {
    const snap = await getDoc(doc(db, FAQ_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as FAQ) };
  }

  async listAll(): Promise<FAQ[]> {
    const snaps = await getDocs(collection(db, FAQ_COLLECTION));
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as FAQ) }));
  }

  async listActive(): Promise<FAQ[]> {
    const q = query(collection(db, FAQ_COLLECTION), where("active", "==", true));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as FAQ) }));
  }

  async save(faq: FAQ): Promise<void> {
    const now = Timestamp.now();
    const id  = faq.id || doc(collection(db, FAQ_COLLECTION)).id;
    await setDoc(doc(db, FAQ_COLLECTION, id), {
      ...faq,
      createdAt: faq.createdAt || now,
      updatedAt: now,
    });
  }
}