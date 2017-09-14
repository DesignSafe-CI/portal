import LayerGroup from '../models/layer_group';
import MapProject from '../models/map-project';
import DBModalCtrl from './db-modal';
import * as GeoUtils from '../utils/geo-utils';

export default class MapSidebarCtrl {

  constructor ($scope, $window, $timeout, $interval, $q, $uibModal, toastr, DataService, $http, GeoDataService, GeoSettingsService) {
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
    this.GeoSettingsService = GeoSettingsService;
    this.toastr = toastr;

    this.settings = this.GeoSettingsService.settings;

    //method binding for callback, sigh...
    this.local_file_selected = this.local_file_selected.bind(this);
    // this.open_db_modal = this.open_db_modal.bind(this);

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
        preferCanvas: false
      }).setView([0, 0], 3);
    this.mc = new L.Control.Measure({primaryLengthUnit:'meters', primaryAreaUnit: 'meters'});
    this.mc.addTo(this.map);
    L.control.layers(basemaps).addTo(this.map);
    this.map.zoomControl.setPosition('bottomleft');

    // Overload the default icon creator

    this.HazmapperDivIcon = L.divIcon({
      className: 'hm-marker',
      html: "<div> <i class='fa fa-map-marker'> </i> </div>"
    });

    // Load in a map project from the data service if one does exist, if not
    // create a new one from scratch
    if (this.GeoDataService.current_project()) {
      this.project = this.GeoDataService.current_project();

      this._init_map_layers();
      this.fit_map_to_project();

    } else {
      this.project = new MapProject('New Map');
      this.project.layer_groups = [new LayerGroup('New Group', new L.FeatureGroup())];
      this.map.addLayer(this.project.layer_groups[0].feature_group);
    }

    // this._add_click_handlers();

    // trick to fix the tiles that sometimes don't load for some reason...
    $timeout( () => {this.map.invalidateSize();}, 10);

    // init an active layer group
    this.active_layer_group = this.project.layer_groups[0];

    // Auto keep track of current project in the GeoDataService
    // so that if they switch states they will not lose work...
    $interval( () => {
      this.GeoDataService.current_project(this.project);
    }, 1000);

    this.add_draw_controls(this.active_layer_group.feature_group);

    // This handles making sure that the features that get created with the draw tool
    // are styled with the default colors etc.
    this.map.on('draw:created',  (e) => {
      let object = e.layer;
      object.options.color = this.settings.default_stroke_color;
      object.options.fillColor = this.settings.default_fill_color;
      object.options.fillOpacity = this.settings.default_fill_opacity;
      this.active_layer_group.feature_group.addLayer(object);
      if (object instanceof L.Marker) {
        object.getElement().style.color = this.settings.default_marker_color;
        object.options.fillColor = this.settings.default_marker_color;

      }

      this.$scope.$apply();
    });

    this.map.on('mousemove', (e) => {
      this.current_mouse_coordinates = e.latlng;
      this.$scope.$apply();
    });


  } // end constructor

  fit_map_to_project() {
    try {
      this.map.fitBounds(this.project.get_bounds(), {maxZoom: 16});
    } catch (e) {
      console.log('get_bounds fail', e);
    }
  }

  add_draw_controls (fg) {
    let dc = new L.Control.Draw({
      position: 'topright',
      draw: {
        circle: false,
        marker: {
          icon: this.HazmapperDivIcon
        }
      },
      edit: {
       featureGroup: fg,
       remove: true
      }
    });
    this.map.addControl(dc);
    this.drawControl = dc;
  }

  feature_click (layer) {
    console.log(layer);
  }

  _init_map_layers() {
    // For some reason, need to readd the feature groups for markers to be displayed correctly???
    this.project.layer_groups.forEach( (lg)=>{
      // lg.feature_group.getLayers().forEach( (layer)=>{
      //   this.map.addLayer(layer);
      // });
      // this.map.addLayer(lg.feature_group);
      this.map.removeLayer(lg.feature_group);
      this.map.addLayer(lg.feature_group);
      lg.feature_group.getLayers().forEach( (layer) => {
        if ( (layer instanceof L.Marker) && (!(layer.options.image_src)) ){
          layer.getElement().style.color = layer.options.fillColor;
        }
      });
    });
    this.active_layer_group = this.project.layer_groups[0];
  }

  // Adds click handlers to map elements. This does NOT feel
  // right to me...
  _add_click_handlers () {
    this.project.layer_groups.forEach( (lg) => {
      lg.feature_group.on('click', (ev)=> {
        this.project.layer_groups.forEach( (lg) => {
          lg.feature_group.getLayers().forEach( (layer)=>{
            layer.active = false;
            if (layer == ev.layer) {
              layer.active = true;
            }
          });
        });
      });
    });
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
    if (this.project.layer_groups.length === 0) {
      this.create_layer_group();
    }
    this.active_layer_group = this.project.layer_groups[0];
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

  create_new_project () {
    let modal = this.$uibModal.open({
      templateUrl: "/static/designsafe/apps/geo/html/confirm-new-modal.html",
      controller: "ConfirmClearModalCtrl as vm",
    });
    modal.result.then( (s) => {
      this.map.eachLayer(function (layer) {
        console.log(layer);
        // this.map.removeLayer(layer);
      });
      this.project.clear();
      let p = new MapProject('New Map');
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
       try {
         this.map.fitBounds(markerBounds, {maxZoom: 16});
        //  feature.getElement().style.border = '2px solid red';
       } catch (e) {
         console.log(e);
       }
    } else {
      try {
        this.map.fitBounds(feature.getBounds(), {maxZoom: 16});
      } catch (e) {
        console.log(e);
      }
    };
  }

  on_drop (ev, data, lg) {
    let src_lg = this.project.layer_groups[data.pidx];
    let feature = src_lg.feature_group.getLayers()[data.idx];
    src_lg.feature_group.removeLayer(feature);
    lg.feature_group.addLayer(feature);
  }

  update_layer_style (prop) {
    let tmp = this.current_layer;
    // debugger;
    // this.current_layer.setStyle({prop: this.current_layer.options[prop]});
    let styles = {};
    styles[prop] = this.current_layer.options[prop];
    if (tmp instanceof L.Marker) {
        tmp.getElement().style.color = this.current_layer.options.fillColor;
    } else {
      this.current_layer.setStyle(styles);
    }
  }

  drop_feature_success (ev, data, lg) {
    console.log("drag_feature_success", ev, data, lg);
  }

  _load_data_success (retval) {
    if (this.open_existing) {
      if (retval instanceof MapProject) {
        //clear off all the layers from the map
        this.project.layer_groups.forEach( (lg) => {
          this.map.removeLayer(lg.feature_group);
        });

        // set the project to be the return value
        this.project = retval;
        this._init_map_layers();
        this.fit_map_to_project();
      } else {
        this.toastr.error('Load failed! File was not compatible');
      }
      this.open_existing = false;
    } else if (retval instanceof MapProject) {
      retval.layer_groups.forEach( (lg) => {
        this.project.layer_groups.push(lg);
        this.map.addLayer(lg.feature_group);
      });
      this.active_layer_group = this.project.layer_groups[0];
      this.fit_map_to_project();
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
      this.fit_map_to_project();
    }
  }

  open_existing_locally () {
    this.open_existing = true;
    this.open_file_dialog();
  }

  open_existing_from_depot() {
    this.open_existing = true;
    this.open_db_modal();
  }

  open_db_modal () {
    let modal = this.$uibModal.open({
      templateUrl: "/static/designsafe/apps/geo/html/db-modal.html",
      controller: "DBModalCtrl as vm",
      resolve: {
        filename: ()=> {return null;}
      }
    });
    modal.result.then( (f, saveas) => {this.load_from_data_depot(f);});
  }

  open_settings_modal () {
    let modal = this.$uibModal.open({
      templateUrl: "/static/designsafe/apps/geo/html/settings-modal.html",
      controller: "SettingsModalCtrl as vm",
    });
    modal.result.then( (s) => {
      this.settings = this.GeoSettingsService.settings;

    });
  }

  open_image_overlay_modal () {
    let modal = this.$uibModal.open({
      templateUrl: "/static/designsafe/apps/geo/html/image-overlay-modal.html",
      controller: "ImageOverlayModalCtrl as vm",
    });
    modal.result.then( (res) => {
      let bounds;
      bounds = [
        [res.min_lat, res.min_lon],
        [res.max_lat, res.max_lon]
      ];
      if (res.file) {
        this.GeoDataService.read_file_as_data_url(res.file).then( (data) => {
          console.log(data);
        });
      }
      let overlay = L.imageOverlay(res.url, bounds).addTo(this.map);
      console.log(overlay);
    });
  }

  open_file_dialog () {
    this.$timeout(() => {
      $('#file_picker').click();
    }, 0);
  }

  load_from_data_depot(f) {
    this.loading = true;
    this.GeoDataService.load_from_data_depot(f.selected)
      .then(
      (retval) =>{
        this._load_data_success(retval);
        this.loading = false;
      },
      (err)=> {
        this.toastr.error('Load failed!');
        this.loading = false;
        this.open_existing = false;
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
      this.toastr.success('Imported file');
    }, (rej)=>{
      this.loading = false;
      this.toastr.error('Load failed!');
    }).then( () => {

    });
  }

  save_locally () {
    this.GeoDataService.save_locally(this.project);
  }

  save_to_depot () {
    let modal = this.$uibModal.open({
      templateUrl: "/static/designsafe/apps/geo/html/db-modal.html",
      controller: "DBModalCtrl as vm",
      resolve: {
        filename: ()=> {return this.project.name + '.geojson';}
      }
    });
    modal.result.then( (res) => {
      let newname = res.saveas;
      this.project.name = newname.split('.')[0];
      res.selected.name = res.saveas;
      this.loading = true;
      this.GeoDataService.save_to_depot(this.project, res.selected).then( (resp) => {
        this.loading = false;
        this.toastr.success('Saved to data depot');
      }, (err) => {
        this.toastr.error('Save failed!');
        this.loading = false;
      });
    }, (rej)=> {
      this.loading = false;
    });

  }

}
