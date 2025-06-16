// functions/src/utils/testDecrypt.ts

/**
 * testDecrypt.ts
 *
 * A quick script to verify that our encryption utility is working correctly.
 * 
 * - Adjust `encryptedPayload` below to the string you want to decrypt.
 * - Run `npm run build` (to compile) and then `node lib/utils/testDecrypt.js`
 *   (or use your emulator) to see the decrypted output.
 */

import { decrypt } from "./encryption";  // no “.ts” extension so imports resolve under CommonJS

// Replace this with your actual encrypted string to test decryption
const encryptedPayload = "YOUR_ENCRYPTED_STRING_HERE";

try {
  const decrypted = decrypt(encryptedPayload);
  console.log("Decrypted payload:", decrypted);
} catch (err) {
  console.error("Error decrypting payload:", err);
}
