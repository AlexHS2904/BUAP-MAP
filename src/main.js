import { getSession, login, logout, isAdmin } from './auth.js';
import { getFavorites, toggleFavorite, isFavorite } from './favorites.js';

mapboxgl.accessToken = window.__MAPBOX_TOKEN__;

// ── COORDENADAS ───────────────────────────────────────────
const buapCoords = [
  [-98.2045340538025, 19.00556470634405],
  [-98.20597171783449, 19.004844482595736],
  [-98.20218443870544, 18.99403060756469],
  [-98.19386959075928, 18.996982682581958],
  [-98.193998336792, 19.000827402805637],
  [-98.2045340538025, 19.00556470634405]
];

const BUAP_CENTER = [-98.1995, 19.0001];

// ── CATEGORÍAS ────────────────────────────────────────────
const CATS = {
  aulas:      { color: '#2E6B9E', label: 'Aulas',      emoji: '🎓' },
  biblioteca: { color: '#6B4E8A', label: 'Biblioteca',  emoji: '📚' },
  comida:     { color: '#D4713A', label: 'Comida',      emoji: '🍽️' },
  deportivo:  { color: '#4A7C59', label: 'Deportivo',   emoji: '⚽' },
  servicios:  { color: '#B84040', label: 'Servicios',   emoji: '🏥' },
  admin:      { color: '#C9933A', label: 'Admin',       emoji: '🏛️' },
};

// ── POIs BASE ────────────────────────────────────────────
// Los POIs base tienen isBase:true — el admin puede editarlos pero no eliminarlos
const BASE_POIS = [
  { id: 'base-1', name: 'Facultad de Ingeniería',      coords: [-98.1996, 19.00155], cat: 'aulas',      desc: 'Ingenierías civil, mecánica, electrónica y más.'},
  { id: 'base-2', name: 'Biblioteca José M. Lafragua', coords: [-98.1982, 19.00055], cat: 'biblioteca', desc: 'La biblioteca central del campus universitario.'},
  { id: 'base-3', name: 'Estadio Universitario BUAP',  coords: [-98.2010, 18.9970],  cat: 'deportivo',  desc: 'Estadio de futbol y pista de atletismo.' },
  { id: 'base-4', name: 'Facultad de Derecho',         coords: [-98.1975, 19.0018],  cat: 'aulas',      desc: 'Licenciatura y posgrado en Ciencias Jurídicas.'},
  { id: 'base-5', name: 'Rectoría BUAP',               coords: [-98.1993, 19.0025],  cat: 'admin',      desc: 'Oficinas centrales de la rectoría universitaria.'},
  { id: 'base-6', name: 'Facultad de Arquitectura',    coords: [-98.2028, 19.0035],  cat: 'aulas',      desc: 'Diseño urbano, arquitectura e interiorismo.' },
  { id: 'base-7', name: 'Cafetería Central',           coords: [-98.2000, 19.0005],  cat: 'comida',     desc: 'Cafetería principal con menú del día.' },
];

const CUSTOM_POIS_KEY  = 'buap_custom_pois';
const BASE_EDITS_KEY   = 'buap_base_edits';   // sobreescrituras de POIs base por admin

function getCustomPois() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_POIS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCustomPois(pois) {
  localStorage.setItem(CUSTOM_POIS_KEY, JSON.stringify(pois));
}

