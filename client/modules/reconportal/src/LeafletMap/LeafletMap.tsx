import React, { useMemo } from 'react';
import {
  MapContainer,
  ZoomControl,
  TileLayer,
  LayersControl,
  Marker,
  Popup,
} from 'react-leaflet';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import {
  createSvgMarkerIcon,
  ZoomConditionalLayerGroup,
  createClusterIcon,
  ZoomOnEventSelection,
} from './leafletUtil';
import { getReconEventColor } from '../utils';
import {
  useReconEventContext,
  getReconPortalEventIdentifier,
  ReconPortalEvent,
} from '@client/hooks';
import { OpenTopoLayer } from './OpenTopoLayer';
import 'leaflet.markercluster';
import MarkerClusterGroup from 'react-leaflet-markercluster';

/* no need to import leaflet css as already in base index
import 'leaflet/dist/leaflet.css';
*/

import styles from './LeafletMap.module.css';
import { ReconPortalPopupContent } from './ReconPortalPopUpContent';
import { ReconPortalSelectedPopup } from './ReconPortalSelectedPopUp';

export const mapConfig = {
  startingCenter: [40, -80] as L.LatLngTuple,
  minZoom: 2, // 2 typically prevents zooming out too far to see multiple earths
  maxZoom: 24, // Maximum possible detail
  maxFitBoundsSelectedFeatureZoom: 18,
  maxBounds: [
    [-90, -180], // Southwest coordinates
    [90, 180], // Northeast coordinates
  ] as L.LatLngBoundsExpression,
} as const;

/**
 * Leaflet Map
 */
export const LeafletMap: React.FC = () => {
  const {
    setSelectedReconPortalEventIdentifier,
    filteredReconPortalEvents,
    selectedReconPortalEventIdentifier,
  } = useReconEventContext();

  const handleFeatureClick = (reconEvent: ReconPortalEvent) => {
    setSelectedReconPortalEventIdentifier(
      getReconPortalEventIdentifier(reconEvent)
    );
  };

  // Find the selected event for the banner
  const selectedEvent = selectedReconPortalEventIdentifier
    ? filteredReconPortalEvents?.find(
        (event) =>
          getReconPortalEventIdentifier(event) ===
          selectedReconPortalEventIdentifier
      )
    : null;

  const ReconPortalEvents = useMemo(() => {
    const reconPortalEvents = filteredReconPortalEvents ?? [];
    const reconPortalMarkers: React.ReactNode[] = [];
    let closeTimeout: ReturnType<typeof setTimeout> | null = null;

    reconPortalEvents.forEach((reconEvent, index) => {
      const icon = createSvgMarkerIcon({
        color: getReconEventColor(reconEvent),
        icon: faLocationDot,
      });
      reconPortalMarkers.push(
        <Marker
          key={`${reconEvent.title}-index`}
          icon={icon}
          position={[reconEvent.location.lat, reconEvent.location.lon]}
          eventHandlers={{
            click: () => handleFeatureClick(reconEvent),
            mouseover: (e) => {
              // Only show hover popup if this marker is not currently selected
              if (
                getReconPortalEventIdentifier(reconEvent) !==
                selectedReconPortalEventIdentifier
              ) {
                if (closeTimeout) {
                  clearTimeout(closeTimeout);
                  closeTimeout = null;
                }
                e.target.openPopup();
              }
            },
            mouseout: (e) => {
              // Only close hover popup if this marker is not currently selected
              if (
                getReconPortalEventIdentifier(reconEvent) !==
                selectedReconPortalEventIdentifier
              ) {
                closeTimeout = setTimeout(() => {
                  e.target.closePopup();
                }, 300);
              }
            },

            popupopen: (e) => {
              // With these listeners, we are preventing the popup from closing if the
              // user moves their mouse from the marker into the popup itself

              const popupEl = e.popup.getElement();
              if (!popupEl) return;

              popupEl.addEventListener('mouseenter', () => {
                if (closeTimeout) {
                  clearTimeout(closeTimeout);
                  closeTimeout = null;
                }
              });

              popupEl.addEventListener('mouseleave', () => {
                closeTimeout = setTimeout(() => {
                  e.popup.close();
                }, 300);
              });
            },
          }}
        >
          <Popup closeButton={false}>
            <ReconPortalPopupContent event={reconEvent} />
          </Popup>
        </Marker>
      );
    });
    return [...reconPortalMarkers];
  }, [filteredReconPortalEvents, selectedReconPortalEventIdentifier]);

  return (
    <>
      <MapContainer
        center={mapConfig.startingCenter}
        zoom={3}
        className={styles.root}
        zoomControl={false}
        minZoom={mapConfig.minZoom}
        maxZoom={mapConfig.maxZoom}
        maxBounds={mapConfig.maxBounds}
        preferCanvas={true}
      >
        {/* Base layers */}
        <LayersControl position="topright" collapsed={false}>
          <LayersControl.BaseLayer checked name="View Borders">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxNativeZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="View Terrain">
            <TileLayer
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              maxNativeZoom={
                14
              } /* Available zoom level should be higher but seems to be errors */
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Open Topo features, only visible when zoomed in and DS event selected*/}
        <ZoomConditionalLayerGroup minZoom={9}>
          <OpenTopoLayer />
        </ZoomConditionalLayerGroup>
        {/* Recon Portal features, only zoomed in when DS event selected*/}
        <ZoomOnEventSelection zoomLevel={11}></ZoomOnEventSelection>
        {/* Marker Features with Clustering (also includes point cloud markers) */}
        <MarkerClusterGroup
          zIndexOffset={1}
          iconCreateFunction={createClusterIcon}
          chunkedLoading={true}
          showCoverageOnHover={false}
          animate={true}
          maxFitBoundsSelectedFeatureZoom={15}
          spiderifyOnHover={true}
          spiderfyOnMaxZoom={true}
          spiderfyOnZoom={15}
          zoomToBoundsOnClick={true}
        >
          {ReconPortalEvents}
        </MarkerClusterGroup>
        {/* Zoom control */}
        <ZoomControl position="topright" />

        {/* Selected event banner popup */}
        {selectedEvent && (
          <ReconPortalSelectedPopup selectedEvent={selectedEvent} />
        )}
      </MapContainer>
    </>
  );
};
