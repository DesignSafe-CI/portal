import LayerGroup from '../models/layer_group';
import MapProject from '../models/map-project';
// import DBModalCtrl from './db-modal';
// import * as GeoUtils from '../utils/geo-utils';
import * as L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-measure';


import imagePreviewTempalte from '../html/image-preview-modal.html';
import settingsModalTmpl from '../html/settings-modal.html';
import imageOverlayTmpl from '../html/image-overlay-modal.html';
import confirmNewModalTmpl from '../html/confirm-new-modal.html';

export default class MapSidebarCtrl {

    constructor ($rootScope, $scope, $window, $timeout, $interval, $q, $uibModal, toastr, DataService, $http, GeoDataService, GeoSettingsService) {
        'ngInject';
        this.$rootScope = $rootScope;
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
        this.localFileSelected = this.localFileSelected.bind(this);
        this.featureClick = this.featureClick.bind(this);
        // this.openDbModal = this.openDbModal.bind(this);

        let streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        });

        let satellite = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '&copy;',
                maxZoom: 20,
            });

        let basemaps = {
            Street: streets,
            Satellite: satellite
        };
        this.map = L.map('geo_map', {
            layers: [streets, satellite],
            preferCanvas: false
        }).setView([0, 0], 3);
        this.mc = new L.Control.Measure({ primaryLengthUnit:'meters', primaryAreaUnit: 'meters' });
        this.mc.addTo(this.map);
        L.control.layers(basemaps).addTo(this.map);
        this.map.zoomControl.setPosition('bottomleft');

        // Overload the default marker icon
        this.HazmapperDivIcon = GeoDataService.HazmapperDivIcon;

        // Load in a map project from the data service if one does exist, if not
        // create a new one from scratch
        if (this.GeoDataService.current_project()) {
            this.project = this.GeoDataService.current_project();

            this._initMapLayers();
            this.fitMapToProject();

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

        this.addDrawControls(this.active_layer_group.feature_group);

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
            this._initMapLayers();
            this.$scope.$apply();
        });

        this.map.on('mousemove', (e) => {
            this.current_mouse_coordinates = e.latlng;
            this.$scope.$apply();
        });

        this.$scope.$on('image_popupopen', (e,d) => {
            // console.log(e, d);
            this.active_image_marker = d;
        });
        this.$scope.$on('image_popupclose', (e,d) => {
            // console.log(e, d);
            this.active_image_marker = null;
        });

    } // end constructor

    fitMapToProject() {
        try {
            this.map.fitBounds(this.project.get_bounds(), { maxZoom: 16 });
        } catch (e) {
            console.log('get_bounds fail', e);
        }
    }

    addDrawControls (fg) {
        let dc = new L.Control.Draw({
            position: 'topright',
            draw: {

                marker: {
                    icon: this.HazmapperDivIcon
                },
                circle: false
            },
            edit: {
                featureGroup: fg,
                remove: true
            }
        });
        this.map.addControl(dc);
        this.drawControl = dc;
    }

    featureClick (e) {
        let layer = e.target;
        this.current_layer = null;
        this.project.layer_groups.forEach( (lg)=>{
            lg.feature_group.getLayers().forEach( (l)=> {
                if (l == layer) {
                    l.active = true;
                } else {
                    l.active = false;
                }
            });
        });
        this.$scope.$apply();
    }

    _initMapLayers() {
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
                layer.on({
                    click: this.featureClick
                });
            });
        });
        if (!(this.active_layer_group)) {
            this.active_layer_group = this.project.layer_groups[0];
        }
    }

    createLayerGroup () {
        let lg = new LayerGroup('New Group', new L.FeatureGroup());
        this.project.layer_groups.push(lg);
        this.active_layer_group = this.project.layer_groups[this.project.layer_groups.length -1];
        this.map.addLayer(lg.feature_group);
        this.selectActiveLayerGroup(this.active_layer_group);
    }

    deleteLayerGroup (lg, i) {
        this.map.removeLayer(lg.feature_group);
        this.project.layer_groups.splice(i, 1);
        if (this.project.layer_groups.length === 0) {
            this.createLayerGroup();
        }
        this.active_layer_group = this.project.layer_groups[0];
    }

    delete_feature (lg, f) {
        this.map.removeLayer(f);
        lg.feature_group.removeLayer(f);
    }

    showHideLayerGroup (lg) {
        lg.show ? this.map.addLayer(lg.feature_group) : this.map.removeLayer(lg.feature_group);
    }

    selectActiveLayerGroup(lg) {
        this.map.removeControl(this.drawControl);
        this.addDrawControls(lg.feature_group);
        this.active_layer_group = lg;
        lg.active = true;
        lg.show = true;
    }

    _deactivateAllFeatures() {
        this.project.layer_groups.forEach( (lg)=>{
            lg.feature_group.getLayers().forEach( (layer) => {
                layer.active = false;
            });
        });
    }

    selectFeature(lg, feature) {
        this._deactivateAllFeatures();
        this.active_layer_group = lg;
        if (this.current_layer == feature) {
            feature.active = false;
            this.current_layer = null;
        } else {
            this.current_layer = feature;
            feature.active = true;
        }
    }

    createNewProject () {
        let modal = this.$uibModal.open({
            template: confirmNewModalTmpl,
            controller: 'ConfirmClearModalCtrl as vm',
        });
        modal.result.then( () => {
            this.project.clear();
            let p = new MapProject('New Map');
            p.layer_groups = [new LayerGroup('New Group', new L.FeatureGroup())];
            this.project = p;
            this.active_layer_group = this.project.layer_groups[0];
            this.map.addLayer(this.active_layer_group.feature_group);
        });
    }

    zoomTo(feature) {
        if (feature instanceof L.Marker) {
            let latLngs = [ feature.getLatLng() ];
            let markerBounds = L.latLngBounds(latLngs);
            try {
                this.map.fitBounds(markerBounds, { maxZoom: 16 });
                //  feature.getElement().style.border = '2px solid red';
            } catch (e) {
                console.log(e);
            }
        } else {
            try {
                this.map.fitBounds(feature.getBounds(), { maxZoom: 16 });
            } catch (e) {
                console.log(e);
            }
        }
    }

    onDrop (ev, data, lg) {
        let src_lg = this.project.layer_groups[data.pidx];
        let feature = src_lg.feature_group.getLayers()[data.idx];
        src_lg.feature_group.removeLayer(feature);
        lg.feature_group.addLayer(feature);
        this._initMapLayers();
    }

    updateLayerStyle (prop) {
        let tmp = this.current_layer;
        let styles = {};
        styles[prop] = this.current_layer.options[prop];
        if (tmp instanceof L.Marker) {
            tmp.getElement().style.color = this.current_layer.options.fillColor;
        } else {
            this.current_layer.setStyle(styles);
        }
    }

    updateFeature(layer){
        layer.update();
    }

    metadataSave(k, v, layer) {
        if (!(layer.options.metadata)) {
            layer.options.metadata = [];
        }
        layer.options.metadata.push({
            key:k,
            value:v
        });
        this.adding_metadata = false;
        this.metadata_key = null;
        this.metadata_value = null;
    }

    metadataDelete(idx, layer) {
        layer.options.metadata.splice(idx, 1);
    }

    dropFeatureSuccess (ev, data, lg) {

    }

    _loadDataSuccess (retval) {
        if (this.open_existing) {
            if (retval instanceof MapProject) {
                //clear off all the layers from the map
                this.project.layer_groups.forEach( (lg) => {
                    this.map.removeLayer(lg.feature_group);
                });

                // set the project to be the return value
                this.project = retval;
                this._initMapLayers();
                this.fitMapToProject();
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
            this.fitMapToProject();
        } else {

            if (this.project.layer_groups.length == 0) {
                this.project.layer_groups = [new LayerGroup('New Group', new L.FeatureGroup())];
                this.map.addLayer(this.project.layer_groups[0].feature_group);
            }
            this.active_layer_group = this.project.layer_groups[0];
            //it will be an array of features...
            retval.forEach( (f) => {
                this.active_layer_group.feature_group.addLayer(f);
            });
            this.fitMapToProject();
            this._initMapLayers();
        }
    }

    openExistingLocally () {
        this.open_existing = true;
        this.openFileDialog();
    }

    openExistingFromDepot() {
        this.open_existing = true;
        this.openDbModal({ single:true });
    }

    openDbModal (opts) {
        let modal = this.$uibModal.open({
            component: 'ddfilepicker',
            resolve: {
                filename: ()=> {return null;},
                single: opts.single
            }
        });
        modal.result.then( (files, saveas) => {this.loadFromDataDepot(files.selected);});
    }

    openImagePreviewModal (href) {
        let modal = this.$uibModal.open({
            template: imagePreviewTempalte,
            controller: 'ImagePreviewModal as vm',
            size: 'lg',
            resolve: {
                marker: ()=> {return this.active_image_marker;}
            }
        });
        modal.result.then( (f, saveas) => {this.loadFromDataDepot(f);});
    }

    openSettingsModal () {
        let modal = this.$uibModal.open({
            template: settingsModalTmpl,
            controller: 'SettingsModalCtrl as vm',
        });
        modal.result.then( (s) => {
            this.settings = this.GeoSettingsService.settings;

        });
    }

    openImageOverlayModal () {
        let modal = this.$uibModal.open({
            template: imageOverlayTmpl,
            controller: 'ImageOverlayModalCtrl as vm',
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
        });
    }

    openFileDialog () {
        this.$timeout(() => {
            $('#file_picker').click();
        }, 0);
    }

    loadFromDataDepot (files) {

        files.forEach( (f) => {
            this.loading = true;
            this.GeoDataService.load_from_data_depot(f)
                .then(
                    (retval) =>{
                        this._loadDataSuccess(retval);
                        this.loading = false;
                    },
                    (err)=> {
                        this.toastr.error('Load failed!');
                        this.loading = false;
                        this.open_existing = false;
                    });
        });
    }

    localFileSelected (ev) {
        this.loading = true;
        let reqs = [];
        for (let i=0; i<ev.target.files.length; i++) {
            // debugger
            let file = ev.target.files[i];
            let prom = this.GeoDataService.load_from_local_file(file).then( (retval) =>{return this._loadDataSuccess(retval);});
            reqs.push(prom);
            // this.loading = false;
        }
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

    saveLocally () {
        this.GeoDataService.save_locally(this.project);
    }

    saveToDepot () {
        let modal = this.$uibModal.open({
            component: 'ddfilepicker',
            resolve: {
                filename: ()=> {return this.project.name + '.geojson';}
            }
        });
        modal.result.then( (res) => {
            console.log(res)
            let newname = res.saveas;
            this.project.name = newname.split('.')[0];
            res.location.name = res.saveas;
            this.loading = true;
            this.GeoDataService.save_to_depot(this.project, res.location).then( (resp) => {
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
