import { renderToStaticMarkup } from 'react-dom/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { OpenTopoDataset } from '@client/hooks';
import { LayerGroup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
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
  // TODO: derive color from hazard type https://tacc-main.atlassian.net/browse/WG-510
  //  Confirm we can do this for some and if not what is our fall
  // back color
  return 'black';
}

/**
 * A React-Leaflet wrapper that conditionally renders its children (e.g. markers, GeoJSON, etc.)
 * based on the current zoom level of the map.
 */
export const ZoomConditionalLayerGroup: React.FC<{
  minZoom: number;
  children: React.ReactNode;
}> = ({ minZoom, children }) => {
  const map = useMap();
  const [visible, setVisible] = useState(map.getZoom() >= minZoom);

  useEffect(() => {
    const updateVisibility = () => {
      // TODO also include when DS event is selected
      // See https://github.com/DesignSafe-CI/portal/pull/1558 and https://tacc-main.atlassian.net/browse/WG-500
      setVisible(map.getZoom() >= minZoom);
    };
    map.on('zoomend', updateVisibility);
    return () => {
      map.off('zoomend', updateVisibility);
    };
  }, [map, minZoom]);

  return visible ? <LayerGroup>{children}</LayerGroup> : null;
};
