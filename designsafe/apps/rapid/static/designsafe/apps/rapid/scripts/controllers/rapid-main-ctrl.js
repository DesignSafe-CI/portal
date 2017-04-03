export default class RapidMainCtrl {
  constructor ($scope, RapidDataService) {
    'ngInject';
    this.RapidDataService = RapidDataService;
    this.show_sidebar = true;
    this.filter_options = {};

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
    console.log(this.event_types)

    this.RapidDataService.get_events().then( (resp)=>{
      this.events = resp;
      this.events.forEach((d)=> {
        let marker = L.marker([d.location.lat, d.location.lon]);
        this.map.addLayer(marker);
      });
    });
  }

  zoom_to (ev) {
    this.map.setView([ev.location.lat, ev.location.lon],8, {animate: true});
  }

  search () {
    console.log(this.filter_options)
    let tmp = _.filter(this.events, (item)=>{
      console.log(item)
      if (this.filter_options.event_type) {
        return item.event_type == this.filter_options.event_type.event_type;
      } else {
        return true;
      }
      // return item.title.substring(0, this.search_text.length) === this.search_text;
    });
    console.log(tmp);
    this.filtered_events = tmp;
  }

  clear_filters () {
    this.filter_options = {};
    this.search();
  }
}
