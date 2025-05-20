// src/data/FirestoreAssetStore.ts

import { Asset } from "../models/Asset";
import { AssetStore } from "./AssetStore";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";

const ASSETS_COLLECTION = "assets";

export class FirestoreAssetStore implements AssetStore {
  private collRef: CollectionReference = collection(db, ASSETS_COLLECTION);

  async getById(id: string): Promise<Asset | null> {
    const docRef: DocumentReference = doc(db, ASSETS_COLLECTION, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...(snap.data() as Asset) } : null;
  }

  async listAll(): Promise<Asset[]> {
    const snaps = await getDocs(this.collRef);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Asset) }));
  }

  async save(asset: Asset): Promise<void> {
    const now = Timestamp.now();
    const id = asset.id || doc(this.collRef).id;
    const ref = doc(db, ASSETS_COLLECTION, id);
    await setDoc(ref, { ...asset, createdAt: asset.createdAt || now, updatedAt: now }, { merge: true });
  }
}

