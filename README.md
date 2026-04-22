# BUAP 3D Starter

Starter web para visualizar un mapa 3D de Ciudad Universitaria BUAP usando Mapbox GL JS.

## Qué incluye

- Delimitación simple del campus con GeoJSON.
- Edificios 3D de ejemplo usando `fill-extrusion`.
- Puntos de interés con popups.
- Vista inclinada, vista cenital y giro de cámara.
- Estructura lista para crecer hacia navegación interna o modelos 3D reales.

## Requisitos

- Node.js 20 o superior recomendado.
- Un **public token** de Mapbox.

## Instalación

```bash
npm install
npm run dev
```

Abre la URL local que te muestre Vite y pega tu token público de Mapbox en el panel superior.

## Cómo personalizarlo

### 1) Ajustar el campus
Edita:
- `src/data/campus.geojson`

### 2) Cambiar o agregar edificios 3D
Edita:
- `src/data/buildings.geojson`

Cada edificio usa propiedades como:
- `height`: altura en metros
- `base`: base de extrusión
- `color`: color hexadecimal

### 3) Cambiar puntos de interés
Edita:
- `src/data/pois.geojson`

## Siguiente paso recomendado

Cuando ya te funcione este starter, lo ideal es:
1. Reemplazar los edificios de ejemplo por polígonos reales.
2. Importar modelos `.glb` de Blender para edificios emblemáticos.
3. Agregar rutas peatonales y navegación dentro del campus.
