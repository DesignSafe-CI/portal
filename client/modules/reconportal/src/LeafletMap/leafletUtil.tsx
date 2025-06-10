import { renderToStaticMarkup } from 'react-dom/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { OpenTopoDataset } from '@client/hooks';
import L from 'leaflet';

/**
 * Create a Leaflet divIcon using any Font Awesome icon with dynamic color and size.
 */
export function createSvgMarkerIcon({
  color = 'black',
  size = '2x',
  icon,
}: {
  color?: string;
  size?: 'xs' | 'sm' | 'lg' | '1x' | '2x' | '3x';
  icon: IconDefinition;
}): L.DivIcon {
  const html = renderToStaticMarkup(
    <FontAwesomeIcon icon={icon} color={color} size={size} />
  );

  return L.divIcon({
    className: '',
    html,
    iconAnchor: [12, 24],
  });
}

/**
 * Get color for OpenTopo dataset
 */
export function getOpenTopoColor(dataset: OpenTopoDataset): string {
  // TODO: derive color from hazard type
  //  Confirm we can do this for some and if not what is our fall
  // back color
  return 'black';
}
