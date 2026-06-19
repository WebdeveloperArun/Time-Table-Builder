const STORAGE_KEY = "ttbl_v5";
export function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
export function saveTables(t) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {}
}
