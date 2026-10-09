const RADIO_TIERRA_METROS = 6_371_000;

/** Distancia en metros entre dos coordenadas (fórmula de Haversine). */
export function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (grados: number) => (grados * Math.PI) / 180;
  const deltaLat = rad(lat2 - lat1);
  const deltaLng = rad(lng2 - lng1);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * RADIO_TIERRA_METROS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Caja aproximada (en grados) que contiene un círculo de `metros` alrededor del punto. Sirve como prefiltro en SQL. */
export function cajaAlrededor(lat: number, lng: number, metros: number) {
  const deltaLat = metros / 111_320;
  const deltaLng = metros / (111_320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.000001));
  return { latMin: lat - deltaLat, latMax: lat + deltaLat, lngMin: lng - deltaLng, lngMax: lng + deltaLng };
}

/** Clave de una "zona" (celda de ~1 km) usada para contar zonas distintas reportadas por un usuario. */
export function claveZona(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}
