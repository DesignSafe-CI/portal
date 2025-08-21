import { useEffect, useMemo } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import ReactDOM from "react-dom/client";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

import { useReconEventContext, getReconPortalEventIdentifier } from "@client/hooks";
import { createSvgMarkerIcon } from "./leafletUtil";
import { getReconEventColor, getOpenTopoColor } from '../utils/colors';
import styles from "./LegendControl.module.css";

function LegendContent({
  selectedIconHtml,
}: {
  selectedIconHtml: string;
}) {

 const openTopoColor = getOpenTopoColor();

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
            style={{
                border: `2px solid ${openTopoColor}`, // matches weight in OT leaflet feature
            }}
            >
                <span style={{
                    background: openTopoColor,
                    opacity: 0.3, // matches fillOpacity in OT leaflet feature
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
                />
            </span>
        </span>
        <span className={styles.legendLabel}>OpenTopography Datasets</span>
      </div>

      {/* TODO Add selected OpenTopo dataset entry to legend - after WG-544 (https://github.com/DesignSafe-CI/portal/pull/1620) merged */}

    </div>
  );
}

export default function LegendControl() {
  const map = useMap();
  const { filteredReconPortalEvents, selectedReconPortalEventIdentifier } =
    useReconEventContext();

  const selectedEvent = useMemo(() => {
    if (!selectedReconPortalEventIdentifier) return null;
    return (filteredReconPortalEvents ?? []).find(
      (e) => getReconPortalEventIdentifier(e) === selectedReconPortalEventIdentifier
    );
  }, [filteredReconPortalEvents, selectedReconPortalEventIdentifier]);

  const selectedEventIconHtml = useMemo(() => {
    if (!selectedEvent) return "";
    const color = getReconEventColor(selectedEvent);
    const icon = createSvgMarkerIcon({ color, icon: faLocationDot, withOutline: false }) as any;
    return icon?.options?.html ?? "";
  }, [selectedEvent]);

  useEffect(() => {
    if (!selectedEvent) return;

    // @ts-expect-error Leaflet’s control factory typing is mis-resolved
    const control = L.control({ position: "topright" });
    let el: HTMLDivElement | null = null;
    let root: ReactDOM.Root | null = null;

    control.onAdd = () => {
      el = L.DomUtil.create("div", `leaflet-control leaflet-control-layers ${styles.root}`);
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);

      root = ReactDOM.createRoot(el);
      root.render(
        <LegendContent
          selectedIconHtml={selectedEventIconHtml}
        />
      );
      return el;
    };

    control.addTo(map);
    return () => {
      if (root) root.unmount();
      control.remove();
      el = null;
    };
  }, [map, selectedEvent, selectedEventIconHtml]);

  return null;
}
