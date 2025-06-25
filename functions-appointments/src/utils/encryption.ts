/**
 * encryption.ts
 *
 * AES encrypt/decrypt helpers using crypto-js.
 * - decrypt() to read stored tokens
 * - encrypt() to write new ones
 *
 * NOTE: Move SECRET_KEY to an env var for production.
 */
import CryptoJS from "crypto-js";

// TODO: Replace with process.env.SECRET_KEY in prod
const SECRET_KEY = "b2d411dcafe98a30aaa602d913d7d006c9465bdf3b469779g";

/** Decrypts a Base64-AES-encrypted string */
export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/** Encrypts plaintext to Base64-AES (for future save upserts) */
export function encrypt(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, SECRET_KEY).toString();
}
