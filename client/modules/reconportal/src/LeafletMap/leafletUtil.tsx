import { renderToStaticMarkup } from 'react-dom/server';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  useReconEventContext,
  getReconPortalEventIdentifier,
} from '@client/hooks';
import { LayerGroup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L, { MarkerCluster } from 'leaflet';
import styles from './LeafletMap.module.css';

/**
 * Create a Leaflet divIcon using any Font Awesome icon with dynamic color and size.
 */
export function createSvgMarkerIcon({
  icon,
  color = 'black',
  withOutline = true,
}: {
  icon: IconDefinition;
  color?: string;
  withOutline?: boolean;
}): L.DivIcon {
  const [width, height, , , svgPath] = icon.icon;

  const d = Array.isArray(svgPath) ? svgPath.join(' ') : svgPath;

  const html = renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox={`0 0 ${width} ${height}`}
      style={{
        filter: withOutline
          ? 'drop-shadow(0 0 1px white) drop-shadow(0 0 2px white) drop-shadow(0 0 3px white)'
          : undefined,
      }}
    >
      <path d={d} fill={color} />
    </svg>
  );

  return L.divIcon({
    className: '',
    html,
    iconAnchor: [18, 36],
  });
}

/**
 * Create a cluster icon and declare defaults
 */
const defaultClusterConfig = {
  clusterSize: 36,
  clusterBorderWidth: 3,
  clusterFontSize: 14,
};

export const createClusterIcon = (cluster: MarkerCluster) => {
  return L.divIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: styles.markerCluster,
    iconSize: L.point(
      defaultClusterConfig.clusterSize,
      defaultClusterConfig.clusterSize,
      true
    ),
  });
};

/**
 * A React-Leaflet wrapper that conditionally renders its children (e.g. markers, GeoJSON, etc.)
 * based on the current zoom level of the map.
 */
export const ZoomConditionalLayerGroup: React.FC<{
  minZoom: number;
  children: React.ReactNode;
}> = ({ minZoom, children }) => {
  const map = useMap();
  const { selectedReconPortalEventIdentfier } = useReconEventContext();
  const [visible, setVisible] = useState(map.getZoom() >= minZoom);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(
        !!selectedReconPortalEventIdentfier && map.getZoom() >= minZoom
      );
    };
    map.on('zoomend', updateVisibility);
    return () => {
      map.off('zoomend', updateVisibility);
    };
  }, [map, minZoom, selectedReconPortalEventIdentfier]);

  return visible ? <LayerGroup>{children}</LayerGroup> : null;
};

/**
 * A React-Leaflet wrapper that conditionally zooms on the selected event
 */
export const ZoomOnEventSelection: React.FC<{
  zoomLevel: number;
}> = ({ zoomLevel }) => {
  const map = useMap();
  const { selectedReconPortalEventIdentfier, filteredReconPortalEvents } =
    useReconEventContext();

  useEffect(() => {
    if (selectedReconPortalEventIdentfier) {
      /**
       * Finds the selected event and gets the point to zoom to
       */
      const selectedEvent = filteredReconPortalEvents.find(
        (event) =>
          selectedReconPortalEventIdentfier ===
          getReconPortalEventIdentifier(event)
      );
      if (selectedEvent) {
        const point = L.latLng(
          selectedEvent.location.lat,
          selectedEvent.location.lon
        );
        map.setView(point, zoomLevel, {
          animate: false,
        });
      }
    } else {
      map.setView(L.latLng(40, -80), 3);
    }
  }, [
    map,
    selectedReconPortalEventIdentfier,
    filteredReconPortalEvents,
    zoomLevel,
  ]);
  return null;
};
