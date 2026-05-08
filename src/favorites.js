// ── FAVORITOS ────────────────────────────────────────────
const FAV_KEY = 'buap_favorites';

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch { return []; }
}

export function toggleFavorite(poiName) {
  const favs = getFavorites();
  const idx  = favs.indexOf(poiName);
  if (idx === -1) favs.push(poiName);
  else            favs.splice(idx, 1);
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  return idx === -1; // true = se agregó
}

export function isFavorite(poiName) {
  return getFavorites().includes(poiName);
}
