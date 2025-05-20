// src/data/AssetStore.ts

import { Asset } from "../models/Asset";

export interface AssetStore {
  getById(id: string): Promise<Asset | null>;
  listAll(): Promise<Asset[]>;
  save(asset: Asset): Promise<void>;
}

