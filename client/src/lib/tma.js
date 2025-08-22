// src/lib/tma.js
import { retrieveLaunchParams } from '@telegram-apps/sdk';

export function getStartParamSafe() {
  // 1) SDK (works both for deep link & web_app)
  try {
    const { startParam } = retrieveLaunchParams();
    if (startParam) return startParam;
  } catch {}

  // 2) Telegram injected params (deep link -> start_param lives here)
  const tStart = window?.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (tStart) return tStart;

  // 3) URL params (your bot’s web_app button adds ?start=…)
  const qs = new URLSearchParams(window.location.search || '');
  const s = qs.get('start');
  if (s) return s;

  // 4) Hash router (/#/?start=…)
  const hash = window.location.hash || '';
  const hqs = new URLSearchParams(hash.split('?')[1] || '');
  return hqs.get('start') || '';
}

export function getInitDataRawSafe() {
  try {
    const { initDataRaw } = retrieveLaunchParams();
    if (initDataRaw) return initDataRaw;
  } catch {}
  return window?.Telegram?.WebApp?.initData || '';
}

export async function waitForTelegram(maxMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const t = window?.Telegram?.WebApp;
    if (t && (t.initData || t.initDataUnsafe)) return t;
    // small delay
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 50));
  }
  return window?.Telegram?.WebApp || null;
}
