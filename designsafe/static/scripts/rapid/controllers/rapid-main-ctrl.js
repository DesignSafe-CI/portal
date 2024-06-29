import L from 'leaflet';
import _ from 'underscore';
import 'leaflet-draw';

export default class RapidMainCtrl {
    constructor (RapidDataService, $location, $scope) {
        'ngInject';
        this.RapidDataService = RapidDataService;
        this.show_sidebar = true;
        this.filter_options = {};
        this.active_rapid_event = null;
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
        this.RapidDataService.get_open_topography_center_view().then(center_view_data => {
            return this.RapidDataService.get_open_topography_datasets_view().then(datasets_view_data => {
                const openTopoData = this.RapidDataService.combine_open_topography_data(center_view_data, datasets_view_data);
                this.openTopoData = openTopoData;
                this.addMarkers(this.openTopoData, this.openTopoLayer);
                if (this.showOpenTopo) {
                    this.map.addLayer(this.openTopoLayer);
                }
            });
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

    addMarkers(events, layerGroup) {
        events.forEach((d) => {
            let marker = L.marker([d.location.lat, d.location.lon]);
            marker.bindTooltip(d.title);
            layerGroup.addLayer(marker);
            marker.rapid_event = d;
            marker.on('click', (ev) => {
                this.select_event(marker.rapid_event);
                this.$scope.$apply();
            });
        });
    }

    gotoEvent() {
        let q = this.$location.search();
        if (q.event) {
            let ev = _.find(this.events.concat(this.openTopoData), { title: q.event });
            this.select_event(ev);
        }
    }

    resetMapView() {
        this.map.setView([30.2672, -97.7431], 2);
    }

    reset() {
        this.resetMapView();
        this.active_rapid_event = null;
    }

    select_event (ev) {
        this.show_sidebar = true;
        if (ev === this.active_rapid_event) {
            this.reset();
        } else {
            this.map.setView([ev.location.lat, ev.location.lon],8, { animate: true });
            this.active_rapid_event = ev;
            this.$location.search('event', ev.title);
        }
    }

    search() {
        this.filtered_events = this.RapidDataService.search(this.events.concat(this.openTopoData), this.filter_options);
    }

    clear_filters() {
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
