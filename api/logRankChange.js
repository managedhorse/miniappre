// /api/logRankChange.js

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// We'll parse the JSON credentials from env:
const serviceAccountJson = process.env.FIREBASE_ADMIN_CREDENTIALS;

if (!serviceAccountJson) {
  throw new Error("Missing FIREBASE_ADMIN_CREDENTIALS env var");
}

let db;

// Ensure Firebase is only initialized once:
if (!db) {
  // Parse the big JSON string
  const serviceAccount = JSON.parse(serviceAccountJson);

  initializeApp({
    credential: cert(serviceAccount),
  });

  db = getFirestore();
}

export default async function handler(req, res) {
  console.log("Incoming request to /logRankChange");
  console.log("Request method:", req.method);

  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userId, oldRank, newRank, overtakenUserId } = req.body;

  if (!userId || oldRank == null || newRank == null) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const timestamp = Date.now();
    await db.collection("Events").add({
      type: "RankChange",
      userId,
      oldRank,
      newRank,
      overtakenUserId: overtakenUserId ?? null,
      timestamp,
    });

    console.log("Rank change logged for user:", userId);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error logging rank change:", err);
    return res.status(500).json({ error: "Server error logging rank change." });
  }
}
