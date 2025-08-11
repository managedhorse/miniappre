import crypto from 'crypto';
import admin from 'firebase-admin';

// --- Firebase Admin init (env var holds full service account JSON) ---
if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON env var');
  }
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
  });
}
const db = admin.firestore();

// --- Verify Telegram initData per docs ---
function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return { ok: false, reason: 'MISSING_INITDATA_OR_TOKEN' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, reason: 'MISSING_HASH' };

  // Build data_check_string (exclude 'hash', sort keys)
  const entries = [];
  for (const [k, v] of params) {
    if (k === 'hash') continue;
    entries.push(`${k}=${v}`);
  }
  entries.sort();
  const dataCheckString = entries.join('\n');

  // secretKey = sha256(botToken)
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Constant-time compare
  const a = Buffer.from(hmac, 'hex');
  const b = Buffer.from(hash, 'hex');
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!valid) return { ok: false, reason: 'INVALID_SIGNATURE' };

  // Optional freshness check (auth_date is unix time seconds)
  const authDate = Number(params.get('auth_date') || 0);
  if (authDate > 0) {
    const ageSec = Math.floor(Date.now() / 1000) - authDate;
    // allow up to 10 minutes
    if (ageSec > 600) return { ok: false, reason: 'INITDATA_TOO_OLD' };
  }

  // Parse user from initData
  const userStr = params.get('user');
  if (!userStr) return { ok: false, reason: 'MISSING_USER' };
  let user;
  try {
    user = JSON.parse(userStr);
  } catch {
    return { ok: false, reason: 'BAD_USER_JSON' };
  }
  if (!user?.id) return { ok: false, reason: 'MISSING_USER_ID' };

  return { ok: true, user };
}

export default async function handler(req, res) {
  // CORS (optional). If your API is same origin as app, this can be omitted.
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const { code, initData } = req.body || {};
    const TELEGRAM_BOT_TOKEN = process.env.VITE_TELE_TOKEN;
    if (!code || !initData) {
      return res.status(400).json({ ok: false, error: 'MISSING_CODE_OR_INITDATA' });
    }

    // Verify Telegram signature
    const verify = verifyTelegramInitData(initData, TELEGRAM_BOT_TOKEN);
    if (!verify.ok) {
      return res.status(401).json({ ok: false, error: verify.reason });
    }

    const userId = String(verify.user.id);
    const codeId = String(code).trim().toUpperCase();

    const codeRef = db.doc(`promoCodes/${codeId}`);
    const userRef = db.doc(`telegramUsers/${userId}`);

    let rewardAmount = 0;
    let newBalance = null;
    let promoPayload = null;

    await db.runTransaction(async (tx) => {
      const [codeSnap, userSnap] = await Promise.all([tx.get(codeRef), tx.get(userRef)]);
      if (!codeSnap.exists) throw new Error('INVALID_CODE');

      const codeData = codeSnap.data();
      if (!codeData.active) throw new Error('INACTIVE_CODE');
      if (codeData.expiresAt && codeData.expiresAt.toMillis() < Date.now()) throw new Error('EXPIRED_CODE');
      if (codeData.maxRedemptions && codeData.redeemedCount >= codeData.maxRedemptions) throw new Error('CODE_DEPLETED');

      const userData = userSnap.data() || {};
      if (userData.promo) throw new Error('ALREADY_REDEEMED');

      rewardAmount = Number(codeData.amount || 0);
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Update user
      tx.update(userRef, {
        balance: admin.firestore.FieldValue.increment(rewardAmount),
        promo: {
          code: codeId,
          amount: rewardAmount,
          redeemedAt: now,
          type: codeData.type || 'TAPS',
        },
      });

      // Update code usage
      tx.update(codeRef, {
        redeemedCount: admin.firestore.FieldValue.increment(1),
      });

      promoPayload = { code: codeId, amount: rewardAmount, type: codeData.type || 'TAPS' };
    });

    // Fetch updated balance to return (optional)
    const updated = await userRef.get();
    newBalance = (updated.data()?.balance) ?? null;

    return res.status(200).json({
      ok: true,
      promo: promoPayload,
      balance: newBalance,
    });
  } catch (err) {
    // Normalize known errors
    const known = [
      'INVALID_CODE',
      'INACTIVE_CODE',
      'EXPIRED_CODE',
      'CODE_DEPLETED',
      'ALREADY_REDEEMED',
    ];
    const msg = err?.message || 'UNKNOWN';
    if (known.includes(msg)) {
      return res.status(400).json({ ok: false, error: msg });
    }
    console.error('redeemPromo error:', err);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
}
