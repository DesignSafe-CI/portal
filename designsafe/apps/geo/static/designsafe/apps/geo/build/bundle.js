/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 24);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = angular;

/***/ }),
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */
/***/ (function(module, exports) {

module.exports = L;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
function get_file_extension(fname) {
  return fname.split('.').pop().toLowerCase();
}

var RESERVED_KEYS = ['label', 'color', 'fillColor', 'fillOpacity', 'description', 'image_src', 'thumb_src', 'href', 'metadata'];

exports.RESERVED_KEYS = RESERVED_KEYS;
exports.get_file_extension = get_file_extension;

/***/ }),
/* 6 */,
/* 7 */,
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LayerGroup = function () {
  function LayerGroup(label, fg) {
    _classCallCheck(this, LayerGroup);

    this.label = label;
    this.feature_group = fg;
    this.show = true;
    this.show_contents = true;
  }

  _createClass(LayerGroup, [{
    key: 'num_features',
    value: function num_features() {
      return this.feature_group.getLayers().length;
    }
  }, {
    key: 'get_feature_type',
    value: function get_feature_type(f) {
      // debugger
      if (f.options.thumb_src) {
        return 'Image';
      } else if (f instanceof L.Marker) {
        return 'Point';
      } else if (f instanceof L.Polygon) {
        return 'Polygon';
      } else {
        return 'Path';
      }
    }
  }]);

  return LayerGroup;
}();

exports.default = LayerGroup;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _L = __webpack_require__(4);

var _L2 = _interopRequireDefault(_L);

var _geoUtils = __webpack_require__(5);

var GeoUtils = _interopRequireWildcard(_geoUtils);

var _angular = __webpack_require__(0);

var _angular2 = _interopRequireDefault(_angular);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MapProject = function () {
  function MapProject(name) {
    _classCallCheck(this, MapProject);

    this.name = name;
    this.layer_groups = [];
    this.description = null;
  }

  _createClass(MapProject, [{
    key: 'clear',
    value: function clear() {
      this.layer_groups.forEach(function (lg) {
        lg.feature_group.clearLayers();
      });
    }
  }, {
    key: 'get_bounds',
    value: function get_bounds() {
      var bounds = [];
      this.layer_groups.forEach(function (lg) {
        bounds.push(lg.feature_group.getBounds());
      });
      return bounds;
    }
  }, {
    key: 'num_features',
    value: function num_features() {
      total = 0;
      this.layer_groups.forEach(function (lg) {
        total += lg.num_features();
      });
    }
  }, {
    key: 'to_json',
    value: function to_json() {
      var out = {
        "type": "FeatureCollection",
        "features": [],
        "ds_map": true,
        "name": this.name,
        "description": this.description,
        "num_layers": this.layer_groups.length,
        "layer_groups": []
      };
      this.layer_groups.forEach(function (lg, lg_idx) {
        out.layer_groups.push(lg.label);
        var tmp = {
          "type": "FeatureCollection",
          "features": [],
          "label": lg.label
        };
        lg.feature_group.getLayers().forEach(function (feature) {
          var json = feature.toGeoJSON();
          // These are all the keys in the options object that we need to
          // re-create the layers in the application after loading.


          for (var key in feature.options) {
            if (GeoUtils.RESERVED_KEYS.indexOf(key) !== -1) {
              json.properties[key] = feature.options[key];
            }
          };
          json.layer_group_index = lg_idx;

          //this strips out all the $$angular cruft
          json = JSON.parse(_angular2.default.toJson(json));
          out.features.push(json);
        });
      });
      return out;
    }
  }]);

  return MapProject;
}();

exports.default = MapProject;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DBModalCtrl = function () {
  DBModalCtrl.$inject = ["$scope", "$uibModalInstance", "filename"];
  function DBModalCtrl($scope, $uibModalInstance, filename) {
    'ngInject';

    _classCallCheck(this, DBModalCtrl);

    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
    this.selected = null;
    this.saveas = { filename: filename };
  }

  _createClass(DBModalCtrl, [{
    key: 'ok',
    value: function ok() {
      this.$uibModalInstance.close({ selected: this.selected, saveas: this.saveas.filename });
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      this.$uibModalInstance.dismiss('cancel');
    }
  }]);

  return DBModalCtrl;
}();

exports.default = DBModalCtrl;

/***/ }),
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


config.$inject = ["$stateProvider", "$uibTooltipProvider", "$urlRouterProvider", "$locationProvider", "toastrConfig"];
Object.defineProperty(exports, "__esModule", {
  value: true
});

var _directives = __webpack_require__(25);

var _controllers = __webpack_require__(27);

var _services = __webpack_require__(34);

var mod = angular.module('designsafe');
mod.requires.push('ui.router', 'ang-drag-drop', 'ds.geo.directives', 'ds.geo.controllers', 'ds.geo.services', 'toastr');

