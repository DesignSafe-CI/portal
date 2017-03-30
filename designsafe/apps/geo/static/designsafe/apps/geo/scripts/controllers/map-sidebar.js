import LayerGroup from '../models/layer_group';
import MapProject from '../models/map-project';
import DBModalCtrl from './db-modal';
import * as GeoUtils from '../utils/geo-utils';

export default class MapSidebarCtrl {

  constructor ($scope, $window, $timeout, $uibModal, DataService, $http, GeoDataService) {
    'ngInject';
    this.$scope = $scope;
    this.LGeo = $window.LGeo;
    this.$timeout = $timeout;
    this.$window = $window;
    this.$uibModal = $uibModal;
    this.DataService = DataService;
    this.$http = $http;
    this.GeoDataService = GeoDataService;

    this.primary_color = '#ff0000';
    this.secondary_color = '#ff0000';

    //method binding for callback, sigh...
    this.local_file_selected = this.local_file_selected.bind(this);
    this.open_db_modal = this.open_db_modal.bind(this);

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

    this.project = new MapProject('New Map');
    console.log(this.project)
    this.map = L.map('geo_map', {layers: [streets, satellite], measureControl:true}).setView([0, 0], 3);
    L.control.layers(basemaps).addTo(this.map);
    this.map.zoomControl.setPosition('bottomleft');

    // trick to fix the tiles that sometimes don't load for some reason...
    $timeout( () => {this.map.invalidateSize();}, 10);

    this.project.layer_groups = [new LayerGroup('New Group', new L.FeatureGroup())];
    this.map.addLayer(this.project.layer_groups[0].feature_group);
    this.active_layer_group = this.project.layer_groups[0];

    // update the current layer to show the details tab
    this.active_layer_group.feature_group.on('click', (e) => {
      // this.current_layer ? this.current_layer = null : this.current_layer = e.layer;
      // this.$scope.$apply();
    });

    this.add_draw_controls(this.active_layer_group.feature_group);

    this.map.on('draw:created',  (e) => {
      let object = e.layer;
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
    this.project.layer_groups.push(lg);
    this.active_layer_group = this.project.layer_groups[this.project.layer_groups.length -1];
    this.map.addLayer(lg.feature_group);
    this.select_active_layer_group(this.active_layer_group);
  }

  delete_layer_group (lg, i) {
    this.map.removeLayer(lg.feature_group);
    this.project.layer_groups.splice(i, 1);
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

  open_db_modal () {
    let modal = this.$uibModal.open({
      templateUrl: "/static/designsafe/apps/geo/html/db-modal.html",
      controller: "DBModalCtrl as vm",
    });
    modal.result.then( (f) => {this.load_from_data_depot(f);});
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
    let src_lg = this.project.layer_groups[data.pidx];
    let feature = src_lg.feature_group.getLayers()[data.idx];
    src_lg.feature_group.removeLayer(feature);
    lg.feature_group.addLayer(feature);
  }

  drop_feature_success (ev, data, lg) {
    console.log("drag_feature_success", ev, data, lg)
    // lg.feature_group.getLayers().splicer(idx, 1);
  }

  load_from_data_depot(f) {
    this.loading = true;
    this.GeoDataService.load_from_data_depot(f).then( (features) => {
      features.forEach( (f) => {
        this.active_layer_group.feature_group.addLayer(f);
      });
      this.map.fitBounds(this.active_layer_group.feature_group.getBounds());
      this.loading = false;
    });
  }

  local_file_selected (ev) {
    let file = ev.target.files[0];
    let lf = this.GeoDataService.load_from_local_file(file).then( (features) => {
      features.forEach( (f) => {
        this.active_layer_group.feature_group.addLayer(f);
      });

      this.map.fitBounds(this.active_layer_group.feature_group.getBounds());
    });

  }


  update_layer_style (prop) {
    this.current_layer.setStyle({prop: this.current_layer.options[prop]});
  }


  save_locally () {
    this.GeoDataService.save_locally(this.project);
  }

  save_to_depot () {
    this.loading = true;
    this.GeoDataService.save_to_depot(this.project).then( (resp) => {
      console.log(resp);
      this.loading = false;
    });

  }

}
