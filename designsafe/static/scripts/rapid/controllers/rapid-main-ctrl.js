import L from 'leaflet';
import _ from 'underscore';

export default class RapidMainCtrl {
    constructor (RapidDataService, $location, $scope) {
        'ngInject';
        this.RapidDataService = RapidDataService;
        this.show_sidebar = true;
        this.filter_options = {};
        this.active_rapid_event = null;
        this.$location = $location;
        this.$scope = $scope;
    }

    $onInit () {
        this.initMap();
        this.RapidDataService.get_event_types().then( (resp)=> {
            this.event_types = resp;
        });
        // this.RapidDataService.get_events().then( (resp)=>{
        //     this.events = resp;
        //     this.events.forEach((d)=> {
        //         let marker = L.marker([d.location.lat, d.location.lon]);
        //         marker.bindTooltip(d.title);
        //         this.map.addLayer(marker);
        //         marker.rapid_event = d;
        //         marker.on('click', (ev) => {
        //             this.select_event(marker.rapid_event);
        //             this.$scope.$apply();
        //         });
        //     });
        //     this.gotoEvent();
        // });
        this.loadEventsAndOpenTopographyData();

        //this.loadOpenTopographyData();
    }

    loadEventsAndOpenTopographyData() {
        Promise.all([
            this.RapidDataService.get_events(),
            this.RapidDataService.get_open_topography_center_view().then(center_view_data => {
                return this.RapidDataService.get_open_topography_datasets_view().then(datasets_view_data => {
                    return this.RapidDataService.combine_open_topography_data(center_view_data, datasets_view_data);
                });
            })
        ]).then(([events, openTopoData]) => {
            this.events = events.concat(openTopoData);
            this.filtered_events = this.events;

            this.events.forEach((d) => {
                let marker = L.marker([d.location.lat, d.location.lon]);
                marker.bindTooltip(d.title);
                this.map.addLayer(marker);
                marker.rapid_event = d;
                marker.on('click', (ev) => {
                    this.select_event(marker.rapid_event);
                    this.$scope.$apply();
                });
            });

            this.gotoEvent();
        }).catch((err) => {
            console.error('Error loading events and OpenTopography data:', err);
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
    }

    // loadOpenTopographyData() {
    //     this.RapidDataService.get_open_topography_center_view().then(center_view_data => {
    //         this.RapidDataService.get_open_topography_datasets_view().then(datasets_view_data => {
    //             let combined_data = this.RapidDataService.combine_open_topography_data(center_view_data, datasets_view_data);
    //             this.displayOpenTopographyData(combined_data);
    //         });
    //     });
    // }

    // displayOpenTopographyData(data) {
    //     data.forEach((d) => {
    //         let marker = L.marker([d.geometry.coordinates[1], d.geometry.coordinates[0]]);
    //         marker.bindTooltip(d.properties.projectname);
    //         this.map.addLayer(marker);
    //         marker.on('click', (ev) => {
    //             this.select_event(d);
    //             this.$scope.$apply();
    //         });
    //     });
    // }

    gotoEvent () {
        let q = this.$location.search();
        if (q.event) {
            let ev = _.find(this.events, { title:q.event });
            this.select_event(ev);
        }
    }

    resetMapView () {
        this.map.setView([30.2672, -97.7431], 2);
    }

    reset () {
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

    search () {
        this.filtered_events = this.RapidDataService.search(this.events, this.filter_options);
    }

    clear_filters () {
        this.filter_options = {};
        this.search();
    }

}
