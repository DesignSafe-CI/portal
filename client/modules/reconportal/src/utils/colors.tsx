import { OpenTopoDataset, ReconPortalEvent } from '@client/hooks';

/**
 * Get color for OpenTopo dataset
 */
export function getOpenTopoColor(
  dataset: OpenTopoDataset,
  isSelected?: boolean
): string {
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
    default:
      return '#666666'; // Default gray color
  }
}
