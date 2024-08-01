import L from 'leaflet';
import _ from 'underscore';

export default class RapidMainCtrl {
    constructor(RapidDataService, $location, $scope) {
        'ngInject';
        this.RapidDataService = RapidDataService;
        this.show_sidebar = true;
        this.filter_options = {};
        this.opentopo_filter_options = {};
        this.active_rapid_event = null;
        this.active_polygon = null;
        this.$location = $location;
        this.$scope = $scope;
        this.reconLayer = L.layerGroup(); // Layer for Recon Portal Events
        this.openTopoLayer = L.layerGroup(); // Layer for OpenTopography data
    }

    $onInit() {
        this.initMap();
        this.RapidDataService.get_event_types().then((resp) => {
            this.event_types = resp;
        });
        this.loadReconEvents();
        this.loadOpenTopographyData();
    }

    loadReconEvents() {
        this.RapidDataService.get_events().then((events) => {
            this.events = events;
            this.addMarkers(this.events, this.reconLayer);
            this.map.addLayer(this.reconLayer);
            this.gotoEvent();
        }).catch((err) => {
            console.error('Error loading Recon Portal events:', err);
        });
    }

    loadOpenTopographyData() {
        this.RapidDataService.get_opentopo_data().then((opentopo_data) => {
            this.openTopoData = opentopo_data.features;
            this.addMarkers(this.openTopoData, this.openTopoLayer, true);
            // uncomment the below line to have opentopo data seen by default
            //this.map.addLayer(this.openTopoLayer);
        }).catch((err) => {
            console.error('Error loading OpenTopography data:', err);
        });
    }

