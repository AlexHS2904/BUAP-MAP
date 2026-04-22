mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// ── COORDENADAS ────────────────────────────────────────────
const buapCoords = [
  [-98.2045340538025, 19.00556470634405],
  [-98.20597171783449, 19.004844482595736],
  [-98.20218443870544, 18.99403060756469],
  [-98.19386959075928, 18.996982682581958],
  [-98.193998336792, 19.000827402805637],
  [-98.2045340538025, 19.00556470634405]
];

const BUAP_CENTER = [-98.1995, 19.0001];

// ── CATEGORÍAS ─────────────────────────────────────────────
const CATS = {
  aulas:      { color: '#2E6B9E', label: 'Aulas',      emoji: '🎓' },
  biblioteca: { color: '#6B4E8A', label: 'Biblioteca',  emoji: '📚' },
  comida:     { color: '#D4713A', label: 'Comida',      emoji: '🍽️' },
  deportivo:  { color: '#4A7C59', label: 'Deportivo',   emoji: '⚽' },
  servicios:  { color: '#B84040', label: 'Servicios',   emoji: '🏥' },
  admin:      { color: '#C9933A', label: 'Admin',       emoji: '🏛️' },
};

// ── POIs ───────────────────────────────────────────────────
const POIS = [
  { name: 'Facultad de Ingeniería',      coords: [-98.1996, 19.00155], cat: 'aulas',      desc: 'Ingenierías civil, mecánica, electrónica y más.' },
  { name: 'Biblioteca José M. Lafragua', coords: [-98.1982, 19.00055], cat: 'biblioteca', desc: 'La biblioteca central del campus universitario.' },
  { name: 'Estadio Universitario BUAP',  coords: [-98.2010, 18.9970],  cat: 'deportivo',  desc: 'Estadio de futbol y pista de atletismo.' },
  { name: 'Facultad de Derecho',         coords: [-98.1975, 19.0018],  cat: 'aulas',      desc: 'Licenciatura y posgrado en Ciencias Jurídicas.' },
  { name: 'Rectoría BUAP',               coords: [-98.1993, 19.0025],  cat: 'admin',      desc: 'Oficinas centrales de la rectoría universitaria.' },
  { name: 'Facultad de Arquitectura',    coords: [-98.2028, 19.0035],  cat: 'aulas',      desc: 'Diseño urbano, arquitectura e interiorismo.' },
  { name: 'Cafetería Central',           coords: [-98.2000, 19.0005],  cat: 'comida',     desc: 'Cafetería principal con menú del día.' },
];

// ── ESTADO DE NAVEGACIÓN ───────────────────────────────────
let userLocation = null;
let userMarker   = null;
let activeRoute  = null;
let navMode      = null;
let originPoi    = null;

// ── MAPA ───────────────────────────────────────────────────
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: BUAP_CENTER,
  zoom: 15.8,
  pitch: 45,
  bearing: -20,
  antialias: true,
  maxZoom: 19,
  minZoom: 13,
});

// ── HELPERS ────────────────────────────────────────────────

async function drawRoute(originCoords, destCoords) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
  const res  = await fetch(url);
  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    showNavError('No se encontró ruta. Intenta acercarte al campus.');
    return null;
  }

  const route    = data.routes[0];
  const geometry = route.geometry;
  const duration = Math.ceil(route.duration / 60);
  const distance = (route.distance / 1000).toFixed(2);

  if (map.getSource('route')) {
    map.getSource('route').setData({ type: 'Feature', geometry });
  } else {
    map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry } });

    map.addLayer({
      id: 'route-shadow',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#000', 'line-width': 8, 'line-opacity': 0.1, 'line-blur': 4 }
    });

    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#2E6B9E', 'line-width': 5, 'line-opacity': 0.9 }
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
  originPoi   = null;
  navMode     = null;
  hideNavBar();
}

