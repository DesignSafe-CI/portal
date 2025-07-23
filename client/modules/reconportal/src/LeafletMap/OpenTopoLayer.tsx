import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GeoJSON, Marker, Popup } from 'react-leaflet';
import { faMap } from '@fortawesome/free-solid-svg-icons';
import { OpenTopoPopupContent } from './OpenTopoPopupContent';
import { createSvgMarkerIcon } from './leafletUtil';
import { getOpenTopoColor } from '../utils';
import { getFirstLatLng } from './utils';
import { useGetOpenTopo } from '@client/hooks';

import { LeafletMouseEvent } from 'leaflet';

/**
 * Renders OpenTopography datasets as Leaflet layers:
 * - Fetches open topo data
 * - Draws polygons with styled borders
 * - Adds additional marker for each dataset (put at first lat/long pair we find)
 * - Attaches interactive popups with hover‑safe behavior
 */
export const OpenTopoLayer: React.FC = () => {
  const { data: openTopoData } = useGetOpenTopo();

  const features = useMemo(() => {
    const datasets = openTopoData?.Datasets ?? [];

    // Features for open topo (currently just polygon and multipolygons)
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
                  <OpenTopoPopupContent dataset={dataset} />
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

            layer.on('mouseover', (e) => {
              if (closeTimeout) {
                clearTimeout(closeTimeout);
                closeTimeout = null;
              }
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
    datasets.forEach(({ Dataset: dataset }, index) => {
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
            <OpenTopoPopupContent dataset={dataset} />
          </Popup>
        </Marker>
      );
    });

    return [...openTopoGeojsonFeatures, ...openTopoMarkers];
  }, [openTopoData]);

  return <>{features}</>;
};
