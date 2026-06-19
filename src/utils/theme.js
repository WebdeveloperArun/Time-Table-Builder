export const DARK = {
  bg:"#0f1117",surface:"#171b26",surfaceAlt:"#1e2436",surfaceHover:"#232b40",
  border:"#2a3050",borderLight:"#1e2840",
  accent:"#3b82f6",accentLight:"#60a5fa",accentGlow:"rgba(59,130,246,0.15)",
  teal:"#14b8a6",tealGlow:"rgba(20,184,166,0.15)",
  purple:"#8b5cf6",purpleGlow:"rgba(139,92,246,0.15)",
  warning:"#f59e0b",danger:"#ef4444",success:"#22c55e",
  textPrimary:"#f0f4ff",textSecondary:"#8892b0",textMuted:"#4a5568",
  recess:"#151c2e",recessText:"#4a5568",recessBorder:"#1e2840",
  mergedBg:"rgba(20,184,166,0.12)",mergedBorder:"rgba(20,184,166,0.4)",
  freeBg:"transparent",freeBorder:"transparent",freeText:"#2a3050",
  days:{MON:"#3b82f6",TUE:"#8b5cf6",WED:"#14b8a6",THU:"#f59e0b",FRI:"#ef4444",SAT:"#ec4899",SUN:"#f97316",CUSTOM:"#6b7280"},
  thBg:"#141929",modalBg:"rgba(0,0,0,0.65)",shadowColor:"rgba(0,0,0,0.6)",
  dayStripeAlt:"#1c2130",
};

export const LIGHT = {
  bg:"#e5e7eb",surface:"#ffffff",surfaceAlt:"#f8fafc",surfaceHover:"#f1f5f9",
  border:"#cbd5e1",borderLight:"#e2e8f0",
  accent:"#2563eb",accentLight:"#1d4ed8",accentGlow:"rgba(37,99,235,0.1)",
  teal:"#0d9488",tealGlow:"rgba(13,148,136,0.1)",
  purple:"#7c3aed",purpleGlow:"rgba(124,58,237,0.1)",
  warning:"#d97706",danger:"#dc2626",success:"#16a34a",
  textPrimary:"#0f172a",textSecondary:"#475569",textMuted:"#94a3b8",
  recess:"#f1f5f9",recessText:"#64748b",recessBorder:"#cbd5e1",
  mergedBg:"rgba(13,148,136,0.08)",mergedBorder:"rgba(13,148,136,0.35)",
  freeBg:"transparent",freeBorder:"transparent",freeText:"#cbd5e1",
  days:{MON:"#2563eb",TUE:"#7c3aed",WED:"#0d9488",THU:"#d97706",FRI:"#dc2626",SAT:"#db2777",SUN:"#ea580c",CUSTOM:"#6b7280"},
  thBg:"#f8fafc",modalBg:"rgba(0,0,0,0.4)",shadowColor:"rgba(0,0,0,0.15)",
  dayStripeAlt:"#f4f7fb",
};

let _theme = DARK;
export const getT = () => _theme;
export const setTheme = (theme) => { _theme = theme; };