function showNavBar({ destName, duration, distance, mode }) {
  const bar = document.getElementById('nav-bar');
  document.getElementById('nav-dest').textContent     = destName;
  document.getElementById('nav-duration').textContent = `🚶 ${duration} min`;
  document.getElementById('nav-distance').textContent = `📍 ${distance} km`;
  document.getElementById('nav-mode-label').textContent =
    mode === 'user' ? 'Desde tu ubicación' : 'Ruta entre puntos';
  bar.classList.add('open');
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
  if (userMarker) { userMarker.setLngLat(coords); return; }
  const el = document.createElement('div');
  el.style.cssText = `
    width: 18px; height: 18px; border-radius: 50%;
    background: #1A73E8; border: 3px solid white;
    box-shadow: 0 0 0 5px rgba(26,115,232,0.2);
  `;
  userMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
    .setLngLat(coords).addTo(map);
}

// ── ON LOAD ────────────────────────────────────────────────
map.on('load', () => {

  ['poi-label', 'airport-label', 'transit-label'].forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
  });

  map.addSource('campus', { type: 'geojson', data: '/data/buap.geojson' });
  map.addLayer({ id: 'campus-ground', type: 'fill', source: 'campus',
    paint: { 'fill-color': '#D6E8C0', 'fill-opacity': 0.55 } });
  map.addLayer({ id: 'campus-border', type: 'line', source: 'campus',
    paint: { 'line-color': '#8B6914', 'line-width': 3, 'line-opacity': 0.8 } });
  map.addLayer({ id: 'campus-glow', type: 'line', source: 'campus',
    paint: { 'line-color': '#C9933A', 'line-width': 10, 'line-opacity': 0.15, 'line-blur': 8 } });

  map.addSource('mask', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[-180,-90],[-180,90],[180,90],[180,-90],[-180,-90]],
          [...buapCoords].reverse()
        ]
      }
    }
  });
  map.addLayer({ id: 'outside-mask', type: 'fill', source: 'mask',
    paint: { 'fill-color': '#F0EBE0', 'fill-opacity': 0.55 } });

  // ── MARCADORES ─────────────────────────────────────────
  const panel      = document.getElementById('detail-panel');
  const panelName  = document.getElementById('panel-name');
  const panelDesc  = document.getElementById('panel-desc');
  const panelBadge = document.getElementById('panel-badge');
  const markers    = [];

  POIS.forEach((poi) => {
    const cat = CATS[poi.cat] || { color: '#A8956A', label: 'Lugar', emoji: '📍' };
    const el  = document.createElement('div');
    el.style.cssText = `
      width:38px; height:38px; border-radius:50% 50% 50% 0;
      transform:rotate(-45deg); background:${cat.color};
      border:2.5px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.25);
      cursor:pointer; transition:transform 0.2s,box-shadow 0.2s;
      display:flex; align-items:center; justify-content:center;
    `;
    el.dataset.cat = poi.cat;
    const inner = document.createElement('div');
    inner.style.cssText = `transform:rotate(45deg); font-size:15px; line-height:1;`;
    inner.textContent = cat.emoji;
    el.appendChild(inner);

    el.addEventListener('mouseenter', () => {
      inner.style.transform = 'rotate(45deg) scale(1.2)';  // ← escala el emoji
      el.style.boxShadow = `0 6px 18px ${cat.color}99`;
    });
    el.addEventListener('mouseleave', () => {
      inner.style.transform = 'rotate(45deg)';
      el.style.boxShadow = '0 3px 10px rgba(0,0,0,0.25)';
    });

    el.addEventListener('click', () => {
      panelName.textContent       = poi.name;
      panelDesc.textContent       = poi.desc;
      panelBadge.textContent      = cat.label;
      panelBadge.style.background = cat.color;
      activeRoute = poi;
      // Mostrar/ocultar botón "desde mi ubicación" según disponibilidad
      document.getElementById('btn-nav-user').style.display = userLocation ? 'flex' : 'none';
      panel.classList.add('open');
    });

    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(poi.coords).addTo(map);
    markers.push({ el, poi });
  });

  // ── NAVEGAR DESDE MI UBICACIÓN ─────────────────────────
  document.getElementById('btn-nav-user').addEventListener('click', async () => {
    if (!activeRoute || !userLocation) return;
    panel.classList.remove('open');
    const info = await drawRoute(userLocation, activeRoute.coords);
    if (!info) return;
    navMode = 'user';
    showNavBar({ destName: activeRoute.name, ...info, mode: 'user' });
    const b = new mapboxgl.LngLatBounds().extend(userLocation).extend(activeRoute.coords);
    map.fitBounds(b, { padding: 80, pitch: 45, duration: 900 });
  });

  // ── NAVEGAR ENTRE POIs ─────────────────────────────────
  document.getElementById('btn-nav-poi').addEventListener('click', () => {
    if (!activeRoute) return;
    panel.classList.remove('open');
    showPoiSelector(activeRoute, markers);
  });

  // ── FILTROS ────────────────────────────────────────────
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.dataset.cat;
      markers.forEach(({ el, poi: p }) => {
        el.style.display = (cat === 'all' || cat === p.cat) ? 'flex' : 'none';
      });
    });
  });

  // FIT campus
  const bounds = new mapboxgl.LngLatBounds();
  buapCoords.forEach(c => bounds.extend(c));
  map.fitBounds(bounds, { padding: 50, pitch: 45, bearing: -15, duration: 1200 });
});

