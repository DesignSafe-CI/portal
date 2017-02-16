export default class MapSidebarCtrl {

  constructor ($scope, $window, $timeout) {
    'ngInject';
    this.$scope = $scope;
    this.LGeo = $window.LGeo;
    this.$timeout = $timeout;
    angular.element('header').hide();
    angular.element('nav').hide();
    angular.element('footer').hide();

    // L.control.layers({
    //     "Street": map.tileLayer,
    //     "Satellite": L.mapbox.tileLayer("my satellite imagery map id")
    // }, null).addTo(this.map);
    //method binding for callback, sigh...
    this.local_file_selected = this.local_file_selected.bind(this);

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

    this.map = L.map('geo_map', {layers: [streets, satellite]}).setView([51.505, -0.09], 6);

    L.control.layers(basemaps).addTo(this.map);
    // L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    //     maxZoom: 20,
    //     subdomains:['mt0','mt1','mt2','mt3']
    // });

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
      if (this.current_layer == e.layer) {
        this.current_layer = null;
      } else {
        this.current_layer = e.layer;
      };
      this.$scope.$apply();
    });

    this.map.addControl(drawControl);

    this.map.on('draw:created',  (e) => {
      let object = e.layer;
      object.options.color = '#ff0000';
      object.options.fillColor = '#ff0000';
      object.options.fillOpacity = 0.8;
      this.drawnItems.addLayer(object);
      this.current_layer = object;
      this.$scope.$apply();
    });


  } // end constructor

  open_file_dialog () {
    this.$timeout(()=> {
      angular.element('#local_file').trigger('click');
    });
  }

  open_image_dialog () {
    this.$timeout(()=> {
      angular.element('#local_image').trigger('click');
    });
  }

  local_file_selected (ev) {
    let file = ev.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (e) => {
      let json = JSON.parse(e.target.result);
      L.geoJSON(json).getLayers().forEach( (l) => {;
        this.drawnItems.addLayer(l);
      });
      this.map.fitBounds(this.drawnItems.getBounds());
    };
  }

  load_image (ev) {
    var files = ev.target.files;
    for (let i = 0; i < files.length; i++) {
      let file = files[0];
      let reader = new FileReader; // use HTML5 file reader to get the file

      reader.readAsArrayBuffer(file);
      reader.onloadend = (e) => {
          // get EXIF data
          let exif = EXIF.readFromBinaryFile(e.target.result);

          let lat = exif.GPSLatitude;
          let lon = exif.GPSLongitude;
          console.log(exif)

          //Convert coordinates to WGS84 decimal
          let latRef = exif.GPSLatitudeRef || "N";
          let lonRef = exif.GPSLongitudeRef || "W";
          lat = (lat[0] + lat[1]/60 + lat[2]/3600) * (latRef == "N" ? 1 : -1);
          lon = (lon[0] + lon[1]/60 + lon[2]/3600) * (lonRef == "W" ? -1 : 1);

         //Send the coordinates to your map
          Map.AddMarker(lat,lon);
      };
    }
  }

  update_layer_style (prop) {
    this.current_layer.setStyle({prop: this.current_layer.options[prop]});
  }


  save_project () {
    console.log(this.drawnItems);
    this.drawnItems.eachLayer(function (l) {
      console.log(l.options);
    });
    let blob = new Blob([JSON.stringify(this.drawnItems.toGeoJSON())], {type: "application/json"});
    let url  = URL.createObjectURL(blob);

    let a = document.createElement('a');
    a.download    = "backup.json";
    a.href        = url;
    a.textContent = "Download backup.json";
    a.click();
  }

}
