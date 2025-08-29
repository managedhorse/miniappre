// client/src/analytics.js
import TelegramAnalytics from '@telegram-apps/analytics';

export function initTelegramAnalytics() {
  if (typeof window === 'undefined' || window.__tgAnalyticsInit) return;

  const token = import.meta.env.VITE_TON_ANALYTICS;
  const appName = import.meta.env.VITE_TON_ANALYTICS_APP || 'miniappre';

  if (!token) {
    console.warn('[TON Analytics] Missing VITE_TON_ANALYTICS. Skipping init.');
    return;
  }

  try {
    TelegramAnalytics.init({ token, appName });
    window.__tgAnalyticsInit = true;
    // Example: enrich all events if you want
    // TelegramAnalytics.setProperties?.({ env: import.meta.env.MODE });
  } catch (e) {
    console.warn('[TON Analytics] Init failed:', e);
  }
}

// Optional helpers:
// call when a page/screen changes
export function trackPage(name, props = {}) {
  // If your SDK version exposes a custom event helper:
  TelegramAnalytics?.event?.('page_view', { name, ...props });
}

// call for funnel steps
export function trackEvent(name, props = {}) {
  TelegramAnalytics?.event?.(name, props);
}
