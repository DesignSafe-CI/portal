export default class MapSidebarCtrl {

  constructor ($scope) {
    'ngInject';
    angular.element('header').hide();
    angular.element('nav').hide();
    angular.element('footer').hide();
    this.map = L.map('geo_map').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);
    let drawControl = new L.Control.Draw({
     edit: {
       featureGroup: this.drawnItems,
       remove: true
     }
    });
    this.map.addControl(drawControl);
    this.map.on('draw:created',  (e) => {
      this.drawnItems.addLayer(e.layer);
    });
  }

  save_project () {
    console.log(this.drawnItems.toGeoJSON())
  }

}
