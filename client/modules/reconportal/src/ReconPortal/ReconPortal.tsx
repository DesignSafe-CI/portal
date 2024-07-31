import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQueryClient } from '@tanstack/react-query';
import { useGetEvents, useGetEventTypes, useGetOpenTopo } from '@client/hooks';
import styles from './ReconPortal.module.css';

export const ReconPortal: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: events, isLoading: eventsLoading, error: eventsError } = useGetEvents();
  const { data: eventTypes, isLoading: eventTypesLoading, error: eventTypesError } = useGetEventTypes();
  const { data: openTopoData, isLoading: openTopoLoading, error: openTopoError } = useGetOpenTopo();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState({});
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      });

      const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy;',
        maxZoom: 18,
      });

      mapRef.current = L.map(mapContainerRef.current, {
        layers: [streets],
        scrollWheelZoom: true,
        minZoom: 2,
        maxBounds: [
          [-90, -180],
          [90, 180],
        ],
      }).setView([30.2672, -97.7431], 2);
      mapRef.current.zoomControl.setPosition('topright');

      // Adding layer control
      L.control.layers({ 'Streets': streets, 'Satellite': satellite }, {}).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (events && mapRef.current) {
      const reconLayer = L.layerGroup();
      events.forEach((event) => {
        const marker = L.marker([event.location.lat, event.location.lon], {
          icon: new L.Icon({
            iconUrl: getEventTypeIconUrl(event.event_type),
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        });
        marker.bindPopup(createReconPopupContent(event));
        marker.addTo(reconLayer);
        marker.on('click', () => selectEvent(event));
      });
      mapRef.current.addLayer(reconLayer);
    }
  }, [events]);

  useEffect(() => {
    if (openTopoData && mapRef.current) {
      const openTopoLayer = L.layerGroup();
      openTopoData.centroids.features.forEach((feature) => {
        let lat = 0;
        let lon = 0;
        if (feature.geometry.type === 'Point') {
          lat = feature.geometry.coordinates[1] as number;
          lon = feature.geometry.coordinates[0] as number;
        }
        const marker = L.marker([lat, lon], {
          icon: new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [16.75, 27.47],
            iconAnchor: [8.04, 27.47],
            popupAnchor: [0.67, -22.78],
            shadowSize: [27.47, 27.47],
          }),
        });
        marker.bindPopup(createOpenTopoPopupContent(feature));
        marker.addTo(openTopoLayer);
        marker.on('click', () => selectEvent(feature));
      });
      mapRef.current.addLayer(openTopoLayer);
    }
  }, [openTopoData]);

  const selectEvent = (event: any) => {
    if (mapRef.current) {
      if (event === activeEvent) {
        reset();
      } else {
        const lat = event.location ? event.location.lat : event.geometry.coordinates[1];
        const lon = event.location ? event.location.lon : event.geometry.coordinates[0];
        mapRef.current.setView([lat, lon], 8, { animate: true });
        setActiveEvent(event);
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('event', event.title || event.properties.name);
        window.history.pushState(null, '', '?' + searchParams.toString());
      }
    }
  };

  const reset = () => {
    if (mapRef.current) {
      mapRef.current.setView([30.2672, -97.7431], 2);
      setActiveEvent(null);
    }
  };

  const gotoEvent = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const eventTitle = searchParams.get('event');
    if (eventTitle && (events || openTopoData)) {
      const allEvents = [
        ...(events || []),
        ...(openTopoData?.centroids.features.map(feature => ({
          ...feature,
          title: feature.properties.name,
          location_description: '',
          location: {
            lat: feature.geometry.type === 'Point' ? feature.geometry.coordinates[1] : 0,
            lon: feature.geometry.type === 'Point' ? feature.geometry.coordinates[0] : 0,
          },
          event_date: feature.properties.dateCreated,
          event_type: 'OpenTopo',
          created_date: feature.properties.dateCreated,
        })) || [])
      ];
      const event = allEvents.find((e: any) => e.title === eventTitle || e.properties?.name === eventTitle);
      if (event) {
        selectEvent(event);
      }
    }
  };

  useEffect(() => {
    gotoEvent();
  }, [events, openTopoData]);

  const search = () => {
    const transformedOpenTopoData = (openTopoData?.original.features || []).map((feature) => ({
      title: feature.properties.name,
      location: {
        lat: feature.geometry.type === 'Point' ? feature.geometry.coordinates[1] : 0,
        lon: feature.geometry.type === 'Point' ? feature.geometry.coordinates[0] : 0,
      },
      event_date: feature.properties.dateCreated,
      event_type: 'OpenTopo',
      created_date: feature.properties.dateCreated,
      properties: feature.properties,
      location_description: '',
      datasets: [],
    }));

    const results = [...(events || []), ...transformedOpenTopoData].filter((event) => {
      return true; // Replace with actual filter logic
    });
    setFilteredEvents(results || []);
  };

  const clearFilters = () => {
    setFilterOptions({});
    search();
  };

  const getEventTypeIconUrl = (eventType: string): string => {
    const eventTypeColors: { [key: string]: string } = {
      earthquake: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
      flood: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      tsunami: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
      landslide: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      hurricane: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      tornado: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
    };
    return eventTypeColors[eventType] || 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';
  };

  const createReconPopupContent = (event: any) => {
    let formattedDate = new Date(event.event_date).toLocaleDateString('en-CA');
    return `<b>${event.title}</b><br>
            <b>Event Type:</b> <span class="event-type ${event.event_type}"> ${event.event_type} </span><br>
            <b>Data Source:</b><span class="event-type designsafe"> DesignSafe </span><br>
            <b>Event Date:</b> ${formattedDate} <br>
            <b>Location Description:</b> ${event.location_description}<br>`;
  };

  const createOpenTopoPopupContent = (feature: any) => {
    return `<b>${feature.properties.name}</b><br>
            <b>ID:</b> ${feature.properties.id}<br>
            <b>Products available:</b> ${feature.properties.productAvailable}<br>
            <b>Data Source:</b><span class="event-type opentopo"> OpenTopography </span><br>
            <b>Date Created:</b> ${feature.properties.dateCreated}<br>
            <b>Survey date:</b> ${feature.properties.temporalCoverage}<br>
            <b>DOI:</b> <a href="${feature.properties.doiUrl}" target="_blank"> ${feature.properties.doiUrl}</a>`;
  };

  if (eventsLoading || eventTypesLoading || openTopoLoading) {
    return <div>Loading...</div>;
  }

  if (eventsError || eventTypesError || openTopoError) {
    return <div>Error: {eventsError?.message || eventTypesError?.message || openTopoError?.message}</div>;
  }

  return (
    <div className={styles.reconPortal}>
      <div id="map" ref={mapContainerRef} style={{ height: '600px' }}></div>
      <div id="sidebar" className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Events</h2>
          <button onClick={clearFilters}>Clear Filters</button>
        </div>
        <div className={styles.sidebarContent}>
          <div className={styles.filterOptions}>
            {/* Add your filter options here */}
          </div>
          <div className={styles.eventResults}>
            {filteredEvents.map((event) => (
              <div key={event.title || event.properties.name} className={styles.eventListing} onClick={() => selectEvent(event)}>
                <div className={styles.eventTitle}>{event.title || event.properties.name}</div>
                <div className={styles.eventDate}>{new Date(event.event_date || event.properties.dateCreated).toLocaleDateString()}</div>
                <div className={styles.eventType}>{event.event_type || event.properties.host}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