// Ediciones a POIs base (solo nombre, desc, cat — no coords)
function getBaseEdits() {
  try {
    return JSON.parse(localStorage.getItem(BASE_EDITS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveBaseEdits(edits) {
  localStorage.setItem(BASE_EDITS_KEY, JSON.stringify(edits));
}

function getAllPois() {
  const edits = getBaseEdits();
  const base  = BASE_POIS.map(p => edits[p.id] ? { ...p, ...edits[p.id] } : p);
  return [...base, ...getCustomPois()];
}

function genId() {
  return 'poi-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

// ── ESTADO ────────────────────────────────────────────────
let userLocation  = null;
let userMarker    = null;
let activeRoute   = null;
let navMode       = null;
let originPoi     = null;
let allMarkers    = [];   // { el, poi, marker }
let adminClickMode = false;

// ── MAPA ──────────────────────────────────────────────────
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: BUAP_CENTER,
  zoom: 15.8,
  pitch: 0,
  bearing: 0,
  antialias: true,
  maxZoom: 19,
  minZoom: 13,

  // Activado para permitir rotación e inclinación
  dragRotate: true,
  touchPitch: true
});

// Permitir rotación con mouse/touch
map.dragRotate.enable();

if (map.touchZoomRotate && map.touchZoomRotate.enableRotation) {
  map.touchZoomRotate.enableRotation();
}

// ─────────────────────────────────────────────────────────
// HELPERS GENERALES
// ─────────────────────────────────────────────────────────

async function drawRoute(originCoords, destCoords) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
  const res  = await fetch(url);
  const data = await res.json();

  if (!data.routes?.length) {
    showNavError('No se encontró ruta. Intenta acercarte al campus.');
    return null;
  }

  const route    = data.routes[0];
  const duration = Math.ceil(route.duration / 60);
  const distance = (route.distance / 1000).toFixed(2);

  if (map.getSource('route')) {
    map.getSource('route').setData({
      type: 'Feature',
      geometry: route.geometry
    });
  } else {
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: route.geometry
      }
    });

    map.addLayer({
      id: 'route-shadow',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#000',
        'line-width': 8,
        'line-opacity': 0.1,
        'line-blur': 4
      }
    });

    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#2E6B9E',
        'line-width': 5,
        'line-opacity': 0.9
      }
    });
  }

  return { duration, distance };
}

function clearRoute() {
  ['route-line', 'route-shadow'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
  });

  if (map.getSource('route')) map.removeSource('route');

  activeRoute = null;
  originPoi = null;
  navMode = null;
  hideNavBar();
}

function showNavBar({ destName, duration, distance, mode }) {
  document.getElementById('nav-dest').textContent     = destName;
  document.getElementById('nav-duration').textContent = `🚶 ${duration} min`;
  document.getElementById('nav-distance').textContent = `📍 ${distance} km`;
  document.getElementById('nav-mode-label').textContent =
    mode === 'user' ? 'Desde tu ubicación' : 'Ruta entre puntos';
  document.getElementById('nav-bar').classList.add('open');
}

function hideNavBar() {
  document.getElementById('nav-bar').classList.remove('open');
}

