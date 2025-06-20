"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/testStores.ts
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccountKey_json_1 = __importDefault(require("../serviceAccountKey.json"));
// Initialize Admin SDK
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccountKey_json_1.default),
});
const db = firebase_admin_1.default.firestore();
// Helper to fetch a collection, returning [] if it doesn't exist
async function fetchCollection(path) {
    try {
        const snap = await db.collection(path).get();
        return snap.docs.map(d => d.data());
    }
    catch (e) {
        // Firestore returns code 5 for missing database/collection
        if (e.code === 5)
            return [];
        throw e;
    }
}
async function runTests() {
    console.log('⏳ Students:', await fetchCollection('students'));
    console.log('⏳ Instructors:', await fetchCollection('instructors'));
    console.log('⏳ Appointments:', await fetchCollection('appointments'));
    console.log('⏳ Lesson Types:', await fetchCollection('lessonTypes'));
    console.log('⏳ Schools:', await fetchCollection('schools'));
    console.log('⏳ FAQs:', await fetchCollection('faqs'));
    console.log('⏳ Assessments:', await fetchCollection('assessments'));
    console.log('⏳ Payments:', await fetchCollection('payments'));
    console.log('⏳ Vehicles:', await fetchCollection('vehicles'));
    console.log('⏳ Packages:', await fetchCollection('packages'));
    console.log('⏳ Notifications:', await fetchCollection('notifications'));
}
runTests().catch(err => {
    console.error('❌ store tests failed:', err);
    process.exit(1);
});
