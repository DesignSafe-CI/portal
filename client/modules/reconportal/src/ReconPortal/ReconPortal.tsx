import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayerGroup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQueryClient } from '@tanstack/react-query';
import { useGetEvents, useGetEventTypes, useGetOpenTopo } from '@client/hooks';
import styles from './ReconPortal.module.css';
import '../styles/tailwind.css';

const DefaultCenter: LatLngExpression = [30.2672, -97.7431];
const DefaultZoom = 2;

const CustomIcon = (iconUrl: string) =>
  new L.Icon({
    iconUrl,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

export const ReconPortal: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: events, isLoading: eventsLoading, error: eventsError } = useGetEvents();
  const { data: eventTypes, isLoading: eventTypesLoading, error: eventTypesError } = useGetEventTypes();
  const { data: openTopoData, isLoading: openTopoLoading, error: openTopoError } = useGetOpenTopo();
  const mapRef = useRef<L.Map | null>(null);
  const [activeEvent, setActiveEvent] = useState<any>(null);

  const MapComponent = () => {
    const map = useMap();
    useEffect(() => {
      if (map && !mapRef.current) {
        mapRef.current = map;
        map.setView(DefaultCenter, DefaultZoom);
        map.setMinZoom(2);
        map.setMaxBounds([[-90, -180], [90, 180]]);
        map.zoomControl.setPosition('topright');
      }
    }, [map]);

    return null;
  };

  const selectEvent = (event: any) => {
    if (mapRef.current) {
      if (event === activeEvent) {
        reset();
      } else {
        const lat = event.location ? event.location.lat : event.geometry.coordinates[1];
        const lon = event.location ? event.location.lon : event.geometry.coordinates[0];
        mapRef.current.setView([lat, lon], 8, { animate: true });
        setActiveEvent(event);
        if (!event.properties){
          const searchParams = new URLSearchParams(window.location.search);
          searchParams.set('event', event.title || event.properties.name);
          window.history.pushState(null, '', '?' + searchParams.toString());
        }
        
        
      }
    }
  };

  const reset = () => {
    if (mapRef.current) {
      mapRef.current.setView(DefaultCenter, DefaultZoom);
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('event');
      window.history.pushState(null, '', '?' + searchParams.toString());
      setActiveEvent(null);
    }
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
    // <div className="flex w-full h-screen">
    //   <MapContainer center={DefaultCenter} zoom={DefaultZoom} scrollWheelZoom={true} style={{ height: '100vh', width: '75%' }}>
    //     <MapComponent />
    //     <TileLayer
    //       attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    //       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    //     />
    //     <TileLayer
    //       attribution='&copy;'
    //       url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    //     />
    //     <LayerGroup>
    //       {events?.map((event) => (
    //         <Marker
    //           key={event.title}
    //           position={[event.location.lat, event.location.lon]}
    //           icon={CustomIcon(getEventTypeIconUrl(event.event_type))}
    //           eventHandlers={{
    //             click: () => selectEvent(event),
    //           }}
    //         >
    //           <Popup>
    //             <div dangerouslySetInnerHTML={{ __html: createReconPopupContent(event) }} />
    //           </Popup>
    //         </Marker>
    //       ))}
    //     </LayerGroup>
    //     <LayerGroup>
    //       {openTopoData?.centroids.features.map((feature) => {
    //         const lat = feature.geometry.type === 'Point' ? feature.geometry.coordinates[1] : 0;
    //         const lon = feature.geometry.type === 'Point' ? feature.geometry.coordinates[0] : 0;
    //         return (
    //           <Marker
    //             key={feature.properties.id}
    //             position={[lat, lon]}
    //             icon={CustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png')}
    //             eventHandlers={{
    //               click: () => selectEvent(feature),
    //             }}
    //           >
    //             <Popup>
    //               <div dangerouslySetInnerHTML={{ __html: createOpenTopoPopupContent(feature) }} />
    //             </Popup>
    //           </Marker>
    //         );
    //       })}
    //     </LayerGroup>
    //   </MapContainer>
    //   <div className="w-1/4 bg-gray-100 overflow-auto">
    //     <div className={styles.sidebarHeader}>
    //       <h2>Events</h2>
    //       <button onClick={() => reset()}>Clear Filters</button>
    //     </div>
    //     <div className={styles.sidebarContent}>
    //       <div className={styles.eventResults}>
    //         {events?.map((event) => (
    //           <div key={event.title} className={styles.eventListing} onClick={() => selectEvent(event)}>
    //             <div className={styles.eventTitle}>{event.title}</div>
    //             <div className={styles.eventDate}>{new Date(event.event_date).toLocaleDateString()}</div>
    //             <div className={styles.eventType}>{event.event_type}</div>
    //           </div>
    //         ))}
    //         {openTopoData?.centroids.features.map((feature) => (
    //           <div key={feature.properties.id} className={styles.eventListing} onClick={() => selectEvent(feature)}>
    //             <div className={styles.eventTitle}>{feature.properties.name}</div>
    //             <div className={styles.eventDate}>{new Date(feature.properties.dateCreated).toLocaleDateString()}</div>
    //             <div className={styles.eventType}>OpenTopo</div>
    //           </div>
    //         ))}
    //       </div>
    //     </div>
    //   </div>
    // </div>
    <div style={{ display: 'flex', height: '80vh', width: '100%' }}>
    <div style={{ width: '25%', backgroundColor: '#bfdbfe', overflow: 'auto' }}>
    <div className="sidebar-content">
      {events?.map((event) => (
        <div
          key={event.id || event.title} // Ensure key is unique
          className={`event-listing ${event.event_type}`}
          onClick={() => selectEvent(event)}
        >
          <div className="event-title">{event.title}</div>
          <div className="row">
            <span className="left event-date">{new Date(event.event_date).toLocaleDateString()}</span>
            <span className={`right event-type ${event.event_type}`}>
              {event.event_type}
            </span>
          </div>
        </div>
      ))}
    </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          
          borderRight: '2px solid #d3d3d3'
        }}>
          {events?.map((event) => (
            <div key={event.title} onClick={() => selectEvent(event)} style={{
              cursor: 'pointer',
              padding: '10px',
              marginBottom: '5px',
              borderLeft: `5px solid ${event.event_type === 'earthquake' ? '#e46e28' : 
                event.event_type === 'flood' ? '#4285F4' : 
                event.event_type === 'tsunami' ? '#a765fe' : 
                event.event_type === 'landslide' ? '#62a241' : 
                event.event_type === 'hurricane' ? '#d34141' : '#9100ff'}`,
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                fontSize: '1.25em',
                fontWeight: 'bold',
                color: '#5e5e5e'
              }}>{event.title}</div>
              <div style={{
                background: '#777',
                borderRadius: '1px',
                padding: '2px',
                color: '#fff',
                fontSize: '0.8em',
                fontWeight: 'bold',
                marginTop: '5px'
              }}>{new Date(event.event_date).toLocaleDateString()}</div>
              <div style={{
                background: '#777',
                borderRadius: '1px',
                padding: '2px',
                color: '#fff',
                fontSize: '0.8em',
                fontWeight: 'bold',
                marginTop: '5px'
              }}>{event.event_type}</div>
            </div>
          ))}
          {openTopoData?.centroids.features.map((feature) => (
            <div key={feature.properties.id} onClick={() => selectEvent(feature)} style={{
              cursor: 'pointer',
              padding: '10px',
              marginBottom: '5px',
              borderLeft: '5px solid #a8bb2f',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                fontSize: '1.25em',
                fontWeight: 'bold',
                color: '#5e5e5e'
              }}>{feature.properties.name}</div>
              <div style={{
                background: '#777',
                borderRadius: '1px',
                padding: '2px',
                color: '#fff',
                fontSize: '0.8em',
                fontWeight: 'bold',
                marginTop: '5px'
              }}>{new Date(feature.properties.dateCreated).toLocaleDateString()}</div>
              <div style={{
                background: '#777',
                borderRadius: '1px',
                padding: '2px',
                color: '#fff',
                fontSize: '0.8em',
                fontWeight: 'bold',
                marginTop: '5px'
              }}>OpenTopo</div>
            </div>
          ))}
        </div>
      </div>
    <div style={{ width: '75%', overflow: 'auto' }}>
    <MapContainer center={DefaultCenter} zoom={DefaultZoom} scrollWheelZoom={true} style={{ height: '100vh'}}>
    <MapComponent />
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <TileLayer
          attribution='&copy;'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <LayerGroup>
          {events?.map((event) => (
            <Marker
              key={event.title}
              position={[event.location.lat, event.location.lon]}
              icon={CustomIcon(getEventTypeIconUrl(event.event_type))}
              eventHandlers={{
                click: () => selectEvent(event),
              }}
            >
              <Popup>
                <div dangerouslySetInnerHTML={{ __html: createReconPopupContent(event) }} />
              </Popup>
            </Marker>
          ))}
        </LayerGroup>
        <LayerGroup>
          {openTopoData?.centroids.features.map((feature) => {
            const lat = feature.geometry.type === 'Point' ? feature.geometry.coordinates[1] : 0;
            const lon = feature.geometry.type === 'Point' ? feature.geometry.coordinates[0] : 0;
            return (
              <Marker
                key={feature.properties.id}
                position={[lat, lon]}
                icon={CustomIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png')}
                eventHandlers={{
                  click: () => selectEvent(feature),
                }}
              >
                <Popup>
                  <div dangerouslySetInnerHTML={{ __html: createOpenTopoPopupContent(feature) }} />
                </Popup>
              </Marker>
            );
          })}
        </LayerGroup>
      </MapContainer>
    </div>
</div>
  );
};