function config($stateProvider, $uibTooltipProvider, $urlRouterProvider, $locationProvider, toastrConfig) {
  'ngInject';

  angular.extend(toastrConfig, {
    timeOut: 1000
  });

  $locationProvider.html5Mode({
    enabled: true
  });

  $stateProvider.state('geo', {
    url: '',
    abstract: true,
    templateUrl: '/static/designsafe/apps/geo/html/index.html',
    resolve: {
      auth: function auth() {
        return true;
      }
    }
  }).state('geo.map', {
    url: '/hazmapper',
    templateUrl: '/static/designsafe/apps/geo/html/map.html',
    controller: 'MapSidebarCtrl as vm'
  }).state('geo.help', {
    url: '/help',
    templateUrl: '/static/designsafe/apps/geo/html/help.html',
    controller: 'HelpCtrl as vm'
  });
  $urlRouterProvider.when('/', '/hazmapper');

  //config popups etc
  $uibTooltipProvider.options({ popupDelay: 1000 });
}

mod.config(config);

exports.default = mod;

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _customOnChange = __webpack_require__(26);

var _customOnChange2 = _interopRequireDefault(_customOnChange);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.geo.directives', []);

mod.directive('customOnChange', _customOnChange2.default);
exports.default = mod;

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = customOnChange;
function customOnChange() {
  return {
    restrict: 'A',
    scope: {
      handler: '&'
    },
    link: function link(scope, element, attrs) {
      element.on('change', function (ev) {
        scope.$apply(function () {
          scope.handler({ ev: ev });
        });
      });
    }
  };
}

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mapSidebar = __webpack_require__(28);

var _mapSidebar2 = _interopRequireDefault(_mapSidebar);

var _dbModal = __webpack_require__(10);

var _dbModal2 = _interopRequireDefault(_dbModal);

var _imageOverlayModal = __webpack_require__(29);

var _imageOverlayModal2 = _interopRequireDefault(_imageOverlayModal);

var _help = __webpack_require__(30);

var _help2 = _interopRequireDefault(_help);

var _settingsModal = __webpack_require__(31);

var _settingsModal2 = _interopRequireDefault(_settingsModal);

var _confirmClearModal = __webpack_require__(32);

var _confirmClearModal2 = _interopRequireDefault(_confirmClearModal);

var _imagePreviewModal = __webpack_require__(33);

