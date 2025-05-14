// scripts/seedFirstUser.js
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import path from 'path';

async function seedUser() {
  // 1) Load your service account key (adjust path if needed)
  const keyPath = path.resolve('./serviceAccountKey.json');
  const keyJson = await readFile(keyPath, 'utf8');
  const serviceAccount = JSON.parse(keyJson);

  // 2) Initialize the Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  // 3) Upsert your user
  const uid = 'Kmwp1BVkXQT6tH09G9pt4xAn7oz2'; // ← your seeded UID
  const ref = db.collection('users').doc(uid);

  await ref.set(
    {
      uid,
      email:     'shayanr@gmail.com',
      firstName: 'Shayan',
      lastName:  'Rahimi',
      phone:     '2369781919',
      roles:     ['student', 'schoolAdmin', 'instructor', 'superAdmin'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`✅ Seeded user ${uid}`);
  process.exit(0);
}

seedUser().catch((err) => {
  console.error('❌ Error seeding user:', err);
  process.exit(1);
});
