import { FeatureCollection, Position } from 'geojson';
import L, { LatLng } from 'leaflet';

/**
 * Extract the first coordinate from a GeoJSON FeatureCollection
 * and convert it to a Leaflet LatLng ([lat, lng]).
 */
export function getFirstLatLng(geojson: FeatureCollection): LatLng {
  const firstFeature = geojson.features[0];

  const geometry = firstFeature.geometry;

  if (geometry.type === 'GeometryCollection') {
    // We don't expect this but note we are assuming not GeometryCollection as
    // it doesn't have `.coordinates` but `.geometries`
    throw new Error('GeometryCollection not supported');
  }

  if (!geometry) {
    throw new Error('No geometry found in first feature');
  }

  const coords = geometry.coordinates;

  function findFirstCoord(arr: unknown): Position {
    if (Array.isArray(arr) && typeof arr[0] === 'number') return arr as Position;
    if (Array.isArray(arr)) return findFirstCoord(arr[0]);
    throw new Error('Invalid coordinates');
  }

  // lng lat form in geojson
  const [lng, lat] = findFirstCoord(coords);

  // convert to lat, lng for leaflet use
  return L.latLng(lat, lng);
}
