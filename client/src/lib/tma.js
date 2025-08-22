// src/lib/tma.js
let sdk;
export function getStartParam() {
  // 1) Prefer @telegram-apps/sdk
  try {
    if (!sdk) sdk = require('@telegram-apps/sdk');
    const { startParam } = sdk.retrieveLaunchParams();
    if (startParam) return String(startParam);
  } catch {}

  // 2) Telegram object
  const t = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
  const sp = t?.initDataUnsafe?.start_param;
  if (sp) return String(sp);

  // 3) URL fallbacks (when you opened via /start and bot injected ?start=)
  const qs = new URLSearchParams(window.location.search || '');
  const hashQs = new URLSearchParams((window.location.hash.split('?')[1]) || '');
  return qs.get('start') || hashQs.get('start') || '';
}

export function getInitDataRaw() {
  try {
    if (!sdk) sdk = require('@telegram-apps/sdk');
    const { initDataRaw } = sdk.retrieveLaunchParams();
    if (initDataRaw) return initDataRaw;
  } catch {}
  return (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) || '';
}