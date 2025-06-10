import { OpenTopoDataset } from '@client/hooks';
import { FeatureCollection, Position } from 'geojson';
import L, { LatLng } from 'leaflet';

/**
 * Extract the first coordinate from a GeoJSON FeatureCollection
 * and convert it to a Leaflet LatLng ([lat, lng]).
 *
 * This handles nested coordinates, assumes the geometry is not a GeometryCollection,
 * and always returns a Leaflet-friendly format.
 *
 * @param geojson - A GeoJSON FeatureCollection
 * @returns Leaflet LatLng (lat, lng)
 * @throws If no usable geometry is found
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

  function findFirstCoord(arr: any): Position {
    if (typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      return arr as Position;
    }
    return findFirstCoord(arr[0]);
  }

  // lng lat form in geojson
  const [lng, lat] = findFirstCoord(coords);

  // convert to lat, lng for leaflet use
  return L.latLng(lat, lng);
}
