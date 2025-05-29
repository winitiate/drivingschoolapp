// src/data/PaymentCredentialStore.ts

import { PaymentCredential } from "../models/PaymentCredential";

export interface PaymentCredentialStore {
  getByOwner(
    provider: string,
    ownerType: string,
    ownerId: string
  ): Promise<PaymentCredential | null>;

  save(credential: PaymentCredential): Promise<void>;
}