function showNavError(msg) {
  const el = document.getElementById('nav-error');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

function placeUserMarker(coords) {
  if (userMarker) {
    userMarker.setLngLat(coords);
    return;
  }

  const el = document.createElement('div');
  el.style.cssText = `
    width:18px;
    height:18px;
    border-radius:50%;
    background:#1A73E8;
    border:3px solid white;
    box-shadow:0 0 0 5px rgba(26,115,232,0.2);
  `;

  userMarker = new mapboxgl.Marker({
    element: el,
    anchor: 'center'
  }).setLngLat(coords).addTo(map);
}

// ─────────────────────────────────────────────────────────
// LOGIN UI
// ─────────────────────────────────────────────────────────

function renderLoginScreen() {
  const existing = document.getElementById('login-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'login-overlay';
  overlay.innerHTML = `
    <div class="login-card">
      <div class="login-logo"><img src="${import.meta.env.BASE_URL}img/logo.png" alt="Logo BUAP"></div>
      <h1 class="login-title">BUAP Campus</h1>
      <p class="login-sub">Inicia sesión para continuar</p>

      <div class="login-field">
        <label>Usuario</label>
        <input id="login-user" type="text" placeholder="usuario" autocomplete="username" />
      </div>
      <div class="login-field">
        <label>Contraseña</label>
        <input id="login-pass" type="password" placeholder="••••••••" autocomplete="current-password" />
      </div>
      <div id="login-error" class="login-error"></div>
      <button id="login-btn" class="login-btn">Entrar</button>

      <div class="login-hint">
        <span>admin / admin123</span>
        <span>alumno / buap2024</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const doLogin = () => {
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value;
    const session = login(u, p);

    if (!session) {
      document.getElementById('login-error').textContent = 'Usuario o contraseña incorrectos.';
      return;
    }

    overlay.classList.add('fade-out');

    setTimeout(() => {
      overlay.remove();
      initApp(session);
    }, 400);
  };

  document.getElementById('login-btn').addEventListener('click', doLogin);
  document.getElementById('login-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
}

// ─────────────────────────────────────────────────────────
// TOPBAR usuario + logout + admin toggle
// ─────────────────────────────────────────────────────────

function renderTopBar(session) {
  const existing = document.getElementById('user-bar');
  if (existing) existing.remove();

  const bar = document.createElement('div');
  bar.id = 'user-bar';
  bar.innerHTML = `
    <span class="user-bar-name">${session.role === 'admin' ? '⚙️' : '👤'} ${session.name}</span>
    ${session.role === 'admin' ? `<button id="btn-admin-mode" class="user-bar-btn admin-btn" title="Modo agregar POI">＋ POI</button>` : ''}
    <button id="btn-favorites-open" class="user-bar-btn fav-btn" title="Favoritos">★</button>
    <button id="btn-logout" class="user-bar-btn logout-btn" title="Cerrar sesión">↩</button>
  `;

  document.body.appendChild(bar);

  document.getElementById('btn-logout').addEventListener('click', () => {
    logout();

    allMarkers.forEach(({ marker, observer }) => {
      if (observer) observer.disconnect();
      marker.remove();
    });

    allMarkers = [];

    clearRoute();
    renderLoginScreen();
    bar.remove();

    const favPanel = document.getElementById('fav-panel');
    if (favPanel) favPanel.remove();
  });

  document.getElementById('btn-favorites-open').addEventListener('click', () => {
    renderFavoritesPanel();
  });

  if (session.role === 'admin') {
    document.getElementById('btn-admin-mode').addEventListener('click', () => {
      adminClickMode = !adminClickMode;
      const btn = document.getElementById('btn-admin-mode');

      if (adminClickMode) {
        btn.classList.add('active');
        btn.textContent = '✕ Cancelar';
        map.getCanvas().style.cursor = 'crosshair';
        showNavError('Haz clic en el mapa para agregar un POI');
      } else {
        btn.classList.remove('active');
        btn.textContent = '＋ POI';
        map.getCanvas().style.cursor = '';
      }
    });
  }
}

// ─────────────────────────────────────────────────────────
// PANEL DE FAVORITOS
// ─────────────────────────────────────────────────────────

function renderFavoritesPanel() {
  const existing = document.getElementById('fav-panel');

  if (existing) {
    existing.classList.toggle('open');
    return;
  }

  const session = getSession();
  const userName = session?.name || 'Usuario';

  const panel = document.createElement('div');
  panel.id = 'fav-panel';
  panel.innerHTML = `
    <div class="panel-handle"></div>
    <button class="panel-close" id="fav-panel-close">×</button>
    <h2 class="fav-title">★ Favoritos de ${userName}</h2>
    <div id="fav-list"></div>
  `;

  document.body.appendChild(panel);

  document.getElementById('fav-panel-close').addEventListener('click', () => {
    panel.classList.remove('open');
  });

  setTimeout(() => panel.classList.add('open'), 10);
  refreshFavList(panel);
}

function refreshFavList(panel) {
  const list = panel ? panel.querySelector('#fav-list') : document.getElementById('fav-list');

  if (!list) return;

  const favs = getFavorites();
  const allPois = getAllPois();

  if (favs.length === 0) {
    list.innerHTML = `<p class="fav-empty">Aún no tienes favoritos.<br>Toca ★ en cualquier lugar.</p>`;
    return;
  }

  list.innerHTML = '';

  favs.forEach(name => {
    const poi = allPois.find(p => p.name === name);
    if (!poi) return;

    const cat = CATS[poi.cat] || { color: '#A8956A', emoji: '📍' };

    const item = document.createElement('div');
    item.className = 'fav-item';
    item.innerHTML = `
      <span class="fav-item-emoji" style="background:${cat.color}">${cat.emoji}</span>
      <div class="fav-item-info">
        <div class="fav-item-name">${poi.name}</div>
        <div class="fav-item-cat">${cat.label || poi.cat}</div>
      </div>
      <button class="fav-item-remove" data-name="${poi.name}" title="Quitar">✕</button>
    `;

    item.querySelector('.fav-item-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(poi.name);
      refreshFavList(null);

      const favBtn = document.getElementById('panel-fav-btn');

      if (favBtn && document.getElementById('panel-name').textContent === poi.name) {
        favBtn.textContent = '☆ Favorito';
        favBtn.classList.remove('active');
      }
    });

    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('fav-item-remove')) return;

      map.flyTo({
        center: poi.coords,
        zoom: 17,
        pitch: 45,
        bearing: map.getBearing(),
        duration: 800
      });

      document.getElementById('fav-panel').classList.remove('open');
    });

    list.appendChild(item);
  });
}

// ─────────────────────────────────────────────────────────
// MODAL ADMIN: AGREGAR POI
// ─────────────────────────────────────────────────────────

function showAddPoiModal(coords) {
  const existing = document.getElementById('add-poi-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'add-poi-modal';
  modal.innerHTML = `
    <div class="add-poi-card">
      <h3 class="add-poi-title">Nuevo POI</h3>
      <p class="add-poi-coords">📍 ${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}</p>

      <div class="login-field">
        <label>Nombre</label>
        <input id="poi-input-name" type="text" placeholder="Ej: Sala de Cómputo B" />
      </div>

      <div class="login-field">
        <label>Descripción</label>
        <input id="poi-input-desc" type="text" placeholder="Breve descripción" />
      </div>

      <div class="login-field">
        <label>Categoría</label>
        <select id="poi-input-cat">
          ${Object.entries(CATS).map(([k, v]) =>
            `<option value="${k}">${v.emoji} ${v.label}</option>`
          ).join('')}
        </select>
      </div>

      <div class="add-poi-btns">
        <button id="poi-save-btn" class="login-btn">Guardar</button>
        <button id="poi-cancel-btn" class="login-btn secondary">Cancelar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => modal.classList.add('open'), 10);

  document.getElementById('poi-cancel-btn').addEventListener('click', () => {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 300);

    adminClickMode = false;

    const btn = document.getElementById('btn-admin-mode');

    if (btn) {
      btn.classList.remove('active');
      btn.textContent = '＋ POI';
    }

    map.getCanvas().style.cursor = '';
  });

  document.getElementById('poi-save-btn').addEventListener('click', () => {
    const name = document.getElementById('poi-input-name').value.trim();
    const desc = document.getElementById('poi-input-desc').value.trim();
    const cat  = document.getElementById('poi-input-cat').value;

    if (!name) {
      document.getElementById('poi-input-name').style.borderColor = '#B84040';
      return;
    }

    const newPoi = {
      id: genId(),
      name,
      desc: desc || 'Sin descripción.',
      cat,
      coords
    };

    const customs = getCustomPois();
    customs.push(newPoi);
    saveCustomPois(customs);

    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 300);

    adminClickMode = false;

    const btn = document.getElementById('btn-admin-mode');

    if (btn) {
      btn.classList.remove('active');
      btn.textContent = '＋ POI';
    }

    map.getCanvas().style.cursor = '';

    addMarkerToMap(newPoi);
    showNavError(`✅ POI "${name}" agregado`);
  });
}

