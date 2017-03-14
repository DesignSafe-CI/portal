import LayerGroup from '../models/layer_group.js';

export default class MapSidebarCtrl {

  constructor ($scope, $window, $timeout) {
    'ngInject';
    this.$scope = $scope;
    this.LGeo = $window.LGeo;
    this.$timeout = $timeout;
    angular.element('header').hide();
    angular.element('nav').hide();
    angular.element('footer').hide();
    this.primary_color = '#ff0000';
    this.secondary_color = '#ff0000';

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
    this.map_title = 'New Map';
    L.control.layers(basemaps).addTo(this.map);
    this.map.zoomControl.setPosition('bottomleft');

    // this.drawnItems = new L.FeatureGroup();
    // this.map.addLayer(this.drawnItems);

    this.layer_groups = [new LayerGroup('New Group', new L.FeatureGroup())];
    this.map.addLayer(this.layer_groups[0].feature_group);
    this.active_layer_group = this.layer_groups[0];

    // update the current layer to show the details tab
    this.active_layer_group.feature_group.on('click', (e) => {
      this.current_layer ? this.current_layer = null : this.current_layer = e.layer;
      this.$scope.$apply();
    });

    this.add_draw_controls(this.active_layer_group.feature_group);

    this.map.on('draw:created',  (e) => {
      let object = e.layer;
      object.options.color = this.secondary_color;
      object.options.fillColor = this.primary_color;
      object.options.fillOpacity = 0.8;
      this.active_layer_group.feature_group.addLayer(object);
      // this.current_layer = object;
      this.$scope.$apply();
      console.log(this.active_layer_group)
    });

    this.map.on('mousemove', (e) => {
      this.current_mouse_coordinates = e.latlng;
      this.$scope.$apply();
    });


  } // end constructor

  add_draw_controls (fg) {
    let dc = new L.Control.Draw({
      position: 'topright',
      draw: {
        circle: false,
      },
      edit: {
       featureGroup: fg,
       remove: true
      }
    });
    this.map.addControl(dc);
    this.drawControl = dc;
  }


  create_layer () {
    let lg = new LayerGroup("New Group", new L.FeatureGroup());
    this.layer_groups.push(lg);
    this.active_layer_group = this.layer_groups[this.layer_groups.length -1];
    this.map.addLayer(lg.feature_group);
    this.select_active_layer_group(this.active_layer_group);
  }

  show_hide_layer_group (lg) {
    lg.show ? this.map.addLayer(lg.feature_group) : this.map.removeLayer(lg.feature_group);
  }

  select_active_layer_group(lg) {
    this.map.removeControl(this.drawControl);
    this.add_draw_controls(lg.feature_group);
    this.active_layer_group = lg;
    lg.active = true;
    lg.show = true;
    debugger;
  }

  open_file_dialog () {

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
