import React from 'react';
import {
  MapContainer,
  ZoomControl,
  TileLayer,
  LayersControl,
} from 'react-leaflet';

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
              maxNativeZoom={14} /* Available zoom level should be higher but seems to be errors */
            />
        </LayersControl.BaseLayer>
      </LayersControl>

      {/* Zoom control */}
      <ZoomControl position="topright" />

    </MapContainer>
    </>
  );
};