// ─────────────────────────────────────────────────────────
// MODAL ADMIN: EDITAR POI
// ─────────────────────────────────────────────────────────

function showEditPoiModal(poi) {
  const existing = document.getElementById('edit-poi-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'edit-poi-modal';
  modal.innerHTML = `
    <div class="add-poi-card">
      <h3 class="add-poi-title">✏️ Editar POI</h3>

      ${
        poi.isBase
          ? `<p class="add-poi-coords" style="color:#C9933A">⚠️ POI base — solo se editan nombre, descripción y categoría</p>`
          : `<p class="add-poi-coords">📍 ${poi.coords[1].toFixed(5)}, ${poi.coords[0].toFixed(5)}</p>`
      }

      <div class="login-field">
        <label>Nombre</label>
        <input id="edit-poi-name" type="text" value="${poi.name}" />
      </div>

      <div class="login-field">
        <label>Descripción</label>
        <input id="edit-poi-desc" type="text" value="${poi.desc}" />
      </div>

      <div class="login-field">
        <label>Categoría</label>
        <select id="edit-poi-cat">
          ${Object.entries(CATS).map(([k, v]) =>
            `<option value="${k}" ${poi.cat === k ? 'selected' : ''}>${v.emoji} ${v.label}</option>`
          ).join('')}
        </select>
      </div>

      <div class="add-poi-btns">
        <button id="edit-poi-save" class="login-btn">Guardar cambios</button>
        <button id="edit-poi-cancel" class="login-btn secondary">Cancelar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('open'), 10);

  const closeModal = () => {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 300);
  };

  document.getElementById('edit-poi-cancel').addEventListener('click', closeModal);

  document.getElementById('edit-poi-save').addEventListener('click', () => {
    const newName = document.getElementById('edit-poi-name').value.trim();
    const newDesc = document.getElementById('edit-poi-desc').value.trim();
    const newCat  = document.getElementById('edit-poi-cat').value;

    if (!newName) {
      document.getElementById('edit-poi-name').style.borderColor = '#B84040';
      return;
    }

    if (poi.isBase) {
      const edits = getBaseEdits();
      edits[poi.id] = {
        name: newName,
        desc: newDesc || poi.desc,
        cat: newCat
      };
      saveBaseEdits(edits);
    } else {
      const customs = getCustomPois();
      const idx = customs.findIndex(p => p.id === poi.id);

      if (idx !== -1) {
        customs[idx] = {
          ...customs[idx],
          name: newName,
          desc: newDesc || poi.desc,
          cat: newCat
        };

        saveCustomPois(customs);
      }
    }

    closeModal();

    rebuildMarker(poi.id ?? poi.name, {
      name: newName,
      desc: newDesc || poi.desc,
      cat: newCat
    });

    showNavError(`✅ POI "${newName}" actualizado`);
  });
}

// ─────────────────────────────────────────────────────────
// ELIMINAR POI solo custom
// ─────────────────────────────────────────────────────────

function confirmDeletePoi(poi) {
  const existing = document.getElementById('confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'confirm-modal';
  modal.innerHTML = `
    <div class="add-poi-card">
      <h3 class="add-poi-title" style="color:#B84040">🗑️ Eliminar POI</h3>

      <p class="add-poi-coords" style="font-size:14px;color:rgba(59,42,26,0.7);font-family:inherit;margin-bottom:20px">
        ¿Seguro que quieres eliminar <strong>${poi.name}</strong>? Esta acción no se puede deshacer.
      </p>

      <div class="add-poi-btns">
        <button id="confirm-delete-yes" class="login-btn" style="background:#B84040">Sí, eliminar</button>
        <button id="confirm-delete-no"  class="login-btn secondary">Cancelar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('open'), 10);

  const closeModal = () => {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 300);
  };

  document.getElementById('confirm-delete-no').addEventListener('click', closeModal);

  document.getElementById('confirm-delete-yes').addEventListener('click', () => {
    const customs = getCustomPois().filter(p => p.id !== poi.id);
    saveCustomPois(customs);

    const idx = allMarkers.findIndex(m => (m.poi.id ?? m.poi.name) === (poi.id ?? poi.name));

    if (idx !== -1) {
      const { marker } = allMarkers[idx];
      marker.remove();
      allMarkers.splice(idx, 1);
    }

    document.getElementById('detail-panel').classList.remove('open');
    closeModal();
    showNavError(`🗑️ POI "${poi.name}" eliminado`);
  });
}

