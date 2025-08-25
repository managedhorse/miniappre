// src/lib/spendFromWallet.js
import { doc, runTransaction } from 'firebase/firestore';

export async function spendFromWallet(db, userId, cost) {
  const userRef = doc(db, 'telegramUsers', userId.toString());
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error('User not found');
    const u = snap.data();

    const balance = u.balance || 0;
    const refAccrued = u.refAccrued || 0;
    const refSpent = u.refSpent || 0;
    const refAvail = Math.max(0, refAccrued - refSpent);

    if (balance + refAvail < cost) throw new Error('INSUFFICIENT_FUNDS');

    let costLeft = cost;
    let newBalance = balance;
    let newRefSpent = refSpent;

    const useFromBalance = Math.min(newBalance, costLeft);
    newBalance -= useFromBalance;
    costLeft -= useFromBalance;

    if (costLeft > 0) {
      newRefSpent += costLeft;
      costLeft = 0;
    }

    const newRefAvail = Math.max(0, refAccrued - newRefSpent);
    const newScore = newBalance + newRefAvail;

    tx.update(userRef, {
      balance: newBalance,
      refSpent: newRefSpent,
      score: newScore,
    });

    return { balance: newBalance, refAvailable: newRefAvail, score: newScore };
  });
}