    initMap() {
        let streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        });

        let satellite = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '&copy;',
                maxZoom: 18,
            }
        );
        this.map = L.map('map', {
            layers: [streets, satellite],
            scrollWheelZoom: true,
            minZoom: 2, // 2 typically prevents zooming out too far to see multiple earths
            maxBounds: [
                [-90, -180], // Southwest coordinates
                [90, 180], // Northeast coordinates
            ]
        });
        this.map.setView([30.2672, -97.7431], 2);
        this.map.zoomControl.setPosition('topright');

        // Adding layer control
        L.control.layers(null, {
            'Recon Portal Events': this.reconLayer,
            'OpenTopography Data': this.openTopoLayer
        }).addTo(this.map);
    }

    addMarkers(data, layerGroup, isOpenTopo = false) {
        data.forEach((d) => {
            let lat = isOpenTopo ? d.geometry.coordinates[1] : d.location.lat;
            let lon = isOpenTopo ? d.geometry.coordinates[0] : d.location.lon;
            let title = isOpenTopo ? d.properties.name : d.title;


            let customIcon =  isOpenTopo ? new L.Icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [16.75, 27.47],
                                iconAnchor: [8.04, 27.47],
                                popupAnchor: [0.67, -22.78],
                                shadowSize: [27.47, 27.47]
                            })
                : new L.Icon({
                iconUrl: this.getEventTypeIconUrl(d.event_type),
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            let marker = L.marker([lat, lon], {
                icon: customIcon,
                riseOnHover: true,
                riseOffset: 250
            });

            let popupContent = isOpenTopo ? 
                this.createOpenTopoPopupContent(d) : 
                this.createReconPopupContent(d);

            marker.bindPopup(popupContent);
            layerGroup.addLayer(marker);
            marker.data_event = d;

            marker.on('mouseover', () => marker.openPopup());
            marker.on('mouseout', () => this.closePopupIfNotHovered(marker));
            marker.on('click', () => {
                this.select_event(marker.data_event);
                this.$scope.$apply();
            });
        });
    }

    createOpenTopoPopupContent(d) {
        return `<b>${d.properties.name}</b><br>
                <b>ID:</b> ${d.properties.id}<br>
                <b>Products available:</b> ${d.properties.productAvailable}<br>
                <b>Data Source:</b><span class="event-type opentopo"> OpenTopography </span><br>
                <b>Date Created:</b> ${d.properties.dateCreated}<br>
                <b>Survey date:</b> ${d.properties.temporalCoverage}<br>
                <b>DOI:</b> <a href="${d.properties.doiUrl}" target="_blank"> ${d.properties.doiUrl}</a>`;
    }

    createReconPopupContent(d) {
        let eventTypeClass = d.event_type ? `event-type ${d.event_type}` : '';
        let formattedDate = new Date(d.event_date).toLocaleDateString('en-CA');  // Formats date as yyyy-MM-dd
        return `<b>${d.title}</b><br>
                <b>Event Type:</b> <span class="event-type ${eventTypeClass}"> ${d.event_type} </span><br>
                <b>Data Source:</b><span class="event-type designsafe"> DesignSafe </span><br>
                <b>Event Date:</b> ${formattedDate} <br>
                <b>Location Description:</b> ${d.location_description}<br>`;
    }

    getEventTypeIconUrl(eventType) {
        const eventTypeColorsGit = {
            earthquake: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
            flood: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
            tsunami: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
            landslide: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
            hurricane: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            tornado: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png'
        };
        return eventTypeColorsGit[eventType] || 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';
    }

    closePopupIfNotHovered(marker) {
        setTimeout(() => {
            if (!marker.getPopup()._container.contains(document.querySelector(':hover'))) {
                marker.closePopup();
            }
        }, 600);
    }

    

    gotoEvent() {
        let q = this.$location.search();
        if (q.event) {
            let ev = _.find(this.events, { title: q.event });
            this.select_event(ev);
        }
    }  

    resetMapView() {
        this.map.setView([30.2672, -97.7431], 2);
    }

    reset() {
        this.resetMapView();
        this.active_rapid_event = null;
        if (this.active_polygon) {
            this.map.removeLayer(this.active_polygon);
            this.active_polygon = null;
        }
    }

    select_event(ev) {
        this.show_sidebar = true;
        let lat = ev.location ? ev.location.lat : ev.geometry.coordinates[1];
        let lon = ev.location ? ev.location.lon : ev.geometry.coordinates[0];
        if (ev === this.active_rapid_event) {
            this.reset();
            this.$location.search('event', null); 
        } else {
            this.map.setView([lat, lon], 8, { animate: true });
            this.active_rapid_event = ev;
            if (!ev.properties || ev.properties.host !== 'OpenTopo') {
                this.$location.search('event', ev.title);
            }

            if (ev.properties && ev.properties.host === 'OpenTopo') {
                this.RapidDataService.get_opentopo_coordinates(ev.properties.doiUrl).then((data) => {
                    if (this.active_polygon) {
                        this.map.removeLayer(this.active_polygon);
                    }
                    this.active_polygon = this.addPolygonToMap(data.geometry, ev.properties);
                }).catch((err) => {
                    console.error('Error loading OpenTopography coordinates:', err);
                });
            }
        }
    }

    addPolygonToMap(geometry, properties) {
        let coordinates = geometry.coordinates;
        let polygonLayer;

        let popupContent = `<b>${properties.name}</b><br>
                            <b>ID:</b> ${properties.id}<br>
                            <b>Products available:</b> ${properties.productAvailable}<br>
                            <b>Data Source:</b><span class="event-type opentopo"> OpenTopography </span><br>
                            <b>Date Created:</b> ${properties.dateCreated}<br>
                            <b>Survey date:</b> ${properties.temporalCoverage}<br>
                            <b>DOI:</b> <a href="${properties.doiUrl}" target="_blank"> ${properties.doiUrl}</a>`;

        if (geometry.type === 'MultiPolygon') {
            polygonLayer = L.layerGroup();
            coordinates.forEach(singlePolygon => {
                let latlngs = singlePolygon[0].map(coord => [coord[1], coord[0]]);
                let polygon = L.polygon(latlngs, { color: '#a8bb2f' });
                polygon.bindPopup(popupContent);
                polygon.addTo(polygonLayer);
            });
            polygonLayer.addTo(this.map);
        } else if (geometry.type === 'Polygon') {
            let latlngs = coordinates[0].map(coord => [coord[1], coord[0]]);
            polygonLayer = L.polygon(latlngs, { color: '#a8bb2f' });
            polygonLayer.bindPopup(popupContent);
            polygonLayer.addTo(this.map);
        }

        return polygonLayer;
    }

    search() {
        if (!this.events || !this.openTopoData) return;
        this.filtered_events = this.RapidDataService.search(this.events, this.filter_options);
        this.filtered_openTopoData = this.RapidDataService.searchOT(this.openTopoData, this.opentopo_filter_options, this.filter_options);
    }

    clear_filters() {
        this.filter_options = {};
        this.opentopo_filter_options = {};
        this.search();
    }
}
