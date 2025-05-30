import CryptoJS from "crypto-js";

// === HARDCODED DEV KEY ===
const SECRET_KEY = "b2d411dcafe98a30aaa602d913d7d006c9465bdf3b469779g";
// =========================

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
