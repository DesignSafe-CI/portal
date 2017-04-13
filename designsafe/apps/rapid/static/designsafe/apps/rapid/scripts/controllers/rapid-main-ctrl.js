export default class RapidMainCtrl {
  constructor ($scope, $compile, RapidDataService) {
    'ngInject';
    this.$scope = $scope;
    this.$compile = $compile;
    this.RapidDataService = RapidDataService;
    this.show_sidebar = true;
    this.filter_options = {};
    this.active_rapid_event = null;

    let streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });

    let satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy;',
      maxZoom: 18,
    });

    let basemaps = {
      'Street': streets,
      'Satellite': satellite
    };
    this.map = L.map('map', {layers: [streets, satellite]}).setView([0, 0], 2);
    this.map.zoomControl.setPosition('topright');

    this.event_types = this.RapidDataService.get_event_types();

    this.RapidDataService.get_events().then( (resp)=>{
      this.events = resp;
      this.events.forEach((d)=> {
        let template = "<div class=''>" +
          "<h3> {{event.title}} </h3>" +
          "<div ng-repeat='dataset in event.datasets'>" +
          "<a href='{{dataset.href}}'> {{dataset.doi}} </a>"+
          "</div>";
        let linker = this.$compile(angular.element(template));
        let marker = L.marker([d.location.lat, d.location.lon]);
        let newScope = this.$scope.$new();
        newScope.event = d;
        // marker.bindPopup(linker(newScope)[0], {className : 'rapid-popup'});
        this.map.addLayer(marker);
        marker.rapid_event = d;
        marker.on('click', (ev) => {
          if (marker.rapid_event == this.active_rapid_event) {
            this.active_rapid_event = null;
          } else {
            this.active_rapid_event = marker.rapid_event;
            this.show_sidebar = true;
          }
          this.$scope.$apply();
        });
      });
    });
  }

  select_event (ev) {
    this.map.setView([ev.location.lat, ev.location.lon],8, {animate: true});
    this.active_rapid_event = ev;
  }

  search () {
    this.filtered_events = this.RapidDataService.search(this.events, this.filter_options);
  }

  clear_filters () {
    this.filter_options = {};
    this.search();
  }
}