// ── SELECTOR DE ORIGEN (POI → POI) ────────────────────────
function showPoiSelector(dest, markers) {
  const modal = document.getElementById('poi-selector');
  const list  = document.getElementById('poi-selector-list');
  list.innerHTML = '';

  POIS.forEach((poi) => {
    if (poi.name === dest.name) return;
    const cat = CATS[poi.cat];
    const btn = document.createElement('button');
    btn.className = 'poi-selector-item';
    btn.innerHTML = `<span style="font-size:20px">${cat.emoji}</span><span>${poi.name}</span>`;
    btn.addEventListener('click', async () => {
      modal.classList.remove('open');
      originPoi = poi;
      navMode   = 'poi';
      const info = await drawRoute(poi.coords, dest.coords);
      if (!info) return;
      showNavBar({ destName: dest.name, ...info, mode: 'poi' });
      const b = new mapboxgl.LngLatBounds().extend(poi.coords).extend(dest.coords);
      map.fitBounds(b, { padding: 80, pitch: 45, duration: 900 });
    });
    list.appendChild(btn);
  });

  modal.classList.add('open');
}

document.getElementById('poi-selector-close').addEventListener('click', () => {
  document.getElementById('poi-selector').classList.remove('open');
});

// ── PANEL CERRAR ──────────────────────────────────────────
const panel = document.getElementById('detail-panel');
document.getElementById('panel-close').addEventListener('click', () => {
  panel.classList.remove('open');
});
let touchStartY = 0;
panel.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
panel.addEventListener('touchend',   e => {
  if (e.changedTouches[0].clientY - touchStartY > 60) panel.classList.remove('open');
});

// ── NAV BAR CERRAR ────────────────────────────────────────
document.getElementById('nav-bar-close').addEventListener('click', clearRoute);

// ── BOTÓN MI UBICACIÓN ────────────────────────────────────
document.getElementById('btn-location').addEventListener('click', () => {
  if (!navigator.geolocation) {
    showNavError('Tu navegador no soporta geolocalización.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = [pos.coords.longitude, pos.coords.latitude];
      placeUserMarker(userLocation);
      map.flyTo({ center: userLocation, zoom: 16.5, pitch: 45, duration: 900 });
    },
    () => showNavError('No se pudo obtener tu ubicación. Revisa los permisos.'),
    { enableHighAccuracy: true }
  );
});

// ── BOTONES ───────────────────────────────────────────────
function fitCampus(pitch = 45, bearing = -15) {
  const bounds = new mapboxgl.LngLatBounds();
  buapCoords.forEach(c => bounds.extend(c));
  map.fitBounds(bounds, { padding: 50, pitch, bearing, duration: 900 });
}

document.getElementById('btn-campus').onclick = () => fitCampus(45, -15);
document.getElementById('btn-top').onclick    = () => fitCampus(0, 0);
document.getElementById('btn-rotate').onclick = () =>
  map.rotateTo(map.getBearing() + 90, { duration: 900 });