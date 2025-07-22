import React, { useEffect, useRef, useState } from 'react';
import { Popup } from 'react-leaflet';
import L from 'leaflet';
import styles from './ReconPortalSelectedPopUp.module.css';
import { ReconPortalPopup } from './ReconPortalPopUpContent';
import type { ReconPortalEvent } from '@client/hooks';

interface Props {
  selectedEvent: ReconPortalEvent;
}

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

    // Once the popup ref is available, trigger the update
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
      <ReconPortalPopup dataset={selectedEvent} showDetails={false} />
    </Popup>
  );
};
