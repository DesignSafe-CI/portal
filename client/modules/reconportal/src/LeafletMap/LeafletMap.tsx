import React, { useMemo, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  MapContainer,
  ZoomControl,
  TileLayer,
  LayersControl,
  GeoJSON,
  Marker,
  Popup,
} from 'react-leaflet';
import { faMap, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { OpenTopoPopup } from './OpenTopoPopup';
import {
  createSvgMarkerIcon,
  ZoomConditionalLayerGroup,
  createClusterIcon,
  ZoomOnEventSelection,
} from './leafletUtil';
import { getOpenTopoColor, getReconEventColor } from '../utils';
import { getFirstLatLng } from './utils';
import {
  type ReconPortalEvents,
  useGetOpenTopo,
  useReconEventContext,
  getReconPortalEventIdentifier,
} from '@client/hooks';
import 'leaflet.markercluster';
import MarkerClusterGroup from 'react-leaflet-markercluster';

/* no need to import leaflet css as already in base index
import 'leaflet/dist/leaflet.css';
*/

import styles from './LeafletMap.module.css';
import { ReconPortalPopup } from './ReconPortalPopUp';
import { LeafletMouseEvent } from 'leaflet';

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
  const { data: openTopoData } = useGetOpenTopo();
  const {
    setSelectedReconPortalEventIdentifier,
    filteredReconPortalEvents,
    selectedReconPortalEventIdentfier,
  } = useReconEventContext();

  const [showSelectedPopup, setShowSelectedPopup] = useState(false);

  // Delay popup display to prevent incorrect initial sizing during zoom
  useEffect(() => {
    setShowSelectedPopup(false);

    if (!selectedReconPortalEventIdentfier) return;

    const timer = setTimeout(() => {
      setShowSelectedPopup(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedReconPortalEventIdentfier]);

  const openTopoMapFeatures = useMemo(() => {
    const datasets = openTopoData?.Datasets ?? [];

    // Features for open topo (just polygon and multipolygons)
    const openTopoGeojsonFeatures: React.ReactNode[] = [];

    // Markers for open topo things that aren't points
    const openTopoMarkers: React.ReactNode[] = [];

    // Fill openTopoGeojsonFeatures with everything
    datasets.map(({ Dataset: dataset }, index) => {
      const { geojson } = dataset.spatialCoverage.geo;

      // Main GeoJSON rendering
      openTopoGeojsonFeatures.push(
        <GeoJSON
          /* Duplicate datasets exist so need an extra index to make unqiue.  Background: OpenTopo seems to have \
          a duplicate entry for some with multiple types of data e.g. "Point Clouds, Raster" */
          key={`geojson-${dataset.identifier.value}-${index}`}
          data={geojson}
          style={() => ({
            color: getOpenTopoColor(dataset),
            weight: 2,
            fillOpacity: 0.3,
          })}
          onEachFeature={(feature, layer) => {
            const container = document.createElement('div');
            layer.bindPopup(container);

            let popupRendered = false;

            const renderPopup = () => {
              if (!popupRendered) {
                ReactDOM.createRoot(container).render(
                  <OpenTopoPopup dataset={dataset} />
                );
                popupRendered = true;

                // Force Leaflet to recalculate popup size
                // otherwise issue on first popup
                setTimeout(() => {
                  layer.getPopup()?.update();
                }, 0);
              }
            };

            const openPopupAtEventLocation = (e: LeafletMouseEvent) => {
              renderPopup();
              layer.openPopup(e.latlng);
            };

            // keep track of closing as when we move into popup that is a situation
            // where we don't want to close it
            let closeTimeout: ReturnType<typeof setTimeout> | null = null;

            layer.on('click', (e) => {
              openPopupAtEventLocation(e);
            });

            layer.on('mouseover', (e) => {
              openPopupAtEventLocation(e);
            });

            layer.on('mouseout', () => {
              closeTimeout = setTimeout(() => {
                layer.closePopup();
              }, 300);
            });

            /**
             * Keeps the popup open when the user moves the mouse from the feature into the popup.
             * Cancels the close timeout on mouseenter and restarts it on mouseleave.
             * This prevents the popup from closing prematurely while the user interacts with links or content.
             */
            layer.on('popupopen', () => {
              const popupEl = layer.getPopup()?.getElement();
              if (!popupEl) return;

              popupEl.addEventListener('mouseenter', () => {
                if (closeTimeout) {
                  clearTimeout(closeTimeout);
                  closeTimeout = null;
                }
              });

              popupEl.addEventListener('mouseleave', () => {
                closeTimeout = setTimeout(() => {
                  layer.closePopup();
                }, 300);
              });
            });
          }}
        />
      );
    });

    // Fill openTopoMarkers with a point for each dataset
    datasets.map(({ Dataset: dataset }, index) => {
      const { geojson } = dataset.spatialCoverage.geo;

      const latlngPosition = getFirstLatLng(geojson);

      const icon = createSvgMarkerIcon({
        color: getOpenTopoColor(dataset),
        icon: faMap,
      });

      openTopoMarkers.push(
        <Marker
          /* Duplicate datasets exist so need an extra index to make unqiue.  Background: OpenTopo seems to have \
          a duplicate entry for some with multiple types of data e.g. "Point Clouds, Raster" */
          key={`marker-${dataset.identifier.value}-${index}`}
          position={latlngPosition}
          icon={icon}
          eventHandlers={{
            mouseover: (e) => {
              e.target.togglePopup();
            },
          }}
        >
          <Popup>
            <OpenTopoPopup dataset={dataset} />
          </Popup>
        </Marker>
      );
    });

    return [...openTopoGeojsonFeatures, ...openTopoMarkers];
  }, [openTopoData]);

  const handleFeatureClick = (reconEvent: ReconPortalEvents) => {
    setSelectedReconPortalEventIdentifier(
      getReconPortalEventIdentifier(reconEvent)
    );
  };

  // Find the selected event for the banner
  const selectedEvent = selectedReconPortalEventIdentfier
    ? filteredReconPortalEvents?.find(
        (event) =>
          getReconPortalEventIdentifier(event) ===
          selectedReconPortalEventIdentfier
      )
    : null;

  const ReconPortalEvents = useMemo(() => {
    const datasets = filteredReconPortalEvents ?? [];
    const reconPortalMarkers: React.ReactNode[] = [];

    datasets.map((reconEvent, index) => {
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
            click: (e) => handleFeatureClick(reconEvent),
            mouseover: (e) => {
              // Only show hover popup if this marker is not currently selected
              if (
                getReconPortalEventIdentifier(reconEvent) !==
                selectedReconPortalEventIdentfier
              ) {
                e.target.openPopup();
              }
            },
            mouseout: (e) => {
              // Only close hover popup if this marker is not currently selected
              if (
                getReconPortalEventIdentifier(reconEvent) !==
                selectedReconPortalEventIdentfier
              ) {
                setTimeout(() => {
                  e.target.closePopup();
                }, 1000);
              }
            },
          }}
        >
          <Popup closeButton={false}>
            <ReconPortalPopup dataset={reconEvent}  />
          </Popup>
        </Marker>
      );
    });
    return [...reconPortalMarkers];
  }, [filteredReconPortalEvents, selectedReconPortalEventIdentfier]);

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
          {openTopoMapFeatures}
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
        {selectedEvent && showSelectedPopup && (
          <Popup
            position={[selectedEvent.location.lat, selectedEvent.location.lon]}
            offset={[0, -10]}
            closeButton={false}
            closeOnClick={false}
            autoClose={false}
          >
            <ReconPortalPopup dataset={selectedEvent} showDetails={false} />
          </Popup>
        )}
      </MapContainer>
    </>
  );
};
