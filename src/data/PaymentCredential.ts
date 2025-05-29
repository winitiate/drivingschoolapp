// src/models/PaymentCredential.ts

import { Timestamp } from "firebase/firestore";

export type PaymentCredential = {
  id?: string;
  provider: "square" | "stripe" | "paypal"; // extensible
  ownerType: "business" | "serviceLocation" | "serviceProvider";
  ownerId: string;
  credentials: {
    accessToken: string;
    [key: string]: any; // for future use (e.g. accountId, apiKey)
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
