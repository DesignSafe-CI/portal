import React, { useEffect, useRef, useState } from 'react';
import { Popup } from 'react-leaflet';
import L from 'leaflet';
import styles from './ReconPortalSelectedPopUp.module.css';
import { ReconPortalPopupContent } from './ReconPortalPopUpContent';
import type { ReconPortalEvent } from '@client/hooks';

interface Props {
  selectedEvent: ReconPortalEvent;
}

/**
 * Leaflet popup for displaying details about the currently selected Recon
 */
export const ReconPortalSelectedPopup: React.FC<Props> = ({
  selectedEvent,
}) => {
  const popupRef = useRef<L.Popup | null>(null);

  const [popupInstanceReady, setPopupInstanceReady] = useState(false);

  // Reset internal state when the selected event changes
  useEffect(() => {
    setPopupInstanceReady(false);
  }, [selectedEvent]);

  useEffect(() => {
    if (!popupInstanceReady) return;

    // Once the popup ref is available, force Leaflet to recalculate
    // popup size otherwise issue on first popup
    popupRef.current?.update();
  }, [popupInstanceReady]);

  return (
    <Popup
      ref={(ref) => {
        if (ref && 'getPopup' in ref) {
          popupRef.current = (ref as any)._popup as L.Popup;
          setPopupInstanceReady(true);
        }
      }}
      className={styles.selectedEventPopup}
      position={[selectedEvent.location.lat, selectedEvent.location.lon]}
      offset={[0, -10]}
      closeButton={false}
      closeOnClick={false}
      autoClose={false}
    >
      <ReconPortalPopupContent event={selectedEvent} showDetails={false} />
    </Popup>
  );
};
