// scripts/testStores.ts
import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json' assert { type: 'json' };

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Helper to fetch a collection, returning [] if it doesn't exist
async function fetchCollection(path: string) {
  try {
    const snap = await db.collection(path).get();
    return snap.docs.map(d => d.data());
  } catch (e: any) {
    // Firestore returns code 5 for missing database/collection
    if (e.code === 5) return [];
    throw e;
  }
}

async function runTests() {
  console.log('⏳ Students:',       await fetchCollection('students'));
  console.log('⏳ Instructors:',    await fetchCollection('instructors'));
  console.log('⏳ Appointments:',   await fetchCollection('appointments'));
  console.log('⏳ Lesson Types:',   await fetchCollection('lessonTypes'));
  console.log('⏳ Schools:',        await fetchCollection('schools'));
  console.log('⏳ FAQs:',           await fetchCollection('faqs'));
  console.log('⏳ Assessments:',    await fetchCollection('assessments'));
  console.log('⏳ Payments:',       await fetchCollection('payments'));
  console.log('⏳ Vehicles:',       await fetchCollection('vehicles'));
  console.log('⏳ Packages:',       await fetchCollection('packages'));
  console.log('⏳ Notifications:',  await fetchCollection('notifications'));
}

runTests().catch(err => {
  console.error('❌ store tests failed:', err);
  process.exit(1);
});
