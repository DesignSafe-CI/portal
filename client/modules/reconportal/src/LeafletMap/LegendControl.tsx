import { useMemo, useState, useEffect } from 'react';
import CustomControl from 'react-leaflet-custom-control';
import { useMap } from 'react-leaflet';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';

import {
  useReconEventContext,
  getReconPortalEventIdentifier,
} from '@client/hooks';
import { createSvgMarkerIcon } from './leafletUtil';
import { getReconEventColor, getOpenTopoColor } from '../utils/colors';
import styles from './LegendControl.module.css';

function LegendContent({ selectedIconHtml }: { selectedIconHtml: string }) {
  const openTopoColor = getOpenTopoColor();
  const selectedOpenTopoColor = getOpenTopoColor(true);
  return (
    <div className={styles.container}>
      <div className={styles.legendRow}>
        <span
          className={styles.legendIcon}
          dangerouslySetInnerHTML={{ __html: selectedIconHtml }}
        />
        <span className={styles.legendLabel}>Selected Event</span>
      </div>

      <div className={styles.legendRow}>
        <span className={styles.legendIcon}>
          <span
            className={styles.legendSwatch}
            style={{ border: `2px solid ${openTopoColor}` }}
          >
            <span
              style={{
                background: openTopoColor,
                opacity: 0.3,
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            />
          </span>
        </span>
        <span className={styles.legendLabel}>OpenTopography Datasets</span>
      </div>
      <div className={styles.legendRow}>
        <span className={styles.legendIcon}>
          <span
            className={styles.legendSwatch}
            style={{ border: `2px solid ${selectedOpenTopoColor}` }}
          >
            <span
              style={{
                background: selectedOpenTopoColor,
                opacity: 0.3,
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            />
          </span>
        </span>
        <span className={styles.legendLabel}>
          Selected OpenTopography Dataset
        </span>
      </div>
    </div>
  );
}

type LegendControlProps = {
  /** Only show the legend at or above this zoom level */
  minZoom: number;
};

/**
 * Leaflet map legend control.
 *
 * Has legend entries
 *   - Selected ReconPortal event
 *   - OpenTopography dataset
 *
 *  Only visible when an ReconPortal event is selected and zoom ≥ minZoom. This ensures
 * the legend only shows up when we are displying recon portal datasets
 */
export default function LegendControl({ minZoom }: LegendControlProps) {
  const map = useMap();

  // Track if zoom is ok to show the legend
  const [zoomOK, setZoomOK] = useState(false);

  // update zoomOk on load or when zoom changes
  useEffect(() => {
    const updateZoom = () => setZoomOK(map.getZoom() >= minZoom);
    map.on('zoomend', updateZoom);
    // run once on mount, in case selectedEvent changes before zoomend
    updateZoom();
    return () => {
      map.off('zoomend', updateZoom);
    };
  }, [map, minZoom]);

  const { filteredReconPortalEvents, selectedReconPortalEventIdentifier } =
    useReconEventContext();

  const selectedEvent = useMemo(() => {
    if (!selectedReconPortalEventIdentifier) return null;
    return (filteredReconPortalEvents ?? []).find(
      (e) =>
        getReconPortalEventIdentifier(e) === selectedReconPortalEventIdentifier
    );
  }, [filteredReconPortalEvents, selectedReconPortalEventIdentifier]);

  const selectedEventIconHtml = useMemo(() => {
    if (!selectedEvent) return '';
    const color = getReconEventColor(selectedEvent);
    const icon = createSvgMarkerIcon({
      color,
      icon: faLocationDot,
      withOutline: false,
    }) as any;
    return icon?.options?.html ?? '';
  }, [selectedEvent]);

  return (
    <CustomControl position={'topright'}>
      {selectedEvent && zoomOK && (
        <div className={`leaflet-control-layers ${styles.root}`}>
          <LegendContent selectedIconHtml={selectedEventIconHtml} />
        </div>
      )}
    </CustomControl>
  );
}
