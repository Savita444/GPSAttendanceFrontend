// Centralised reading of Vite env vars with sensible defaults.
// Anything you'd previously hardcode in a component should live here.

const env = import.meta.env || {};

function intList(s, fallback) {
  if (!s) return fallback;
  return String(s).split(',').map((x) => parseInt(x.trim(), 10)).filter(Number.isFinite);
}

export const APP_NAME = env.VITE_APP_NAME || 'Attendance MVP';
export const BRAND_PRIMARY = env.VITE_BRAND_PRIMARY || '#1A5DA0';

export const DEFAULT_PAGE_SIZE     = Number(env.VITE_DEFAULT_PAGE_SIZE) || 25;
export const ATTENDANCE_PAGE_SIZE  = Number(env.VITE_ATTENDANCE_PAGE_SIZE) || 50;
export const PAGE_SIZE_OPTIONS     = intList(env.VITE_PAGE_SIZE_OPTIONS, [10, 25, 50, 100]);
export const SEARCH_DEBOUNCE_MS    = Number(env.VITE_SEARCH_DEBOUNCE_MS) || 300;

export default {
  APP_NAME, BRAND_PRIMARY,
  DEFAULT_PAGE_SIZE, ATTENDANCE_PAGE_SIZE,
  PAGE_SIZE_OPTIONS, SEARCH_DEBOUNCE_MS,
};
