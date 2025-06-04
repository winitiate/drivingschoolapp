// src/TestQueryUsers.tsx

import React, { useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // ← adjust the path if your firebase.ts is elsewhere

type Props = {
  testEmail: string;
};

export default function TestQueryUsers({ testEmail }: Props) {
  useEffect(() => {
    async function runTest() {
      try {
        // Build a query: “find any /users doc where email == testEmail”
        const q = query(
          collection(db, "users"),
          where("email", "==", testEmail)
        );
        const snap = await getDocs(q);
        console.log(
          "🎉 [TestQueryUsers] query succeeded – number of matches:",
          snap.size
        );
        snap.docs.forEach((docSnap) => {
          console.log("   • doc.id =", docSnap.id, "data =", docSnap.data());
        });
      } catch (err) {
        console.error("🛑 [TestQueryUsers] query blocked:", err);
      }
    }
    runTest();
  }, [testEmail]);

  return (
    <div style={{ padding: 16, background: "#f9f9f9", border: "1px solid #ddd" }}>
      <p>
        Running Firestore test query for <code>users.email == "{testEmail}"</code>.
        <br />
        (Check the console for results.)
      </p>
    </div>
  );
}
