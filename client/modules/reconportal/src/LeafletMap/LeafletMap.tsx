import React, { useMemo } from 'react';
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
import { faMap } from '@fortawesome/free-solid-svg-icons';
import { OpenTopoPopup } from './OpenTopoPopup';
import {
  createSvgMarkerIcon,
  getOpenTopoColor,
  ZoomConditionalLayerGroup,
} from './leafletUtil';
import { getFirstLatLng } from './utils';
import { useGetOpenTopo } from '@client/hooks';

/* no need to import leaflet css as already in base index
import 'leaflet/dist/leaflet.css';
*/

import styles from './LeafletMap.module.css';

export const mapConfig = {
  startingCenter: [40, -80] as L.LatLngTuple,
  minZoom: 2, // 2 typically prevents zooming out too far to see multiple earths
  maxZoom: 24, // Maximum possible detail
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

            layer.on('popupopen', () => {
              if (container.hasChildNodes()) return;

              ReactDOM.createRoot(container).render(
                <OpenTopoPopup dataset={dataset} />
              );

              // Force Leaflet to recalculate popup size
              // otherwise issue on first popup
              setTimeout(() => {
                layer.getPopup()?.update();
              }, 0);
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
        >
          <Popup>
            <OpenTopoPopup dataset={dataset} />
          </Popup>
        </Marker>
      );
    });

    return [...openTopoGeojsonFeatures, ...openTopoMarkers];
  }, [openTopoData]);

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
        <LayersControl position="topright">
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
        <ZoomConditionalLayerGroup minZoom={10}>
          {openTopoMapFeatures}
        </ZoomConditionalLayerGroup>

        {/* Zoom control */}
        <ZoomControl position="topright" />
      </MapContainer>
    </>
  );
};
