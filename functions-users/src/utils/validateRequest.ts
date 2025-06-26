/**
 * validateRequest.ts
 *
 * Feather-weight runtime validator.  Throw HttpsError('invalid-argument', …)
 * if a required field is missing or of wrong type.
 */
import { HttpsError } from "firebase-functions/v2/https";

export function requireString(field: string, value: any): void {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpsError("invalid-argument", `${field} is required`);
  }
}
