export default class MapSidebarCtrl {

  constructor ($scope, $window) {
    'ngInject';
    this.$scope = $scope;
    this.LGeo = $window.LGeo;
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
     position: 'topright',
     draw: {
      circle: false,
     },
     edit: {
       featureGroup: this.drawnItems,
       remove: true
     }
    });

    this.drawnItems.on('click', (e) => {
      this.current_layer = e.layer;
      this.$scope.$apply();
    });

    this.map.addControl(drawControl);
    this.map.on('draw:created',  (e) => {
      let object = e.layer;
      object.options.color = '#ff0000';
      object.options.fillOpacity = 0.8;
      this.drawnItems.addLayer(object);
      this.current_layer = object;
      this.$scope.$apply();
    });
  }
  update_color () {
    this.current_layer.setStyle({fillColor: this.current_layer.options.color});
  }
  save_project () {
    console.log(this.drawnItems);
    this.drawnItems.eachLayer(function (l) {
      console.log(l.options);
    })
    let blob = new Blob([JSON.stringify(this.drawnItems.toGeoJSON())], {type: "application/json"});
    let url  = URL.createObjectURL(blob);

    let a = document.createElement('a');
    a.download    = "backup.json";
    a.href        = url;
    a.textContent = "Download backup.json";
    a.click();
  }

}