var _imagePreviewModal2 = _interopRequireDefault(_imagePreviewModal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.geo.controllers', []);

mod.controller('MapSidebarCtrl', _mapSidebar2.default);
mod.controller('DBModalCtrl', _dbModal2.default);
mod.controller('HelpCtrl', _help2.default);
mod.controller('SettingsModalCtrl', _settingsModal2.default);
mod.controller('ConfirmClearModalCtrl', _confirmClearModal2.default);
mod.controller('ImageOverlayModalCtrl', _imageOverlayModal2.default);
mod.controller('ImagePreviewModal', _imagePreviewModal2.default);

exports.default = mod;

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _layer_group = __webpack_require__(8);

var _layer_group2 = _interopRequireDefault(_layer_group);

var _mapProject = __webpack_require__(9);

var _mapProject2 = _interopRequireDefault(_mapProject);

var _dbModal = __webpack_require__(10);

var _dbModal2 = _interopRequireDefault(_dbModal);

var _geoUtils = __webpack_require__(5);

var GeoUtils = _interopRequireWildcard(_geoUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MapSidebarCtrl = function () {
  MapSidebarCtrl.$inject = ["$rootScope", "$scope", "$window", "$timeout", "$interval", "$q", "$uibModal", "toastr", "DataService", "$http", "GeoDataService", "GeoSettingsService"];
  function MapSidebarCtrl($rootScope, $scope, $window, $timeout, $interval, $q, $uibModal, toastr, DataService, $http, GeoDataService, GeoSettingsService) {
    'ngInject';

    var _this = this;

    _classCallCheck(this, MapSidebarCtrl);

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
    this.local_file_selected = this.local_file_selected.bind(this);
    this.feature_click = this.feature_click.bind(this);
    // this.open_db_modal = this.open_db_modal.bind(this);

    var streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });

    var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy;',
      maxZoom: 20
    });

    var basemaps = {
      'Street': streets,
      'Satellite': satellite
    };
    this.map = L.map('geo_map', {
      layers: [streets, satellite],
      preferCanvas: false
    }).setView([0, 0], 3);
    this.mc = new L.Control.Measure({ primaryLengthUnit: 'meters', primaryAreaUnit: 'meters' });
    this.mc.addTo(this.map);
    L.control.layers(basemaps).addTo(this.map);
    this.map.zoomControl.setPosition('bottomleft');

    // Overload the default marker icon
    this.HazmapperDivIcon = GeoDataService.HazmapperDivIcon;

    // Load in a map project from the data service if one does exist, if not
    // create a new one from scratch
    if (this.GeoDataService.current_project()) {
      this.project = this.GeoDataService.current_project();

      this._init_map_layers();
      this.fit_map_to_project();
    } else {
      this.project = new _mapProject2.default('New Map');
      this.project.layer_groups = [new _layer_group2.default('New Group', new L.FeatureGroup())];
      this.map.addLayer(this.project.layer_groups[0].feature_group);
    }

    // this._add_click_handlers();

    // trick to fix the tiles that sometimes don't load for some reason...
    $timeout(function () {
      _this.map.invalidateSize();
    }, 10);

    // init an active layer group
    this.active_layer_group = this.project.layer_groups[0];

    // Auto keep track of current project in the GeoDataService
    // so that if they switch states they will not lose work...
    $interval(function () {
      _this.GeoDataService.current_project(_this.project);
    }, 1000);

    this.add_draw_controls(this.active_layer_group.feature_group);

    // This handles making sure that the features that get created with the draw tool
    // are styled with the default colors etc.
    this.map.on('draw:created', function (e) {
      var object = e.layer;
      object.options.color = _this.settings.default_stroke_color;
      object.options.fillColor = _this.settings.default_fill_color;
      object.options.fillOpacity = _this.settings.default_fill_opacity;
      _this.active_layer_group.feature_group.addLayer(object);
      if (object instanceof L.Marker) {
        object.getElement().style.color = _this.settings.default_marker_color;
        object.options.fillColor = _this.settings.default_marker_color;
      }
      _this._init_map_layers();
      _this.$scope.$apply();
    });

    this.map.on('mousemove', function (e) {
      _this.current_mouse_coordinates = e.latlng;
      _this.$scope.$apply();
    });

    this.$scope.$on('image_popupopen', function (e, d) {
      // console.log(e, d);
      _this.active_image_marker = d;
    });
    this.$scope.$on('image_popupclose', function (e, d) {
      // console.log(e, d);
      _this.active_image_marker = null;
    });
  } // end constructor

  _createClass(MapSidebarCtrl, [{
    key: 'fit_map_to_project',
    value: function fit_map_to_project() {
      try {
        this.map.fitBounds(this.project.get_bounds(), { maxZoom: 16 });
      } catch (e) {
        console.log('get_bounds fail', e);
      }
    }
  }, {
    key: 'add_draw_controls',
    value: function add_draw_controls(fg) {
      var dc = new L.Control.Draw({
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
  }, {
    key: 'feature_click',
    value: function feature_click(e) {
      var layer = e.target;
      this.current_layer = null;
      this.project.layer_groups.forEach(function (lg) {
        lg.feature_group.getLayers().forEach(function (l) {
          if (l == layer) {
            l.active = true;
          } else {
            l.active = false;
          }
        });
      });
      this.$scope.$apply();
    }
  }, {
    key: '_init_map_layers',
    value: function _init_map_layers() {
      var _this2 = this;

      // For some reason, need to readd the feature groups for markers to be displayed correctly???
      this.project.layer_groups.forEach(function (lg) {
        // lg.feature_group.getLayers().forEach( (layer)=>{
        //   this.map.addLayer(layer);
        // });
        // this.map.addLayer(lg.feature_group);
        _this2.map.removeLayer(lg.feature_group);
        _this2.map.addLayer(lg.feature_group);
        lg.feature_group.getLayers().forEach(function (layer) {
          if (layer instanceof L.Marker && !layer.options.image_src) {
            layer.getElement().style.color = layer.options.fillColor;
          }
          layer.on({
            click: _this2.feature_click
          });
        });
      });
      if (!this.active_layer_group) {
        this.active_layer_group = this.project.layer_groups[0];
      }
    }
  }, {
    key: 'create_layer_group',
    value: function create_layer_group() {
      var lg = new _layer_group2.default("New Group", new L.FeatureGroup());
      this.project.layer_groups.push(lg);
      this.active_layer_group = this.project.layer_groups[this.project.layer_groups.length - 1];
      this.map.addLayer(lg.feature_group);
      this.select_active_layer_group(this.active_layer_group);
    }
  }, {
    key: 'delete_layer_group',
    value: function delete_layer_group(lg, i) {
      this.map.removeLayer(lg.feature_group);
      this.project.layer_groups.splice(i, 1);
      if (this.project.layer_groups.length === 0) {
        this.create_layer_group();
      }
      this.active_layer_group = this.project.layer_groups[0];
    }
  }, {
    key: 'delete_feature',
    value: function delete_feature(lg, f) {
      this.map.removeLayer(f);
      lg.feature_group.removeLayer(f);
    }
  }, {
    key: 'show_hide_layer_group',
    value: function show_hide_layer_group(lg) {
      lg.show ? this.map.addLayer(lg.feature_group) : this.map.removeLayer(lg.feature_group);
    }
  }, {
    key: 'select_active_layer_group',
    value: function select_active_layer_group(lg) {
      this.map.removeControl(this.drawControl);
      this.add_draw_controls(lg.feature_group);
      this.active_layer_group = lg;
      lg.active = true;
      lg.show = true;
    }
  }, {
    key: '_deactivate_all_features',
    value: function _deactivate_all_features() {
      this.project.layer_groups.forEach(function (lg) {
        lg.feature_group.getLayers().forEach(function (layer) {
          layer.active = false;
        });
      });
    }
  }, {
    key: 'select_feature',
    value: function select_feature(lg, feature) {
      this._deactivate_all_features();
      this.active_layer_group = lg;
      if (this.current_layer == feature) {
        feature.active = false;
        this.current_layer = null;
      } else {
        this.current_layer = feature;
        feature.active = true;
      }
    }
  }, {
    key: 'create_new_project',
    value: function create_new_project() {
      var _this3 = this;

      var modal = this.$uibModal.open({
        templateUrl: "/static/designsafe/apps/geo/html/confirm-new-modal.html",
        controller: "ConfirmClearModalCtrl as vm"
      });
      modal.result.then(function (s) {
        _this3.map.eachLayer(function (layer) {
          console.log(layer);
          // this.map.removeLayer(layer);
        });
        _this3.project.clear();
        var p = new _mapProject2.default('New Map');
        p.layer_groups = [new _layer_group2.default('New Group', new L.FeatureGroup())];
        _this3.project = p;
        _this3.active_layer_group = _this3.project.layer_groups[0];
        _this3.map.addLayer(_this3.active_layer_group.feature_group);
      });
    }
  }, {
    key: 'zoom_to',
    value: function zoom_to(feature) {
      if (feature instanceof L.Marker) {
        var latLngs = [feature.getLatLng()];
        var markerBounds = L.latLngBounds(latLngs);
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
      };
    }
  }, {
    key: 'on_drop',
    value: function on_drop(ev, data, lg) {
      var src_lg = this.project.layer_groups[data.pidx];
      var feature = src_lg.feature_group.getLayers()[data.idx];
      src_lg.feature_group.removeLayer(feature);
      lg.feature_group.addLayer(feature);
      this._init_map_layers();
    }
  }, {
    key: 'update_layer_style',
    value: function update_layer_style(prop) {
      var tmp = this.current_layer;
      var styles = {};
      styles[prop] = this.current_layer.options[prop];
      if (tmp instanceof L.Marker) {
        tmp.getElement().style.color = this.current_layer.options.fillColor;
      } else {
        this.current_layer.setStyle(styles);
      }
    }
  }, {
    key: 'update_feature',
    value: function update_feature(layer) {
      layer.update();
    }
  }, {
    key: 'metadata_save',
    value: function metadata_save(k, v, layer) {
      if (!layer.options.metadata) {
        layer.options.metadata = [];
      }
      layer.options.metadata.push({
        'key': k,
        'value': v
      });
      this.adding_metadata = false;
      this.metadata_key = null;
      this.metadata_value = null;
    }
  }, {
    key: 'metadata_delete',
    value: function metadata_delete(idx, layer) {
      layer.options.metadata.splice(idx, 1);
    }
  }, {
    key: 'drop_feature_success',
    value: function drop_feature_success(ev, data, lg) {}
  }, {
    key: '_load_data_success',
    value: function _load_data_success(retval) {
      var _this4 = this;

      if (this.open_existing) {
        if (retval instanceof _mapProject2.default) {
          //clear off all the layers from the map
          this.project.layer_groups.forEach(function (lg) {
            _this4.map.removeLayer(lg.feature_group);
          });

          // set the project to be the return value
          this.project = retval;
          this._init_map_layers();
          this.fit_map_to_project();
        } else {
          this.toastr.error('Load failed! File was not compatible');
        }
        this.open_existing = false;
      } else if (retval instanceof _mapProject2.default) {
        retval.layer_groups.forEach(function (lg) {
          _this4.project.layer_groups.push(lg);
          _this4.map.addLayer(lg.feature_group);
        });
        this.active_layer_group = this.project.layer_groups[0];
        this.fit_map_to_project();
      } else {

        if (this.project.layer_groups.length == 0) {
          this.project.layer_groups = [new _layer_group2.default('New Group', new L.FeatureGroup())];
          this.active_layer_group = this.project.layer_groups[0];
          this.map.addLayer(this.project.layer_groups[0].feature_group);
        }
        //it will be an array of features...
        retval.forEach(function (f) {
          _this4.active_layer_group.feature_group.addLayer(f);
        });
        this.fit_map_to_project();
        this._init_map_layers();
      }
    }
  }, {
    key: 'open_existing_locally',
    value: function open_existing_locally() {
      this.open_existing = true;
      this.open_file_dialog();
    }
  }, {
    key: 'open_existing_from_depot',
    value: function open_existing_from_depot() {
      this.open_existing = true;
      this.open_db_modal();
    }
  }, {
    key: 'open_db_modal',
    value: function open_db_modal() {
      var _this5 = this;

      var modal = this.$uibModal.open({
        templateUrl: "/static/designsafe/apps/geo/html/db-modal.html",
        controller: "DBModalCtrl as vm",
        resolve: {
          filename: function filename() {
            return null;
          }
        }
      });
      modal.result.then(function (f, saveas) {
        _this5.load_from_data_depot(f);
      });
    }
  }, {
    key: 'open_image_preview_modal',
    value: function open_image_preview_modal(href) {
      var _this6 = this;

      var modal = this.$uibModal.open({
        templateUrl: "/static/designsafe/apps/geo/html/image-preview-modal.html",
        controller: "ImagePreviewModal as vm",
        size: 'lg',
        resolve: {
          marker: function marker() {
            return _this6.active_image_marker;
          }
        }
      });
      modal.result.then(function (f, saveas) {
        _this6.load_from_data_depot(f);
      });
    }
  }, {
    key: 'open_settings_modal',
    value: function open_settings_modal() {
      var _this7 = this;

      var modal = this.$uibModal.open({
        templateUrl: "/static/designsafe/apps/geo/html/settings-modal.html",
        controller: "SettingsModalCtrl as vm"
      });
      modal.result.then(function (s) {
        _this7.settings = _this7.GeoSettingsService.settings;
      });
    }
  }, {
    key: 'open_image_overlay_modal',
    value: function open_image_overlay_modal() {
      var _this8 = this;

      var modal = this.$uibModal.open({
        templateUrl: "/static/designsafe/apps/geo/html/image-overlay-modal.html",
        controller: "ImageOverlayModalCtrl as vm"
      });
      modal.result.then(function (res) {
        var bounds = void 0;
        bounds = [[res.min_lat, res.min_lon], [res.max_lat, res.max_lon]];
        if (res.file) {
          _this8.GeoDataService.read_file_as_data_url(res.file).then(function (data) {
            console.log(data);
          });
        }
        var overlay = L.imageOverlay(res.url, bounds).addTo(_this8.map);
        console.log(overlay);
      });
    }
  }, {
    key: 'open_file_dialog',
    value: function open_file_dialog() {
      this.$timeout(function () {
        $('#file_picker').click();
      }, 0);
    }
  }, {
    key: 'load_from_data_depot',
    value: function load_from_data_depot(f) {
      var _this9 = this;

      this.loading = true;
      this.GeoDataService.load_from_data_depot(f.selected).then(function (retval) {
        _this9._load_data_success(retval);
        _this9.loading = false;
      }, function (err) {
        _this9.toastr.error('Load failed!');
        _this9.loading = false;
        _this9.open_existing = false;
      });
    }
  }, {
    key: 'local_file_selected',
    value: function local_file_selected(ev) {
      var _this10 = this;

      this.loading = true;
      var reqs = [];
      for (var i = 0; i < ev.target.files.length; i++) {
        // debugger
        var file = ev.target.files[i];
        var prom = this.GeoDataService.load_from_local_file(file).then(function (retval) {
          return _this10._load_data_success(retval);
        });
        reqs.push(prom);
        // this.loading = false;
      };
      this.$q.all(reqs).then(function () {
        _this10.loading = false;
        //reset the picker
        $('#file_picker').val('');
        _this10.toastr.success('Imported file');
      }, function (rej) {
        _this10.loading = false;
        _this10.toastr.error('Load failed!');
      }).then(function () {});
    }
  }, {
    key: 'save_locally',
    value: function save_locally() {
      this.GeoDataService.save_locally(this.project);
    }
  }, {
    key: 'save_to_depot',
    value: function save_to_depot() {
      var _this11 = this;

      var modal = this.$uibModal.open({
        templateUrl: "/static/designsafe/apps/geo/html/db-modal.html",
        controller: "DBModalCtrl as vm",
        resolve: {
          filename: function filename() {
            return _this11.project.name + '.geojson';
          }
        }
      });
      modal.result.then(function (res) {
        var newname = res.saveas;
        _this11.project.name = newname.split('.')[0];
        res.selected.name = res.saveas;
        _this11.loading = true;
        _this11.GeoDataService.save_to_depot(_this11.project, res.selected).then(function (resp) {
          _this11.loading = false;
          _this11.toastr.success('Saved to data depot');
        }, function (err) {
          _this11.toastr.error('Save failed!');
          _this11.loading = false;
        });
      }, function (rej) {
        _this11.loading = false;
      });
    }
  }]);

  return MapSidebarCtrl;
}();

exports.default = MapSidebarCtrl;

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ImageOverlayModalCtrl = function () {
  ImageOverlayModalCtrl.$inject = ["$scope", "$uibModalInstance"];
  function ImageOverlayModalCtrl($scope, $uibModalInstance) {
    'ngInject';

    _classCallCheck(this, ImageOverlayModalCtrl);

    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
    this.data = {
      file: null,
      url: null,
      min_lat: null,
      max_lat: null,
      min_lon: null,
      max_lon: null
    };
  }

  _createClass(ImageOverlayModalCtrl, [{
    key: 'ok',
    value: function ok() {
      this.$uibModalInstance.close(this.data);
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      this.$uibModalInstance.dismiss('cancel');
    }
  }]);

  return ImageOverlayModalCtrl;
}();

exports.default = ImageOverlayModalCtrl;

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HelpCtrl = function HelpCtrl($scope) {
  'ngInject';

  _classCallCheck(this, HelpCtrl);

  this.$scope = $scope;
};
HelpCtrl.$inject = ["$scope"];

exports.default = HelpCtrl;

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SettingsModalCtrl = function () {
  SettingsModalCtrl.$inject = ["$scope", "$uibModalInstance", "GeoSettingsService"];
  function SettingsModalCtrl($scope, $uibModalInstance, GeoSettingsService) {
    'ngInject';

    _classCallCheck(this, SettingsModalCtrl);

    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
    this.GeoSettingsService = GeoSettingsService;
    this.settings = GeoSettingsService.settings;
  }

  _createClass(SettingsModalCtrl, [{
    key: 'ok',
    value: function ok() {
      this.GeoSettingsService.settings = this.settings;
      this.$uibModalInstance.close(this.settings);
    }
  }]);

  return SettingsModalCtrl;
}();

exports.default = SettingsModalCtrl;

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ConfirmClearModalCtrl = function () {
  ConfirmClearModalCtrl.$inject = ["$scope", "$uibModalInstance", "GeoSettingsService"];
  function ConfirmClearModalCtrl($scope, $uibModalInstance, GeoSettingsService) {
    'ngInject';

    _classCallCheck(this, ConfirmClearModalCtrl);

    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
  }

  _createClass(ConfirmClearModalCtrl, [{
    key: 'ok',
    value: function ok() {
      this.$uibModalInstance.close('ok');
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      this.$uibModalInstance.dismiss('cancel');
    }
  }]);

  return ConfirmClearModalCtrl;
}();

exports.default = ConfirmClearModalCtrl;

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ImagePreviewModal = function () {
  ImagePreviewModal.$inject = ["$scope", "$uibModalInstance", "GeoDataService", "marker"];
  function ImagePreviewModal($scope, $uibModalInstance, GeoDataService, marker) {
    'ngInject';

    _classCallCheck(this, ImagePreviewModal);

    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
    this.GeoDataService = GeoDataService;
    this.marker = marker;
    console.log("ImagePreviewModal", this.marker);
  }

  _createClass(ImagePreviewModal, [{
    key: 'cancel',
    value: function cancel() {
      this.$uibModalInstance.dismiss('cancel');
    }
  }]);

  return ImagePreviewModal;
}();

exports.default = ImagePreviewModal;

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _geoStateService = __webpack_require__(35);

var _geoStateService2 = _interopRequireDefault(_geoStateService);

var _geoDataService = __webpack_require__(36);

var _geoDataService2 = _interopRequireDefault(_geoDataService);

var _geoSettingsService = __webpack_require__(37);

var _geoSettingsService2 = _interopRequireDefault(_geoSettingsService);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.geo.services', []); // import customOnChange from './custom-on-change';

mod.service('GeoStateService', _geoStateService2.default);
mod.service('GeoDataService', _geoDataService2.default);
mod.service('GeoSettingsService', _geoSettingsService2.default);

// mod.directive('customOnChange', customOnChange);

exports.default = mod;

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GeoStateService = function GeoStateService($scope, $state) {
  _classCallCheck(this, GeoStateService);

  this.$scope = $scope;
  this.$state = $state;
  this.last_db_path = null;
};

exports.default = GeoStateService;

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _geoUtils = __webpack_require__(5);

var GeoUtils = _interopRequireWildcard(_geoUtils);

var _layer_group = __webpack_require__(8);

var _layer_group2 = _interopRequireDefault(_layer_group);

var _mapProject = __webpack_require__(9);

var _mapProject2 = _interopRequireDefault(_mapProject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GeoDataService = function () {
  GeoDataService.$inject = ["$http", "$q", "$rootScope", "UserService", "GeoSettingsService"];
  function GeoDataService($http, $q, $rootScope, UserService, GeoSettingsService) {
    'ngInject';

    _classCallCheck(this, GeoDataService);

    this.$http = $http;
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.UserService = UserService;
    this.GeoSettingsService = GeoSettingsService;
    this.active_project = null;
    this.previous_project_state = null;

    // TODO: Should this marker size be auto somehow?
    this.HazmapperDivIcon = L.divIcon({
      className: 'hm-marker',
      html: "<div> <i class='fa fa-map-marker'> </i> </div>",
      iconSize: [21, 36],
      iconAnchor: [10.5, 36]
    });
  }

  _createClass(GeoDataService, [{
    key: 'current_project',
    value: function current_project(project) {
      if (!project) {
        return this.active_project;
      }
      this.active_project = project;
    }
  }, {
    key: '_resize_image',
    value: function _resize_image(blob) {
      var _this = this;

      var max_width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 400;
      var max_height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 400;

      return this.$q(function (res, rej) {
        var base64 = _this._arrayBufferToBase64(blob);
        // Create and initialize two canvas
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        var canvasCopy = document.createElement("canvas");
        var copyContext = canvasCopy.getContext("2d");

        // Create original image
        var img = new Image();
        img.src = base64;
        img.onload = function () {
          // Determine new ratio based on max size
          var ratio = 1;
          if (img.width > max_width) {
            ratio = max_width / img.width;
          } else if (img.height > max_height) {
            ratio = max_height / img.height;
          }
          // Draw original image in second canvas
          canvasCopy.width = img.width;
          canvasCopy.height = img.height;
          copyContext.drawImage(img, 0, 0);

          // Copy and resize second canvas to first canvas
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);
          res(canvas.toDataURL('image/jpeg', 0.8));
        };
      });
    }
  }, {
    key: '_arrayBufferToBase64',
    value: function _arrayBufferToBase64(buffer) {
      var binary = '';
      var bytes = new Uint8Array(buffer);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      var encoded = btoa(binary);
      return 'data:image/jpg;base64,' + encoded;
    }
  }, {
    key: '_from_kml',
    value: function _from_kml(text_blob) {
      return this.$q(function (res, rej) {
        var features = [];
        var l = omnivore.kml.parse(text_blob);
        l.getLayers().forEach(function (d) {
          // d.feature.properties = {};
          d.options.label = d.feature.properties.name;
          features.push(d);
        });
        res(features);
      });
    }
  }, {
    key: '_from_kmz',
    value: function _from_kmz(blob) {
      var _this2 = this;

      return this.$q(function (res, rej) {
        var zipper = new JSZip();
        zipper.loadAsync(blob).then(function (zip) {
          //loop over all the files in the archive
          var proms = [];
          for (var key in zip.files) {
            var ext = key.split('.').pop();
            if (ext === 'kml') {
              return zip.files[key].async('text');
            }
          }
        }).then(function (txt) {
          var features = _this2._from_kml(txt);
          res(features);
        });
      });
    }
  }, {
    key: '_from_json',
    value: function _from_json(blob) {
      var _this3 = this;

      return this.$q(function (res, rej) {
        if (blob.ds_map) return res(_this3._from_dsmap(blob));
        try {
          var features = [];
          var options = {
            pointToLayer: function pointToLayer(feature, latlng) {
              return L.marker(latlng, { icon: _this3.HazmapperDivIcon });
            }
          };
          L.geoJSON(blob, options).getLayers().forEach(function (layer) {

            var props = layer.feature.properties;
            if (layer instanceof L.Marker && layer.feature.properties.image_src) {
              var latlng = layer.getLatLng();
              layer = _this3._make_image_marker(latlng.lat, latlng.lng, props.thumb_src, props.image_src, props.href);
            }

            //add in the optional metadata / reserved props
            layer.options.metadata = [];
            for (var key in props) {

              // if the key is not reserved for hazmapper, put it in
              // the metadata
              if (GeoUtils.RESERVED_KEYS.indexOf(key) === -1) {
                layer.options.metadata.push({
                  "key": key,
                  "value": props[key]
                });
              } else {
                layer.options[key] = props[key];
              }
            }
            features.push(layer);
          });
          res(features);
        } catch (e) {
          rej('Bad geoJSON');
        }
      });
    }
  }, {
    key: '_from_gpx',
    value: function _from_gpx(blob) {
      return this.$q(function (res, rej) {
        // console.log(text_blob)
        var features = [];
        var l = omnivore.gpx.parse(blob);
        l.getLayers().forEach(function (d) {
          features.push(d);
        });
        res(features);
      });
    }
  }, {
    key: '_make_image_marker',
    value: function _make_image_marker(lat, lon, thumb, preview) {
      var _this4 = this;

      var href = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

      var icon = L.divIcon({
        iconSize: [40, 40],
        html: "<div class='image' style='background:url(" + thumb + ");background-size: 100% 100%'></div>",
        className: 'leaflet-marker-photo'
      });

      var tmpl = "<img src=" + preview + ">";

      var marker = L.marker([lat, lon], { icon: icon }).bindPopup(tmpl, {
        className: 'leaflet-popup-photo',
        maxWidth: "auto"
        // maxHeight: 400
      });
      marker.on('popupopen', function (e) {
        _this4.$rootScope.$broadcast("image_popupopen", marker);
      });
      marker.on('popupclose', function (e) {
        _this4.$rootScope.$broadcast("image_popupclose", marker);
      });
      marker.options.image_src = preview;
      marker.options.thumb_src = thumb;
      marker.options.href = href;
      return marker;
    }
  }, {
    key: '_from_image',
    value: function _from_image(file, fname) {
      var _this5 = this;

      var agave_file = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      return this.$q(function (res, rej) {
        try {
          var exif = EXIF.readFromBinaryFile(file);
          var lat = exif.GPSLatitude;
          var lon = exif.GPSLongitude;
          //Convert coordinates to WGS84 decimal
          var latRef = exif.GPSLatitudeRef || "N";
          var lonRef = exif.GPSLongitudeRef || "W";
          lat = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef == "N" ? 1 : -1);
          lon = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef == "W" ? -1 : 1);
          if (lat > 90 || lat < -90 || lon > 360 || lon < -360) {
            rej('Bad EXIF GPS data');
          }
          var thumb = null;
          var preview = null;
          _this5._resize_image(file, 100, 100).then(function (resp) {
            thumb = resp;
          }).then(function () {
            return _this5._resize_image(file, 400, 400);
          }).then(function (resp) {
            preview = resp;
            var marker = _this5._make_image_marker(lat, lon, thumb, preview, null);
            if (agave_file) {
              marker.options.href = agave_file._links.self.href;
              marker.options.label = agave_file.name;
            } else {
              marker.options.label = fname;
            }
            res([marker]);
          });
        } catch (e) {
          rej(e);
        }
      });
    }
  }, {
    key: '_from_dsmap',
    value: function _from_dsmap(json) {
      var _this6 = this;

      return this.$q(function (res, rej) {
        // if (json instanceof String) {
        var project = new _mapProject2.default();
        var options = {
          pointToLayer: function pointToLayer(feature, latlng) {
            return L.marker(latlng, { icon: _this6.HazmapperDivIcon });
          }
        };
        project.name = json.name;
        project.description = json.description;
        json.layer_groups.forEach(function (name) {
          project.layer_groups.push(new _layer_group2.default(name, new L.FeatureGroup()));
        });
        json.features.forEach(function (d) {
          var feature = L.geoJSON(d, options);
          feature.eachLayer(function (layer) {
            // If there were no styles applied, it might be transparent???
            if (!layer.feature.properties.color) {
              layer.feature.properties.color = '#ff0000';
            };
            if (!layer.feature.properties.fillColor) {
              layer.feature.properties.fillColor = '#ff0000';
            };
            if (!layer.feature.properties.opacity) {
              layer.feature.properties.opacity = 1.0;
            };

            var props = layer.feature.properties;

            try {
              var styles = {
                fillColor: layer.feature.properties.fillColor,
                color: layer.feature.properties.color,
                opacity: layer.feature.properties.opacity
              };
              layer.setStyle(styles);
            } catch (e) {
              // this can get caught for marker type objects, which for some reason
              // do not have a setStyle() method
              console.log(e);
            }

            var layer_group_index = d.layer_group_index;
            if (layer instanceof L.Marker && layer.feature.properties.image_src) {
              var latlng = layer.getLatLng();
              layer = _this6._make_image_marker(latlng.lat, latlng.lng, layer.feature.properties.thumb_src, layer.feature.properties.image_src, layer.feature.properties.original_src);
              // feat.options.image_src = feat.feature.properties.image_src;
              // feat.options.thumb_src = feat.feature.properties.thumb_src;
            }

            // Add in the properties that were on the feature
            for (var key in props) {
              layer.options[key] = props[key];
            }

            project.layer_groups[layer_group_index].feature_group.addLayer(layer);
            // layer.options.label = d.properties.label;
          });
        });
        res(project);
      });
    }
  }, {
    key: 'read_file_as_data_url',
    value: function read_file_as_data_url(file) {

      var reader = new FileReader();
      return this.$q(function (res, rej) {
        reader.readAsDataURL(file);

        reader.onload = function (e) {
          return res(reader.result);
        };
      });
    }

    /*
    This will return a promise that resolves to an array of features
    that can be added to a LayerGroup
    */

  }, {
    key: 'load_from_local_file',
    value: function load_from_local_file(file) {
      var _this7 = this;

      return this.$q(function (res, rej) {
        var ext = GeoUtils.get_file_extension(file.name);
        var reader = new FileReader();
        //
        if (ext === 'kmz' || ext === 'jpeg' || ext === 'jpg') {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }
        reader.onload = function (e) {
          var p = null;
          switch (ext) {
            case 'kml':
              p = _this7._from_kml(e.target.result);
              break;
            case 'json':
              p = _this7._from_json(JSON.parse(e.target.result));
              break;
            case 'geojson':
              p = _this7._from_json(JSON.parse(e.target.result));
              break;
            case 'kmz':
              p = _this7._from_kmz(e.target.result);
              break;
            case 'gpx':
              p = _this7._from_gpx(e.target.result);
              break;
            case 'jpeg':
              p = _this7._from_image(e.target.result, file.name);
              break;
            case 'jpg':
              p = _this7._from_image(e.target.result, file.name);
              break;
            case 'dsmap':
              p = _this7._from_dsmap(JSON.parse(e.target.result));
              break;
            default:
              p = _this7._from_json(JSON.parse(e.target.result));
          }
          return res(p);
        };
      });
    }

    //
    // @param f: a file from DataService
    // returns a promise with the LayerGroup

  }, {
    key: 'load_from_data_depot',
    value: function load_from_data_depot(f) {
      var _this8 = this;

      var ext = GeoUtils.get_file_extension(f.name);
      var responseType = 'text';
      if (ext === 'kmz' || ext === 'jpg' || ext === 'jpeg') {
        responseType = 'arraybuffer';
      }
      return this.$http.get(f.agaveUrl(), { 'responseType': responseType }).then(function (resp) {
        var p = null;
        switch (ext) {
          case 'kml':
            p = _this8._from_kml(resp.data);
            break;
          case 'json':
            p = _this8._from_json(resp.data);
            break;
          case 'geojson':
            p = _this8._from_json(resp.data);
            break;
          case 'kmz':
            p = _this8._from_kmz(resp.data);
            break;
          case 'gpx':
            p = _this8._from_gpx(resp.data);
            break;
          case 'jpeg':
            p = _this8._from_image(resp.data, f.name, f);
            break;
          case 'jpg':
            p = _this8._from_image(resp.data, f.name, f);
            break;
          case 'dsmap':
            p = _this8._from_dsmap(resp.data);
            break;
          default:
            p = _this8._from_json(resp.data);
        }
        return p;
      });
    }
  }, {
    key: 'save_locally',
    value: function save_locally(project) {
      var gjson = project.to_json();
      var blob = new Blob([JSON.stringify(gjson)], { type: "application/json" });
      var url = URL.createObjectURL(blob);

      var a = document.createElement('a');
      document.body.appendChild(a);
      a.download = project.name + ".geojson";
      a.href = url;
      a.textContent = "Download";
      a.click();
      document.body.removeChild(a);
    }

    //TODO Fix that hard coded URL?

  }, {
    key: 'save_to_depot',
    value: function save_to_depot(project, path) {
      var form = new FormData();
      var gjson = project.to_json();
      var blob = new Blob([JSON.stringify(gjson)], { type: "application/json" });
      var base_file_url = 'https://agave.designsafe-ci.org/files/v2/media/system/';
      var post_url = base_file_url;
      post_url = post_url + path.system;
      var file = null;
      if (path.type === 'dir') {
        post_url = post_url + path.path;
        file = new File([blob], path.name);
        form.append('fileToUpload', file, path.name);
      } else {
        // A file was picked, so this WILL replace it
        post_url = post_url + path.trail[path.trail.length - 2].path;
        file = new File([blob], path.name);
        form.append('fileToUpload', file, path.name);
      }
      return this.$http.post(post_url, form, { headers: { 'Content-Type': undefined } });
    }
  }]);

  return GeoDataService;
}();

exports.default = GeoDataService;

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GeoSettingsService = function GeoSettingsService() {
  _classCallCheck(this, GeoSettingsService);

  this.settings = {
    default_marker_color: '#71c4ff',
    default_fill_color: '#ff0000',
    default_stroke_color: '#ff0000',
    default_fill_opacity: 0.5,
    measurement_units: 'si'
  };
};

exports.default = GeoSettingsService;

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map