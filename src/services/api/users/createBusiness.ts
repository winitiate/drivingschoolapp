/**
 * createBusiness.ts
 * --------------------------------------------------------------------------
 * Front-end wrapper for the Cloud Function **createBusiness**.
 *
 * Usage:
 *   import { createBusiness } from "../../services";
 *
 *   const result = await createBusiness({
 *     name:        "Go Karting",
 *     ownerEmail:  "owner@example.com",
 *     phone:       "604-123-4567",
 *     address:     { street: "123 Main", city: "Vancouver", country: "CA" },
 *   });
 */

import { httpsCallable } from "firebase/functions";
// 🔗  Path must climb three levels to reach src/firebase.ts
import { functions } from "../../../firebase";

/* ------------------------------------------------------------------ */
/*  Types that match your Cloud Function signature                    */
/* ------------------------------------------------------------------ */
export interface CreateBusinessInput {
  name: string;
  ownerEmail: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  notes?: string;
}

export interface CreateBusinessResult {
  success: boolean;
  businessId: string;
  ownerUid: string;
}

/* ------------------------------------------------------------------ */
/*  Wrapper                                                            */
/* ------------------------------------------------------------------ */
export async function createBusiness(
  data: CreateBusinessInput
): Promise<CreateBusinessResult> {
  const fn = httpsCallable<CreateBusinessInput, CreateBusinessResult>(
    functions,
    "createBusiness"
  );
  const res = await fn(data);
  return res.data;
}