// ─────────────────────────────────────────────────────────
// RECONSTRUIR MARCADOR TRAS EDICIÓN
// ─────────────────────────────────────────────────────────

function rebuildMarker(poiId, changes) {
  const idx = allMarkers.findIndex(m => (m.poi.id ?? m.poi.name) === poiId);

  if (idx === -1) return;

  const old = allMarkers[idx];

  old.marker.remove();
  allMarkers.splice(idx, 1);

  const updatedPoi = {
    ...old.poi,
    ...changes
  };

  addMarkerToMap(updatedPoi);

  const panelName = document.getElementById('panel-name');

  if (
    document.getElementById('detail-panel').classList.contains('open') &&
    panelName.textContent === old.poi.name
  ) {
    const cat = CATS[changes.cat] || CATS[old.poi.cat];

    panelName.textContent = changes.name;
    document.getElementById('panel-desc').textContent  = changes.desc;
    document.getElementById('panel-badge').textContent = cat.label;
    document.getElementById('panel-badge').style.background = cat.color;

    activeRoute = updatedPoi;
  }
}

function addMarkerToMap(poi) {
  const cat = CATS[poi.cat] || {
    color: '#A8956A',
    label: 'Lugar',
    emoji: '📍'
  };

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position:absolute;
    display:flex;
    flex-direction:column;
    align-items:center;
    cursor:pointer;
    width:0;
    height:0;
    overflow:visible;
  `;

  const label = document.createElement('div');
  label.textContent = poi.name;
  label.style.cssText = `
    position: absolute;
    bottom: 48px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 30, 53, 0.88);
    color: #E8F0FF;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    padding: 4px 9px;
    border-radius: 8px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.18s ease, bottom 0.18s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    letter-spacing: 0.02em;
  `;

  const el = document.createElement('div');
  el.style.cssText = `
    position: absolute;
    width: 40px;
    height: 40px;
    left: -20px;
    bottom: 0;
    border-radius: 50%;
    background: ${cat.color};
    border: 3px solid white;
    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: box-shadow 0.2s, transform 0.2s;
  `;

  el.dataset.cat = poi.cat;

  const inner = document.createElement('div');
  inner.style.cssText = `
    font-size:16px;
    line-height:1;
    user-select:none;
  `;

  inner.textContent = cat.emoji;
  el.appendChild(inner);

  wrapper.appendChild(label);
  wrapper.appendChild(el);

  wrapper.addEventListener('mouseenter', () => {
    el.style.transform  = 'scale(1.15)';
    el.style.boxShadow  = `0 6px 18px ${cat.color}99`;
    label.style.opacity = '1';
    label.style.bottom  = '52px';
  });

  wrapper.addEventListener('mouseleave', () => {
    el.style.transform  = 'scale(1)';
    el.style.boxShadow  = '0 3px 10px rgba(0,0,0,0.3)';
    label.style.opacity = '0';
    label.style.bottom  = '48px';
  });

  const panel      = document.getElementById('detail-panel');
  const panelName  = document.getElementById('panel-name');
  const panelDesc  = document.getElementById('panel-desc');
  const panelBadge = document.getElementById('panel-badge');

  wrapper.addEventListener('click', () => {
    panelName.textContent       = poi.name;
    panelDesc.textContent       = poi.desc;
    panelBadge.textContent      = cat.label;
    panelBadge.style.background = cat.color;

    activeRoute = poi;

    document.getElementById('btn-nav-user').style.display = userLocation ? 'flex' : 'none';

    panel.classList.add('open');

    const session = getSession();
    const adminActions = document.getElementById('panel-admin-actions');

    if (adminActions) {
      if (session?.role === 'admin') {
        adminActions.style.display = 'flex';

        const btnDelete = document.getElementById('btn-poi-delete');

        if (btnDelete) {
          btnDelete.style.display = poi.isBase ? 'none' : 'flex';
        }
      } else {
        adminActions.style.display = 'none';
      }
    }

    const favBtn = document.getElementById('panel-fav-btn');

    if (favBtn) {
      const faved = isFavorite(poi.name);

      favBtn.textContent = faved ? '★ En favoritos' : '☆ Favorito';
      favBtn.classList.toggle('active', faved);
    }
  });

  const marker = new mapboxgl.Marker({
    element: wrapper,
    anchor: 'bottom'
  }).setLngLat(poi.coords).addTo(map);

  allMarkers.push({
    el: wrapper,
    elPin: el,
    poi,
    marker
  });

  return {
    el: wrapper,
    elPin: el,
    poi,
    marker
  };
}

// ─────────────────────────────────────────────────────────
// INIT APP después del login
// ─────────────────────────────────────────────────────────

function initApp(session) {
  renderTopBar(session);

  const loadMarkers = () => {
    getAllPois().forEach(poi => addMarkerToMap(poi));

    document.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const cat = chip.dataset.cat;

        allMarkers.forEach(({ el, elPin, poi: p }) => {
          el.style.display = (cat === 'all' || cat === p.cat) ? 'flex' : 'none';
        });
      });
    });
  };

  if (map.loaded()) {
    loadMarkers();
  } else {
    map.once('load', loadMarkers);
  }

const favBtn = document.getElementById('panel-fav-btn');

if (favBtn) {
  favBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeRoute) {
      showNavError('Primero selecciona un lugar.');
      return;
    }

    const added = toggleFavorite(activeRoute.name);

    favBtn.textContent = added ? '★ En favoritos' : '☆ Favorito';
    favBtn.classList.toggle('active', added);

    const favPanel = document.getElementById('fav-panel');

    if (favPanel?.classList.contains('open')) {
      refreshFavList(null);
    }
  });
}

  const btnEdit   = document.getElementById('btn-poi-edit');
  const btnDelete = document.getElementById('btn-poi-delete');

  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      if (!activeRoute) return;

      document.getElementById('detail-panel').classList.remove('open');
      showEditPoiModal(activeRoute);
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      if (!activeRoute) return;

      document.getElementById('detail-panel').classList.remove('open');
      confirmDeletePoi(activeRoute);
    });
  }

  map.on('click', (e) => {
    if (!adminClickMode) return;
    showAddPoiModal([e.lngLat.lng, e.lngLat.lat]);
  });
}

// ─────────────────────────────────────────────────────────
// MAP LOAD capas base, siempre corren
// ─────────────────────────────────────────────────────────

map.on('load', () => {
  ['poi-label', 'airport-label', 'transit-label'].forEach(id => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', 'none');
    }
  });

  map.addSource('campus', {
    type: 'geojson',
    data: `${import.meta.env.BASE_URL}data/buap.geojson`
  });

  map.addLayer({
    id: 'campus-ground',
    type: 'fill',
    source: 'campus',
    paint: {
      'fill-color': '#D6E8C0',
      'fill-opacity': 0.55
    }
  });

  map.addLayer({
    id: 'campus-border',
    type: 'line',
    source: 'campus',
    paint: {
      'line-color': '#8B6914',
      'line-width': 3,
      'line-opacity': 0.8
    }
  });

  map.addLayer({
    id: 'campus-glow',
    type: 'line',
    source: 'campus',
    paint: {
      'line-color': '#C9933A',
      'line-width': 10,
      'line-opacity': 0.15,
      'line-blur': 8
    }
  });

  map.addSource('mask', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]],
          [...buapCoords].reverse()
        ]
      }
    }
  });

  map.addLayer({
    id: 'outside-mask',
    type: 'fill',
    source: 'mask',
    paint: {
      'fill-color': '#F0EBE0',
      'fill-opacity': 0.55
    }
  });

  const bounds = new mapboxgl.LngLatBounds();

  buapCoords.forEach(c => bounds.extend(c));

  map.fitBounds(bounds, {
    padding: 50,
    pitch: 0,
    bearing: 0,
    duration: 1200
  });
});

// ─────────────────────────────────────────────────────────
// BOTONES NAV / DETALLE independientes de sesión
// ─────────────────────────────────────────────────────────

document.querySelector('.panel-btn.primary').addEventListener('click', async () => {
  if (!activeRoute) return;

  const doRoute = async () => {
    document.getElementById('detail-panel').classList.remove('open');

    const info = await drawRoute(userLocation, activeRoute.coords);

    if (!info) return;

    navMode = 'user';

    showNavBar({
      destName: activeRoute.name,
      ...info,
      mode: 'user'
    });

    const b = new mapboxgl.LngLatBounds()
      .extend(userLocation)
      .extend(activeRoute.coords);

    map.fitBounds(b, {
      padding: 80,
      pitch: 45,
      bearing: map.getBearing(),
      duration: 900
    });
  };

  if (userLocation) {
    doRoute();
    return;
  }

  if (!navigator.geolocation) {
    showNavError('Tu navegador no soporta geolocalización.');
    return;
  }

  showNavError('Obteniendo tu ubicación…');

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = [pos.coords.longitude, pos.coords.latitude];
      placeUserMarker(userLocation);
      document.getElementById('btn-nav-user').style.display = 'flex';
      doRoute();
    },
    () => showNavError('No se pudo obtener tu ubicación. Revisa los permisos.'),
    { enableHighAccuracy: true }
  );
});

document.getElementById('btn-nav-user').addEventListener('click', async () => {
  if (!activeRoute || !userLocation) return;

  document.getElementById('detail-panel').classList.remove('open');

  const info = await drawRoute(userLocation, activeRoute.coords);

  if (!info) return;

  navMode = 'user';

  showNavBar({
    destName: activeRoute.name,
    ...info,
    mode: 'user'
  });

  const b = new mapboxgl.LngLatBounds()
    .extend(userLocation)
    .extend(activeRoute.coords);

  map.fitBounds(b, {
    padding: 80,
    pitch: 45,
    bearing: map.getBearing(),
    duration: 900
  });
});

document.getElementById('btn-nav-poi').addEventListener('click', () => {
  if (!activeRoute) return;

  document.getElementById('detail-panel').classList.remove('open');
  showPoiSelector(activeRoute);
});

document.getElementById('panel-close').addEventListener('click', () => {
  document.getElementById('detail-panel').classList.remove('open');
});

document.getElementById('nav-bar-close').addEventListener('click', clearRoute);

document.getElementById('btn-location').addEventListener('click', () => {
  if (!navigator.geolocation) {
    showNavError('Tu navegador no soporta geolocalización.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = [pos.coords.longitude, pos.coords.latitude];

      placeUserMarker(userLocation);

      map.flyTo({
        center: userLocation,
        zoom: 16.5,
        pitch: 45,
        bearing: map.getBearing(),
        duration: 900
      });

      document.getElementById('btn-nav-user').style.display = 'flex';
    },
    () => showNavError('No se pudo obtener tu ubicación. Revisa los permisos.'),
    { enableHighAccuracy: true }
  );
});

// Swipe down para cerrar panel
const panel = document.getElementById('detail-panel');
let touchStartY = 0;

panel.addEventListener('touchstart', e => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

panel.addEventListener('touchend', e => {
  if (e.changedTouches[0].clientY - touchStartY > 60) {
    panel.classList.remove('open');
  }
});

document.getElementById('poi-selector-close').addEventListener('click', () => {
  document.getElementById('poi-selector').classList.remove('open');
});

// ─────────────────────────────────────────────────────────
// BOTONES DE VISTA / ROTACIÓN DEL MAPA
// ─────────────────────────────────────────────────────────

function fitCampus(pitch = 0, bearing = 0) {
  const bounds = new mapboxgl.LngLatBounds();

  buapCoords.forEach(c => bounds.extend(c));

  map.fitBounds(bounds, {
    padding: 50,
    pitch,
    bearing,
    duration: 900
  });
}

document.getElementById('btn-campus').addEventListener('click', () => {
  fitCampus(45, -15);
});

document.getElementById('btn-top').addEventListener('click', () => {
  fitCampus(0, 0);
});

document.getElementById('btn-rotate').addEventListener('click', () => {
  map.easeTo({
    bearing: map.getBearing() + 90,
    pitch: map.getPitch() || 45,
    duration: 900
  });
});

// ─────────────────────────────────────────────────────────
// SELECTOR DE ORIGEN POI → POI
// ─────────────────────────────────────────────────────────

function showPoiSelector(dest) {
  const modal = document.getElementById('poi-selector');
  const list  = document.getElementById('poi-selector-list');

  list.innerHTML = '';

  getAllPois().forEach((poi) => {
    if (poi.name === dest.name) return;

    const cat = CATS[poi.cat];

    const btn = document.createElement('button');
    btn.className = 'poi-selector-item';
    btn.innerHTML = `
      <span style="font-size:20px">${cat.emoji}</span>
      <span>${poi.name}</span>
    `;

    btn.addEventListener('click', async () => {
      modal.classList.remove('open');

      originPoi = poi;
      navMode = 'poi';

      const info = await drawRoute(poi.coords, dest.coords);

      if (!info) return;

      showNavBar({
        destName: dest.name,
        ...info,
        mode: 'poi'
      });

      const b = new mapboxgl.LngLatBounds()
        .extend(poi.coords)
        .extend(dest.coords);

      map.fitBounds(b, {
        padding: 80,
        pitch: 45,
        bearing: map.getBearing(),
        duration: 900
      });
    });

    list.appendChild(btn);
  });

  modal.classList.add('open');
}

// ─────────────────────────────────────────────────────────
// CERRAR CON ESC Y CLIC FUERA
// ─────────────────────────────────────────────────────────

const DISMISSABLE = [
  {
    id: 'add-poi-modal',
    close: () => {
      document.getElementById('add-poi-modal')?.classList.remove('open');
      adminClickMode = false;

      const b = document.getElementById('btn-admin-mode');

      if (b) {
        b.classList.remove('active');
        b.textContent = '＋ POI';
      }

      map.getCanvas().style.cursor = '';
    }
  },
  {
    id: 'edit-poi-modal',
    close: () => document.getElementById('edit-poi-modal')?.classList.remove('open')
  },
  {
    id: 'confirm-modal',
    close: () => document.getElementById('confirm-modal')?.classList.remove('open')
  },
  {
    id: 'poi-selector',
    close: () => document.getElementById('poi-selector').classList.remove('open')
  },
  {
    id: 'fav-panel',
    close: () => document.getElementById('fav-panel')?.classList.remove('open')
  },
  {
    id: 'detail-panel',
    close: () => document.getElementById('detail-panel').classList.remove('open')
  },
];

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;

  for (const { id, close } of DISMISSABLE) {
    const el = document.getElementById(id);

    if (el?.classList.contains('open')) {
      close();
      return;
    }
  }
});

document.addEventListener('pointerdown', (e) => {
  for (const { id, close } of DISMISSABLE) {
    const el = document.getElementById(id);

    if (!el?.classList.contains('open')) continue;

    if (['add-poi-modal', 'edit-poi-modal', 'confirm-modal'].includes(id)) {
      if (!el.querySelector('.add-poi-card')?.contains(e.target)) {
        close();
        return;
      }
    } else {
      if (!el.contains(e.target)) {
        close();
        return;
      }
    }
  }
});

const session = getSession();

if (session) {
  initApp(session);
} else {
  renderLoginScreen();
}