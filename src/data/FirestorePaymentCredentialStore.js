// src/data/FirestorePaymentCredentialStore.ts
import { db } from "../firebase";
import { collection, query, where, getDocs, setDoc, Timestamp, doc, } from "firebase/firestore";
import { encrypt, decrypt } from "../utils/encryption";
const COLLECTION = "paymentCredentials";
export class FirestorePaymentCredentialStore {
    constructor() {
        this.collRef = collection(db, COLLECTION);
    }
    async getByOwner(provider, ownerType, ownerId) {
        // Query by provider, ownerType, ownerId AND ensure toBeUsedBy = ownerId
        const q = query(this.collRef, where("provider", "==", provider), where("ownerType", "==", ownerType), where("ownerId", "==", ownerId), where("toBeUsedBy", "==", ownerId));
        const snap = await getDocs(q);
        if (snap.empty)
            return null;
        const docSnap = snap.docs[0];
        const raw = docSnap.data();
        // Decrypt the accessToken before returning
        return {
            id: docSnap.id,
            ...raw,
            credentials: {
                ...raw.credentials,
                accessToken: raw.credentials.accessToken
                    ? decrypt(raw.credentials.accessToken)
                    : "",
            },
        };
    }
    async save(credential) {
        const now = Timestamp.now();
        // Use existing docRef if id is present, else generate a new one
        const docRef = credential.id !== undefined
            ? doc(db, COLLECTION, credential.id)
            : doc(this.collRef);
        // Strip out `id`, Firestore key lives in docRef.id
        const { id, ...rest } = credential;
        const payload = {
            ...rest,
            // Encrypt the accessToken at rest
            credentials: {
                ...rest.credentials,
                accessToken: rest.credentials.accessToken
                    ? encrypt(rest.credentials.accessToken)
                    : "",
            },
            createdAt: rest.createdAt || now,
            updatedAt: now,
        };
        // Merge so we don’t clobber any unrelated fields
        await setDoc(docRef, payload, { merge: true });
    }
}
