import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GeoJSON } from 'react-leaflet';
import { OpenTopoPopupContent } from './OpenTopoPopupContent';
import { getOpenTopoColor, getOpenTopoFillColor } from '../utils/colors';
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
  const [selectedOpenTopoDataset, setSelectedOpenTopoDataset] = useState<
    string | null
  >(null);

  const features = useMemo(() => {
    const datasets = openTopoData?.Datasets ?? [];

    // Features for open topo (currently just polygon and multipolygons)
    const openTopoGeojsonFeatures: React.ReactNode[] = [];

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
          style={() => {
            const isSelected =
              selectedOpenTopoDataset === dataset.identifier.value;
            return {
              color: getOpenTopoColor(isSelected),
              fillColor: getOpenTopoFillColor(isSelected),
              weight: isSelected ? 4 : 2,
              fillOpacity: isSelected ? 0.6 : 0.4,
              dashArray: isSelected ? '5, 10' : undefined,
            };
          }}
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

            layer.on('click', (e) => {
              setSelectedOpenTopoDataset(dataset.identifier.value);
              openPopupAtEventLocation(e);
            });

            layer.on('popupclose', () => {
              setSelectedOpenTopoDataset(null);
            });
          }}
        />
      );
    });

    return openTopoGeojsonFeatures;
  }, [openTopoData, selectedOpenTopoDataset]);

  return <>{features}</>;
};
