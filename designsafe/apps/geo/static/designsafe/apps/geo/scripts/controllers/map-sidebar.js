import LayerGroup from '../models/layer_group';
import MapProject from '../models/map-project';
import DBModalCtrl from './db-modal';
import * as GeoUtils from '../utils/geo-utils';

export default class MapSidebarCtrl {

  constructor ($scope, $window, $timeout, $interval, $q, $uibModal, toastr, DataService, $http, GeoDataService) {
    'ngInject';
    this.$scope = $scope;
    this.LGeo = $window.LGeo;
    this.$timeout = $timeout;
    this.$interval = $interval;
    this.$window = $window;
    this.$q = $q;
    this.$uibModal = $uibModal;
    this.DataService = DataService;
    this.$http = $http;
    this.GeoDataService = GeoDataService;
    this.toastr = toastr;

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
      maxZoom: 20,
    });

    let basemaps = {
      'Street': streets,
      'Satellite': satellite
    };
    this.map = L.map('geo_map', {
        layers: [streets, satellite],
        measureControl:true,
        preferCanvas: true
      }).setView([0, 0], 3);
    L.control.layers(basemaps).addTo(this.map);
    this.map.zoomControl.setPosition('bottomleft');

    // this.$scope.$watch(()=>{return this.current_layer;}, (newval, oldval)=>{console.log(newval);});

    if (this.GeoDataService.current_project()) {
      this.project = this.GeoDataService.current_project();
      this.project.layer_groups.forEach( (lg)=>{
        this.map.addLayer(lg.feature_group);
        this.map.removeLayer(lg.feature_group);
        this.map.addLayer(lg.feature_group);
      });
    } else {
      this.project = new MapProject('New Map');
      this.project.layer_groups = [new LayerGroup('New Group', new L.FeatureGroup())];
      this.map.addLayer(this.project.layer_groups[0].feature_group);
    }


    // trick to fix the tiles that sometimes don't load for some reason...
    $timeout( () => {this.map.invalidateSize();}, 10);

    this.active_layer_group = this.project.layer_groups[0];

    // Auto keep track of current project in the GeoDataService
    // so that if they switch states they will not lose work...
    $interval( () => {
      this.GeoDataService.current_project(this.project);
    }, 1000);

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

  delete_feature (lg, f) {
    this.map.removeLayer(f);
    lg.feature_group.removeLayer(f);
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

  select_feature(lg, feature) {
    this.active_layer_group = lg;
    this.current_layer == feature ? this.current_layer = null : this.current_layer = feature;
  }

  open_db_modal () {
    let modal = this.$uibModal.open({
      templateUrl: "/static/designsafe/apps/geo/html/db-modal.html",
      controller: "DBModalCtrl as vm",
    });
    modal.result.then( (f) => {this.load_from_data_depot(f);});
  }

  open_settings_modal () {
    let modal = this.$uibModal.open({
      templateUrl: "/static/designsafe/apps/geo/html/settings-modal.html",
      controller: "SettingsModalCtrl as vm",
    });
    modal.result.then( (s) => {console.log(s);});
  }

  open_file_dialog () {
    this.$timeout(() => {
      $('#file_picker').click();
    }, 0);
  }

  create_new_project () {
    let modal = this.$uibModal.open({
      templateUrl: "/static/designsafe/apps/geo/html/confirm-new-modal.html",
      controller: "ConfirmClearModalCtrl as vm",
    });
    modal.result.then( (s) => {
      this.project.clear();
      let p = new MapProject('New Project');
      p.layer_groups = [new LayerGroup('New Group', new L.FeatureGroup())];
      this.project = p;
      this.active_layer_group = this.project.layer_groups[0];
      this.map.addLayer(this.active_layer_group.feature_group);
    });
  }

  zoom_to(feature) {
    if (feature instanceof L.Marker) {
       let latLngs = [ feature.getLatLng() ];
       let markerBounds = L.latLngBounds(latLngs);
       this.map.fitBounds(markerBounds, {maxZoom: 16});
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
    console.log("drag_feature_success", ev, data, lg);
  }

  _load_data_success (retval) {
    if (retval instanceof MapProject) {

      retval.layer_groups.forEach( (lg) => {
        this.project.layer_groups.push(lg);
        this.map.addLayer(lg.feature_group);
      });
      this.active_layer_group = this.project.layer_groups[0];
      this.map.fitBounds(this.project.get_bounds());
    } else {

      if (this.project.layer_groups.length == 0) {
        this.project.layer_groups = [new LayerGroup('New Group', new L.FeatureGroup())];
        this.active_layer_group = this.project.layer_groups[0];
        this.map.addLayer(this.project.layer_groups[0].feature_group);
      }
      //it will be an array of features...
      retval.forEach( (f) => {
        this.active_layer_group.feature_group.addLayer(f);
      });
      this.map.fitBounds(this.active_layer_group.feature_group.getBounds(), {maxZoom: 16});
    }
  }

  load_from_data_depot(f) {
    this.loading = true;
    this.GeoDataService.load_from_data_depot(f)
      .then(
      (retval) =>{
        this._load_data_success(retval);},
      (err)=> {
        this.toastr.error('Load failed!');
        this.loading = false;
      });
  }

  local_file_selected (ev) {
    this.loading = true;
    let reqs = [];
    for (let i=0; i<ev.target.files.length; i++) {
      // debugger
      let file = ev.target.files[i];
      let prom = this.GeoDataService.load_from_local_file(file).then( (retval) =>{return this._load_data_success(retval);});
      reqs.push(prom);
      // this.loading = false;
    };
    this.$q.all(reqs).then( ()=>{
      this.loading = false;
      //reset the picker
      $('#file_picker').val('');
    }).then( () => {
      this.toastr.success('Imported file');
    });
  }

  update_layer_style (prop) {
    let tmp = this.current_layer;
    // debugger;
    // this.current_layer.setStyle({prop: this.current_layer.options[prop]});
    console.log(prop, this.current_layer.options[prop])
    let styles = {};
    styles[prop] = this.current_layer.options[prop];
    this.current_layer.setStyle(styles);
    console.log(this.current_layer.options)
  }

  save_locally () {
    this.GeoDataService.save_locally(this.project);
  }

  save_to_depot () {
    this.loading = true;
    let modal = this.$uibModal.open({
      templateUrl: "/static/designsafe/apps/geo/html/db-modal.html",
      controller: "DBModalCtrl as vm",
    });
    modal.result.then( (f) => {
      console.log(f);
      this.GeoDataService.save_to_depot(this.project, f).then( (resp) => {
        this.loading = false;
        this.toastr.success('Saved to data depot');
      }, (err) => {
        this.toastr.error('Save failed!');
        this.loading = false;
      });
    });


  }

}
