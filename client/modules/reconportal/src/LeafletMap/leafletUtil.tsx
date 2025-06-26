import { renderToStaticMarkup } from 'react-dom/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  OpenTopoDataset,
  ReconPortalEvents,
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
 * Get color for OpenTopo dataset
 */
export function getOpenTopoColor(dataset: OpenTopoDataset): string {
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
  dataset: ReconPortalEvents | undefined | null
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

    [
      map,
      selectedReconPortalEventIdentfier,
      filteredReconPortalEvents,
      zoomLevel,
    ];
  });
  return null;
};
