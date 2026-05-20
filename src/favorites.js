// ── FAVORITOS ────────────────────────────────────────────
import { getSession } from './auth.js';

function getFavoritesKey() {
  const session = getSession();

  if (!session) {
    return 'buap_favorites_guest';
  }

  return `buap_favorites_${session.username}`;
}

export function getFavorites() {
  const key = getFavoritesKey();

  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

export function toggleFavorite(poiName) {
  const key = getFavoritesKey();
  const favs = getFavorites();

  const idx = favs.indexOf(poiName);

  if (idx === -1) {
    favs.push(poiName);
  } else {
    favs.splice(idx, 1);
  }

  localStorage.setItem(key, JSON.stringify(favs));

  return idx === -1;
}

export function isFavorite(poiName) {
  return getFavorites().includes(poiName);
}