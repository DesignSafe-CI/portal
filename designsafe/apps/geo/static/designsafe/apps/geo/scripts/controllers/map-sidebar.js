import LayerGroup from '../models/layer_group';
import DBModal from './db-modal';
import * as GeoUtils from '../utils/geo-utils';

export default class MapSidebarCtrl {

  constructor ($scope, $window, $timeout, $uibModal) {
    'ngInject';
    this.$scope = $scope;
    this.LGeo = $window.LGeo;
    this.$timeout = $timeout;
    this.$window = $window;
    this.$uibModal = $uibModal;
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

    // trick to fix the tiles that sometimes don't load for some reason...
    $timeout( () => {this.map.invalidateSize();}, 10);

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
      console.log(object)
      object.options.color = this.secondary_color;
      object.options.fillColor = this.primary_color;
      object.options.fillOpacity = 0.8;
      this.active_layer_group.feature_group.addLayer(object);
      this.$scope.$apply();
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


  create_layer_group () {
    let lg = new LayerGroup("New Group", new L.FeatureGroup());
    this.layer_groups.push(lg);
    this.active_layer_group = this.layer_groups[this.layer_groups.length -1];
    this.map.addLayer(lg.feature_group);
    this.select_active_layer_group(this.active_layer_group);
  }

  delete_layer_group (lg, i) {
    this.map.removeLayer(lg.feature_group);
    this.layer_groups.splice(i, 1);
  }

  delete_feature (f) {
    this.map.removeLayer(f);
    this.active_layer_group.feature_group.removeLayer(f);
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
  }

  open_file_dialog () {
    this.$timeout(() => {
      $('#file_picker').click();
    }, 0);
  }

  get_feature_type (f) {
    if (f instanceof L.Marker) {
      return 'Point';
    } else if (f instanceof L.Polygon) {
      return 'Polygon';
    } else {
      return 'Path';
    }
  }

  zoom_to(feature) {
    if (feature instanceof L.Marker) {
       let latLngs = [ feature.getLatLng() ];
       let markerBounds = L.latLngBounds(latLngs);
       this.map.fitBounds(markerBounds);
    } else {
      this.map.fitBounds(feature.getBounds());
    };
  }

  on_drop (ev, data, lg) {
    console.log("on_drop", ev,  data, lg);
    let src_lg = this.layer_groups[data.pidx];

    let feature = src_lg.feature_group.getLayers()[data.idx];
    console.log(feature)
    lg.feature_group.addLayer(feature);
    this.map.addLayer(lg.feature_group);
    src_lg.feature_group.removeLayer(feature);
  }

  drop_feature_success (ev, data, lg) {
    console.log("drag_feature_success", ev, data, lg)
    // lg.feature_group.getLayers().splicer(idx, 1);
  }

  local_file_selected (ev) {
    let file = ev.target.files[0];
    console.log(GeoUtils);

    let ext = GeoUtils.get_file_extension(file.name);
    console.log(ext);
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (e) => {
      if (ext === 'kml') {
        let lg = new LayerGroup("New Group", new L.FeatureGroup());
        // let parser = new this.$window.DOMParser();
        // let parsed = parser.parseFromString(e.target.result, 'text/xml');
        let l = omnivore.kml.parse(e.target.result);
        // debugger
        l.getLayers().forEach((d) => {
          lg.feature_group.addLayer(d);
        });
        this.layer_groups.push(lg);
        this.map.addLayer(lg.feature_group);
      } else if (ext === 'gpx') {
        let lg = new LayerGroup("New Group", new L.FeatureGroup());
        // let parser = new this.$window.DOMParser();
        // let parsed = parser.parseFromString(e.target.result, 'text/xml');
        let l = omnivore.gpx.parse(e.target.result);
        lg.feature_group.addLayer(l);

        this.layer_groups.push(lg);
        this.map.addLayer(lg.feature_group);
      } else {
        let json = JSON.parse(e.target.result);

        // we add in a field into the json blob when saved. If it is such,
        // handle potential multiple layers.
        if (json.ds_map) {
          // each feature in the collection represents a layer
          json.features.forEach( (f) => {
            let lg = new LayerGroup("New Group", new L.FeatureGroup());
            L.geoJSON(f).getLayers().forEach( (l) => {
              lg.feature_group.addLayer(l);
            });
            this.layer_groups.push(lg);
            this.map.addLayer(lg.feature_group);
          });
        }
        else {
          let lg = new LayerGroup("New Group", new L.FeatureGroup());
          L.geoJSON(json).getLayers().forEach( (l) => {
            this.layer_groups[0].feature_group.addLayer(l);
          });
          this.layer_groups.push(lg);
          this.map.addLayer(lg.feature_group);
        }

      };
      let bounds = [];
      this.layer_groups.forEach((lg) =>  {
        bounds.push(lg.feature_group.getBounds());
      });
      this.map.fitBounds(bounds);
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

          //Convert coordinates to WGS84 decimal
          let latRef = exif.GPSLatitudeRef || "N";
          let lonRef = exif.GPSLongitudeRef || "W";
          lat = (lat[0] + lat[1]/60 + lat[2]/3600) * (latRef == "N" ? 1 : -1);
          lon = (lon[0] + lon[1]/60 + lon[2]/3600) * (lonRef == "W" ? -1 : 1);

         //Send the coordinates to your map
          this.active_layer_group.AddMarker(lat,lon);
      };
    }
  }

  update_layer_style (prop) {
    this.current_layer.setStyle({prop: this.current_layer.options[prop]});
  }


  save_project () {
    let out = {
      "type": "FeatureCollection",
      "features": [],
      "ds_map": true,
      "name": this.map_title
    };
    this.layer_groups.forEach( (lg) => {
      let json = lg.feature_group.toGeoJSON();
      //add in any options
      json.label = lg.label;

      out.features.push(json);
    });
    let blob = new Blob([JSON.stringify(out)], {type: "application/json"});
    let url  = URL.createObjectURL(blob);

    let a = document.createElement('a');
    a.download    = this.map_title + ".json";
    a.href        = url;
    a.textContent = "Download";
    a.click();
  }

}
