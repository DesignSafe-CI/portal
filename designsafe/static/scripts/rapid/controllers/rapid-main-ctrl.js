import L from 'leaflet';
import _ from 'underscore';

export default class RapidMainCtrl {
    constructor (RapidDataService, $location, $scope) {
        'ngInject';
        this.RapidDataService = RapidDataService;
        this.show_sidebar = true;
        this.filter_options = {};
        this.active_rapid_event = null;
        this.active_polygon = null;
        this.$location = $location;
        this.$scope = $scope;
        this.reconLayer = L.layerGroup(); // Layer for Recon Portal Events
        this.openTopoLayer = L.layerGroup(); // Layer for OpenTopography data
        this.showOpenTopo = true;
    }

    $onInit () {
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
            this.openTopoData = opentopo_data;
            this.addMarkers(this.openTopoData, this.openTopoLayer, true);
            if (this.showOpenTopo) {
                this.map.addLayer(this.openTopoLayer);
            }
        }).catch((err) => {
            console.error('Error loading OpenTopography data:', err);
        });
    }

    initMap () {
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
            minZoom: 2, // 2 typically prevents zooming out to far to see multiple earths
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
            let lat = d.location ? d.location.lat : d.geometry.coordinates[1];
            let lon = d.location ? d.location.lon : d.geometry.coordinates[0];
            let title = d.title ? d.title : d.properties.name;
            let marker = L.marker([lat, lon]);
            // Define the event type color styles
            let eventTypeColors = {
                earthquake: '#e46e28',
                flood: '#4285F4',
                tsunami: '#a765fe',
                landslide: '#62a241',
                hurricane: '#d34141',
                tornado: '#9100ff',
                openTopoData: '#a8bb2f'
            };

            // Get the event type color
            let eventTypeColor = eventTypeColors[d.event_type] || '#000';

            // Create the content for the popup
            let popupContent = isOpenTopo 
                ? `<b>${d.properties.name}</b><br>
                   <b>Dataset Name:</b> ${d.properties.name}<br>
                   <b>Products available:</b> ${d.properties.productAvailable}<br>
                   <b>Survey date:</b> ${d.properties.temporalCoverage}<br>
                   <b>DOI:</b> <a href="${d.properties.doiUrl}" target="_blank">${d.properties.doiUrl}</a>`
                : `<b>${title}</b><br>
                   <b>Event Type:</b> <span style="background-color:${eventTypeColor}; color:#fff; padding:2px 5px; border-radius:3px;">${d.event_type}</span><br>
                   <b>Event Date:</b> ${d.event_date}<br>`;

            marker.bindPopup(popupContent);
            layerGroup.addLayer(marker);
            marker.data_event = d;

            // Open popup on hover
            marker.on('mouseover', (ev) => {
                marker.openPopup();
            });

            // Close popup with a slight delay to allow interaction
            marker.on('mouseout', (ev) => {
                setTimeout(() => {
                    if (!marker.getPopup()._container.contains(document.querySelector(':hover'))) {
                        marker.closePopup();
                    }
                }, 600); 
            });

            marker.on('click', (ev) => {
                this.select_event(marker.data_event);
                this.$scope.$apply();
            });
        });
    }

    gotoEvent () {
        let q = this.$location.search();
        if (q.event) {
            let ev = _.find(this.events.concat(this.openTopoData), { title: q.event });
            this.select_event(ev);
        }
    }

    resetMapView () {
        this.map.setView([30.2672, -97.7431], 2);
    }

    reset () {
        this.resetMapView();
        this.active_rapid_event = null;
        if (this.active_polygon) {
            this.map.removeLayer(this.active_polygon);
            this.active_polygon = null;
        }
    }

    select_event (ev) {
        this.show_sidebar = true;
        let lat = ev.location ? ev.location.lat : ev.geometry.coordinates[1];
        let lon = ev.location ? ev.location.lon : ev.geometry.coordinates[0];
        if (ev === this.active_rapid_event) {
            this.reset();
        } else {
            this.map.setView([lat, lon], 8, { animate: true });
            this.active_rapid_event = ev;
            this.$location.search('event', ev.title || ev.properties.name);

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

    addPolygonToMap (geometry, properties) {
        let coordinates = geometry.coordinates;
        let polygonLayer;

        let popupContent = `<b>${properties.name}</b><br>
                            <b>Dataset Name:</b> ${properties.name}<br>
                            <b>Products available:</b> ${properties.productAvailable}<br>
                            <b>Survey date:</b> ${properties.temporalCoverage}<br>
                            <b>DOI:</b> <a href="${properties.doiUrl}" target="_blank">${properties.doiUrl}</a>`;

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

    search () {
        this.filtered_events = this.RapidDataService.search(this.events.concat(this.openTopoData), this.filter_options);
    }

    clear_filters () {
        this.filter_options = {};
        this.search();
    }

    toggleOpenTopoLayer() {
        if (this.showOpenTopo) {
            this.map.addLayer(this.openTopoLayer);
        } else {
            this.map.removeLayer(this.openTopoLayer);
        }
    }
}
