// src/data/BusinessSettingsStore.ts

import { BusinessSettings } from "../models/BusinessSettings";

export interface BusinessSettingsStore {
  /** Fetch settings for a given business, or null if none exist yet */
  getByBusinessId(businessId: string): Promise<BusinessSettings | null>;

  /** Create or update the settings record for a business */
  save(settings: BusinessSettings): Promise<void>;
}
