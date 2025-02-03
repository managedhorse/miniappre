import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountJson = process.env.FIREBASE_ADMIN_CREDENTIALS;
if (!serviceAccountJson) {
  throw new Error("Missing FIREBASE_ADMIN_CREDENTIALS env var");
}

let db;
if (!db) {
  const serviceAccount = JSON.parse(serviceAccountJson);
  initializeApp({
    credential: cert(serviceAccount),
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
      const balance = data.balance || 0;
      const refBonus = data.refBonus || 0;
      const oldRank = data.rank ?? null;
      const score = balance + refBonus;

      const userId = data.userId || docId;
      const username = data.username || "Unknown";

      allUsers.push({
        docId,
        userId,
        username,
        oldRank,
        score,
      });
    });

    // 2) Sort them by score descending
    allUsers.sort((a, b) => b.score - a.score);

    // 3) Slice out the top 100
    const top100 = allUsers.slice(0, 100);

    // We'll build "oldOrdered" from these top100, sorted by oldRank ascending
    // so that oldOrdered[0] is old rank #1 among this subset.
    const oldOrdered = [...top100].sort((a, b) => {
      const rA = a.oldRank == null ? Infinity : a.oldRank;
      const rB = b.oldRank == null ? Infinity : b.oldRank;
      return rA - rB;
    });

    // 4) newOrdered is the top 100 sorted by score (already sorted)
    //    i.e. top100
    const newOrdered = top100;

    const batch = db.batch();
    const events = [];

    // 5) Assign new rank for these top 100
    for (let i = 0; i < newOrdered.length; i++) {
      const userObj = newOrdered[i];
      const newRank = i + 1; // rank among top 100
      const oldRank = userObj.oldRank;
      const docRef = db.collection("telegramUsers").doc(userObj.docId);

      // if rank unchanged or user had no oldRank, do minimal or skip event
      if (oldRank == null || oldRank === newRank) {
        batch.update(docRef, { rank: newRank });
        continue;
      }

      // *Multiple* overtaken approach but in *one* event doc:
      if (newRank < oldRank) {
        // user improved
        // e.g. oldRank=10, newRank=7 => they jumped over ranks 9, 8, 7
        const overtakenUsers = [];

        for (let r = newRank; r < oldRank; r++) {
          const idx = r - 1; // zero-based
          if (idx >= 0 && idx < oldOrdered.length) {
            const overtaken = oldOrdered[idx];
            overtakenUsers.push({
              userId: overtaken.userId,
              username: overtaken.username,
            });
          }
        }

        events.push({
          type: "RankChange",
          userId: userObj.userId,
          username: userObj.username,
          oldRank,
          newRank,
          // single event doc with array of all overtaken
          overtaken: overtakenUsers,
          timestamp: Date.now(),
        });
      } else {
        // if user lost rank, we skip event or do something else
        // e.g. they were rank=7, now rank=10 => no "overtook" event needed
      }

      // Update the doc's new rank
      batch.update(docRef, { rank: newRank });
    }

    // 6) commit batch
    await batch.commit();

    // 7) add events to "Events"
    const eventWrites = events.map((ev) => db.collection("Events").add(ev));
    await Promise.all(eventWrites);

    console.log(
      `Top100 rank calc complete. Updated ${events.length} user(s) with multi-overtake arrays.`
    );

    return res.status(200).json({
      success: true,
      updatedCount: events.length,
      message:
        "Recalculated rank for top 100 users (balance + refBonus), multiple overtaken stored in single event doc.",
    });
  } catch (err) {
    console.error("Error recalculating ranks:", err);
    return res
      .status(500)
      .json({ error: "Server error recalculating ranks." });
  }
}
