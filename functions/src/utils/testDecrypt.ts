import { decrypt } from "./encryption";

const cipher = process.argv[2]!;
const plain  = decrypt(cipher);

console.log("Decrypted length:", plain.length);
console.log("Decrypted token :", plain);
