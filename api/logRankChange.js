import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

// 1) Use separate env vars
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Missing one of FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY");
}

// If you have literal "\n" in the private key, unescape them:
privateKey = privateKey.replace(/\\n/g, "\n");

// Initialize Firestore if not already done
let db;
if (!db) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  db = getFirestore();
}

export default async function handler(req, res) {
  console.log("Incoming request to /logRankChanges");
  console.log("Request method:", req.method);

  // Basic CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 1) Fetch ALL users from "telegramUsers"
    const snapshot = await db.collection("telegramUsers").get();

    // We'll build an array with user info
    const allUsers = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;

      // RANK FIELDS
      const balance = data.balance || 0;
      const refBonus = data.refBonus || 0;
      const oldRank = data.rank ?? null;
      const score = balance + refBonus; // For sorting & "mianus_balance"

      // BOT LEVEL FIELDS
      // We'll store the doc's *current* botLevel in "currentBotLevel"
      // and the user doc might have an oldBotLevel for comparison.
      const currentBotLevel = data.botLevel ?? 0;
      const oldBotLevel = data.oldBotLevel ?? 0;

      // BASIC FIELDS
      const username = data.username || "Unknown";
      const photoUrl = data.photo_url || "";

      allUsers.push({
        docId,
        username,
        photoUrl,
        oldRank,
        score,
        currentBotLevel,
        oldBotLevel,
      });
    });

    // 2) Sort them by score descending
    allUsers.sort((a, b) => b.score - a.score);

    // 3) Slice out the top 100
    const top100 = allUsers.slice(0, 100);

    // We'll build "oldOrdered" from these top100, sorted by oldRank ascending
    const oldOrdered = [...top100].sort((a, b) => {
      const rA = a.oldRank == null ? Infinity : a.oldRank;
      const rB = b.oldRank == null ? Infinity : b.oldRank;
      return rA - rB;
    });

    // newOrdered is the same top100, which is sorted by descending "score"
    const newOrdered = top100;

    const batch = db.batch();
    let eventsCreated = 0;

    // 5) Assign new rank for these top 100, detect bot buys, etc.
    for (let i = 0; i < newOrdered.length; i++) {
      const userObj = newOrdered[i];
      const newRank = i + 1;
      const oldRank = userObj.oldRank;
      const docRef = db.collection("telegramUsers").doc(userObj.docId);

      // A) DETECT BOT PURCHASES (TapBotBuy)
      // If userObj.currentBotLevel > userObj.oldBotLevel => log event
      if (userObj.currentBotLevel > userObj.oldBotLevel) {
        const docId = `TapBotBuy_${uuidv4()}`;
        await db.collection("Events").doc(docId).set({
          type: "TapBotBuy",
          username: userObj.username,
          photo_url: userObj.photoUrl,
          botLevel: userObj.currentBotLevel,
          mianus_balance: userObj.score, // balance + refBonus
          timestamp: Date.now(),
        });
        eventsCreated++;

        // We update "oldBotLevel" in the doc to the new level
        batch.update(docRef, { oldBotLevel: userObj.currentBotLevel });
      } else {
        // If no increment, keep oldBotLevel as is (or set it if it doesn't exist)
        if (userObj.oldBotLevel == null) {
          batch.update(docRef, { oldBotLevel: userObj.currentBotLevel });
        }
      }

      // B) RANK LOGIC
      if (oldRank == null) {
        // This is a new user => NewPlayerJoined
        const docId = `NewPlayerJoined_${uuidv4()}`;
        await db.collection("Events").doc(docId).set({
          type: "NewPlayerJoined",
          username: userObj.username,
          photo_url: userObj.photoUrl,
          mianus_balance: userObj.score,
          newRank,
          timestamp: Date.now(),
        });
        eventsCreated++;

        // Set rank in doc
        batch.update(docRef, { rank: newRank });
        continue;
      }

      // If rank unchanged => no event
      if (oldRank === newRank) {
        batch.update(docRef, { rank: newRank });
        continue;
      }

      // If rank improved => oldRank > newRank
      if (newRank < oldRank) {
        let overtakenUsernames = [];
        for (let r = newRank; r < oldRank; r++) {
          const idx = r - 1; // zero-based
          if (idx >= 0 && idx < oldOrdered.length) {
            const overtaken = oldOrdered[idx];
            overtakenUsernames.push(overtaken.username);
          }
        }

        // Remove self if it appears
        overtakenUsernames = overtakenUsernames.filter(
          (u) => u !== userObj.username
        );

        // if there's at least 1 user overtaken, log rank event
        if (overtakenUsernames.length > 0) {
          const docId = `RankChange_${uuidv4()}`;
          await db.collection("Events").doc(docId).set({
            type: "RankChange",
            overtaker: userObj.username,
            photo_url: userObj.photoUrl,
            mianus_balance: userObj.score,
            oldRank,
            newRank,
            overtaken: overtakenUsernames,
            timestamp: Date.now(),
          });
          eventsCreated++;
        }
      }

      // If rank decreased => no event
      batch.update(docRef, { rank: newRank });
    }

    // 6) commit batch
    await batch.commit();

    console.log(
      `Top100 rank calc complete. Created ${eventsCreated} event doc(s).`
    );

    return res.status(200).json({
      success: true,
      updatedCount: eventsCreated,
      message:
        "Top 100 rank + TapBotBuy logic complete. Created NewPlayerJoined, RankChange, or TapBotBuy events with custom doc IDs.",
    });
  } catch (err) {
    console.error("Error recalculating ranks + tapbot purchases:", err);
    return res
      .status(500)
      .json({ error: "Server error recalculating ranks + tapbot." });
  }
}