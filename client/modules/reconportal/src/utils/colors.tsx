import { OpenTopoDataset, ReconPortalEvent } from '@client/hooks';

/**
 * Get color for OpenTopo dataset
 */
export function getOpenTopoColor(isSelected?: boolean): string {
  if (isSelected) {
    return '#FFD230';
  }
  return '#D6D3D1';
}

/**
 * Get fill color for OpenTopo dataset
 */
export function getOpenTopoFillColor(isSelected?: boolean): string {
  if (isSelected) {
    return '#FFD230';
  }
  return 'black';
}

/**
 * Declare and get color for Recon Portal dataset
 */
export const EVENT_TYPE_COLORS = {
  earthquake: ' #D34141',
  flood: ' #5D1393',
  tsunami: ' #CCC526',
  landslide: ' #57D657',
  hurricane: ' #47A59D',
  tornado: ' #FF5722',
  storm_surge: '#2E86AB',
  extreme_temperature: '#8B4789',
  drought: '#795548',
  wind: '#1E3A8A', //Needs to be added to elastic search
  fire: '#EC407A',
  pandemic: '#FFA726',
  multi: '#6B8E23',
  thunderstorm: '#607D8B',
};

export function getReconEventColor(
  dataset: ReconPortalEvent | undefined | null
): string {
  if (!dataset) return '#666666'; // Default gray color
  switch (dataset?.event_type) {
    case 'earthquake':
      return EVENT_TYPE_COLORS.earthquake;
    case 'flood':
      return EVENT_TYPE_COLORS.flood;
    case 'tsunami':
      return EVENT_TYPE_COLORS.tsunami;
    case 'landslide':
      return EVENT_TYPE_COLORS.landslide;
    case 'hurricane':
      return EVENT_TYPE_COLORS.hurricane;
    case 'tornado':
      return EVENT_TYPE_COLORS.tornado;
    case 'storm_surge':
      return EVENT_TYPE_COLORS.storm_surge;
    case 'extreme_temperature':
      return EVENT_TYPE_COLORS.extreme_temperature;
    case 'drought':
      return EVENT_TYPE_COLORS.drought;
    case 'wind':
      return EVENT_TYPE_COLORS.wind;
    case 'fire':
      return EVENT_TYPE_COLORS.fire;
    case 'pandemic':
      return EVENT_TYPE_COLORS.pandemic;
    case 'multi':
      return EVENT_TYPE_COLORS.multi;
    case 'thunderstorm':
      return EVENT_TYPE_COLORS.thunderstorm;
    default:
      return '#666666'; // Default gray color
  }
}
