// lib/spendFromWallet.js
import { runTransaction, doc } from 'firebase/firestore';

export async function spendFromWallet(db, uid, amount) {
  const userRef = doc(db, 'telegramUsers', uid.toString());

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error('NOT_FOUND');

    const d = snap.data() || {};
    const balance = Number(d.balance) || 0;

    // Legacy-safe referral accounting
    const acc   = Number(d.refAccrued ?? d.refBonus ?? 0); // accrued total
    const spent = Number(d.refSpent) || 0;                 // spent from accrued
    const refAvail = Math.max(0, acc - spent);

    if (amount > balance + refAvail) {
      throw new Error('INSUFFICIENT_FUNDS');
    }

    // take from main first, then referral pool
    const useFromMain = Math.min(amount, balance);
    const useFromRef  = amount - useFromMain;

    const newBalance   = +(balance - useFromMain).toFixed(6);
    const newRefSpent  = spent + useFromRef;
    const newRefAvail  = Math.max(0, acc - newRefSpent);
    const newScore     = newBalance + newRefAvail;

    const updates = {
      balance: newBalance,
      refSpent: newRefSpent,
      score: newScore,
    };
    // Promote legacy field once so future math uses refAccrued/refSpent
    if (d.refAccrued == null && (d.refBonus != null)) {
      updates.refAccrued = acc;
    }

    tx.update(userRef, updates);
    return { balance: newBalance, refAvailable: newRefAvail };
  });
}