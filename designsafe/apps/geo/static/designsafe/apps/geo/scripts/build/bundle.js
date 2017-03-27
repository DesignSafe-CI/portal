/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

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

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 11);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DBModalCtrl = function () {
  DBModalCtrl.$inject = ["$scope", "$uibModalInstance"];
  function DBModalCtrl($scope, $uibModalInstance) {
    'ngInject';

    _classCallCheck(this, DBModalCtrl);

    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
    this.selected = null;
  }

  _createClass(DBModalCtrl, [{
    key: 'ok',
    value: function ok() {
      this.$uibModalInstance.close(this.selected);
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
/* 1 */
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
    key: "num_features",
    value: function num_features() {
      return this.feature_group.getLayers().length;
    }
  }]);

  return LayerGroup;
}();

exports.default = LayerGroup;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MapProject = function MapProject(name) {
  _classCallCheck(this, MapProject);

  this.name = name;
  this.layer_groups = [];
  this.description = null;
};

exports.default = MapProject;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get_file_extension = get_file_extension;
function get_file_extension(fname) {
  return fname.split('.').pop();
}

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mapSidebar = __webpack_require__(7);

var _mapSidebar2 = _interopRequireDefault(_mapSidebar);

var _dbModal = __webpack_require__(0);

var _dbModal2 = _interopRequireDefault(_dbModal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.geo.controllers', []);

mod.controller('MapSidebarCtrl', _mapSidebar2.default);
mod.controller('DBModalCtrl', _dbModal2.default);
exports.default = mod;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _customOnChange = __webpack_require__(8);

var _customOnChange2 = _interopRequireDefault(_customOnChange);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.geo.directives', []);

mod.directive('customOnChange', _customOnChange2.default);
exports.default = mod;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _geoStateService = __webpack_require__(10);

var _geoStateService2 = _interopRequireDefault(_geoStateService);

var _geoDataService = __webpack_require__(9);

var _geoDataService2 = _interopRequireDefault(_geoDataService);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import customOnChange from './custom-on-change';
var mod = angular.module('ds.geo.services', []);
mod.service('GeoStateService', _geoStateService2.default);
mod.service('GeoDataService', _geoDataService2.default);

// mod.directive('customOnChange', customOnChange);

exports.default = mod;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _layer_group = __webpack_require__(1);

var _layer_group2 = _interopRequireDefault(_layer_group);

var _mapProject = __webpack_require__(2);

var _mapProject2 = _interopRequireDefault(_mapProject);

var _dbModal = __webpack_require__(0);

var _dbModal2 = _interopRequireDefault(_dbModal);

var _geoUtils = __webpack_require__(3);

var GeoUtils = _interopRequireWildcard(_geoUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MapSidebarCtrl = function () {
  MapSidebarCtrl.$inject = ["$scope", "$window", "$timeout", "$uibModal", "DataService", "$http", "GeoDataService"];
  function MapSidebarCtrl($scope, $window, $timeout, $uibModal, DataService, $http, GeoDataService) {
    'ngInject';

    var _this = this;

    _classCallCheck(this, MapSidebarCtrl);

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

    var streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });

    var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy;',
      maxZoom: 18
    });

    var basemaps = {
      'Street': streets,
      'Satellite': satellite
    };

    this.map = L.map('geo_map', { layers: [streets, satellite] }).setView([0, 0], 3);
    this.map_title = 'New Map';
    L.control.layers(basemaps).addTo(this.map);
    this.map.zoomControl.setPosition('bottomleft');

    // trick to fix the tiles that sometimes don't load for some reason...
    $timeout(function () {
      _this.map.invalidateSize();
    }, 10);

    this.layer_groups = [new _layer_group2.default('New Group', new L.FeatureGroup())];
    this.map.addLayer(this.layer_groups[0].feature_group);
    this.active_layer_group = this.layer_groups[0];

    // update the current layer to show the details tab
    this.active_layer_group.feature_group.on('click', function (e) {
      _this.current_layer ? _this.current_layer = null : _this.current_layer = e.layer;
      _this.$scope.$apply();
    });

    this.add_draw_controls(this.active_layer_group.feature_group);

    this.map.on('draw:created', function (e) {
      var object = e.layer;
      object.options.color = _this.secondary_color;
      object.options.fillColor = _this.primary_color;
      object.options.fillOpacity = 0.8;
      _this.active_layer_group.feature_group.addLayer(object);
      _this.$scope.$apply();
    });

    this.map.on('mousemove', function (e) {
      _this.current_mouse_coordinates = e.latlng;
      _this.$scope.$apply();
    });
  } // end constructor

  _createClass(MapSidebarCtrl, [{
    key: 'add_draw_controls',
    value: function add_draw_controls(fg) {
      var dc = new L.Control.Draw({
        position: 'topright',
        draw: {
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
  }, {
    key: 'create_layer_group',
    value: function create_layer_group() {
      var lg = new _layer_group2.default("New Group", new L.FeatureGroup());
      this.layer_groups.push(lg);
      this.active_layer_group = this.layer_groups[this.layer_groups.length - 1];
      this.map.addLayer(lg.feature_group);
      this.select_active_layer_group(this.active_layer_group);
    }
  }, {
    key: 'delete_layer_group',
    value: function delete_layer_group(lg, i) {
      this.map.removeLayer(lg.feature_group);
      this.layer_groups.splice(i, 1);
    }
  }, {
    key: 'delete_feature',
    value: function delete_feature(f) {
      this.map.removeLayer(f);
      this.active_layer_group.feature_group.removeLayer(f);
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
    key: 'open_db_modal',
    value: function open_db_modal() {
      var _this2 = this;

      var modal = this.$uibModal.open({
        templateUrl: "/static/designsafe/apps/geo/html/db-modal.html",
        controller: "DBModalCtrl as vm"
      });
      modal.result.then(function (f) {
        _this2.load_from_data_depot(f);
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
    key: 'get_feature_type',
    value: function get_feature_type(f) {
      if (f instanceof L.Marker) {
        return 'Point';
      } else if (f instanceof L.Polygon) {
        return 'Polygon';
      } else {
        return 'Path';
      }
    }
  }, {
    key: 'zoom_to',
    value: function zoom_to(feature) {
      if (feature instanceof L.Marker) {
        var latLngs = [feature.getLatLng()];
        var markerBounds = L.latLngBounds(latLngs);
        this.map.fitBounds(markerBounds);
      } else {
        this.map.fitBounds(feature.getBounds());
      };
    }
  }, {
    key: 'on_drop',
    value: function on_drop(ev, data, lg) {
      var src_lg = this.layer_groups[data.pidx];
      var feature = src_lg.feature_group.getLayers()[data.idx];
      src_lg.feature_group.removeLayer(feature);
      lg.feature_group.addLayer(feature);
    }
  }, {
    key: 'drop_feature_success',
    value: function drop_feature_success(ev, data, lg) {
      console.log("drag_feature_success", ev, data, lg);
      // lg.feature_group.getLayers().splicer(idx, 1);
    }
  }, {
    key: 'load_from_data_depot',
    value: function load_from_data_depot(f) {
      var _this3 = this;

      this.loading = true;
      this.GeoDataService.load_from_data_depot(f).then(function (lg) {
        _this3.layer_groups.push(lg);
        _this3.map.addLayer(lg.feature_group);
        _this3.loading = false;
      });
    }
  }, {
    key: 'local_file_selected',
    value: function local_file_selected(ev) {
      var _this4 = this;

      var file = ev.target.files[0];
      var lf = this.GeoDataService.load_from_local_file(file).then(function (lg) {
        console.log(lg);
        _this4.layer_groups.push(lg);
        _this4.map.addLayer(lg.feature_group);
        var bounds = [];
        _this4.layer_groups.forEach(function (lg) {
          bounds.push(lg.feature_group.getBounds());
        });
        _this4.map.fitBounds(bounds);
      });
    }
  }, {
    key: 'update_layer_style',
    value: function update_layer_style(prop) {
      this.current_layer.setStyle({ prop: this.current_layer.options[prop] });
    }
  }, {
    key: 'save_project',
    value: function save_project() {
      var out = {
        "type": "FeatureCollection",
        "features": [],
        "ds_map": true,
        "name": this.map_title
      };
      this.layer_groups.forEach(function (lg) {
        var json = lg.feature_group.toGeoJSON();
        //add in any options
        json.label = lg.label;

        out.features.push(json);
      });
      var blob = new Blob([JSON.stringify(out)], { type: "application/json" });
      var url = URL.createObjectURL(blob);

      var a = document.createElement('a');
      a.download = this.map_title + ".json";
      a.href = url;
      a.textContent = "Download";
      a.click();
    }
  }]);

  return MapSidebarCtrl;
}();

exports.default = MapSidebarCtrl;

/***/ }),
/* 8 */
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
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _geoUtils = __webpack_require__(3);

var GeoUtils = _interopRequireWildcard(_geoUtils);

var _layer_group = __webpack_require__(1);

var _layer_group2 = _interopRequireDefault(_layer_group);

var _mapProject = __webpack_require__(2);

var _mapProject2 = _interopRequireDefault(_mapProject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GeoDataService = function () {
  GeoDataService.$inject = ["$http", "$q"];
  function GeoDataService($http, $q) {
    'ngInject';

    _classCallCheck(this, GeoDataService);

    this.$http = $http;
    this.$q = $q;
    this.image_icon = L.divIcon({
      iconSize: [40, 40],
      html: "<div style='background-color:red'></div>",
      className: 'leaflet-marker-photo'
    });
  }

  _createClass(GeoDataService, [{
    key: '_arrayBufferToBase64',
    value: function _arrayBufferToBase64(buffer) {
      var binary = '';
      var bytes = new Uint8Array(buffer);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }, {
    key: '_from_kml',
    value: function _from_kml(text_blob) {
      return this.$q(function (res, rej) {
        var lg = new _layer_group2.default("New Group", new L.FeatureGroup());
        var l = omnivore.kml.parse(text_blob);
        l.getLayers().forEach(function (d) {
          lg.feature_group.addLayer(d);
        });
        res(lg);
      });
    }
  }, {
    key: '_from_kmz',
    value: function _from_kmz(blob) {
      var _this = this;

      return this.$q(function (res, rej) {
        var zipper = new JSZip();
        zipper.loadAsync(blob).then(function (zip) {

          //loop over all the files in the archive
          for (var key in zip.files) {
            var ext = key.split('.').pop();
            if (ext === 'kml') {
              return zip.files[key].async('text');
            }
          }
        }).then(function (txt) {
          var lg = _this._from_kml(txt);
          res(lg);
        });
      });
    }
  }, {
    key: '_from_json',
    value: function _from_json(json_blob) {
      return this.$q(function (res, rej) {
        var lg = new _layer_group2.default("New Group", new L.FeatureGroup());
        L.geoJSON(json_blob).getLayers().forEach(function (l) {
          lg.feature_group.addLayer(l);
        });
        res(lg);
      });
    }
  }, {
    key: '_from_gpx',
    value: function _from_gpx(blob) {
      return this.$q(function (res, rej) {
        // console.log(text_blob)
        var lg = new _layer_group2.default("New Group", new L.FeatureGroup());
        var l = omnivore.gpx.parse(blob);
        l.getLayers().forEach(function (d) {
          lg.feature_group.addLayer(d);
        });
        res(lg);
      });
    }
  }, {
    key: '_from_image',
    value: function _from_image(file) {
      var _this2 = this;

      return this.$q(function (res, rej) {
        var lg = new _layer_group2.default("New Group", new L.FeatureGroup());
        var exif = EXIF.readFromBinaryFile(file);
        console.log(exif);
        var encoded = 'data:image/jpg;base64,' + _this2._arrayBufferToBase64(file);
        var lat = exif.GPSLatitude;
        var lon = exif.GPSLongitude;

        //Convert coordinates to WGS84 decimal
        var latRef = exif.GPSLatitudeRef || "N";
        var lonRef = exif.GPSLongitudeRef || "W";
        lat = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef == "N" ? 1 : -1);
        lon = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef == "W" ? -1 : 1);
        var icon = L.divIcon({
          iconSize: [40, 40],
          html: "<div class='image' style='background:url(" + encoded + ");background-size: 100% 100%'></div>",
          className: 'leaflet-marker-photo'
        });

        var marker = L.marker([lat, lon], { icon: icon }).bindPopup("<div class='image' style='background:url(" + encoded + ");background-size: contain;background-repeat:no-repeat'>", {
          className: 'leaflet-popup-photo',
          minWidth: 400
        });

        marker.image_data = encoded;
        console.log(marker);
        lg.feature_group.addLayer(marker);
        res(lg);
      });
    }
  }, {
    key: '_load_dsmap',
    value: function _load_dsmap(json_blob) {}
  }, {
    key: 'load_from_local_file',
    value: function load_from_local_file(file) {
      var _this3 = this;

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
              p = _this3._from_kml(e.target.result);
              break;
            case 'json':
              p = _this3._from_json(e.target.result);
              break;
            case 'geojson':
              p = _this3._from_json(e.target.result);
              break;
            case 'kmz':
              p = _this3._from_kmz(e.target.result);
              break;
            case 'gpx':
              p = _this3._from_gpx(e.target.result);
              break;
            case 'jpeg':
              p = _this3._from_image(e.target.result);
              break;
            case 'jpg':
              p = _this3._from_image(e.target.result);
              break;
            default:
              p = _this3._from_json(e.target.result);
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
      var _this4 = this;

      var ext = GeoUtils.get_file_extension(f.name);
      var responseType = 'text';
      if (ext === 'kmz' || ext === 'jpg' || ext === 'jpeg') {
        responseType = 'arraybuffer';
      }
      return this.$http.get(f.agaveUrl(), { 'responseType': responseType }).then(function (resp) {
        var p = null;
        switch (ext) {
          case 'kml':
            p = _this4._from_kml(resp.data);
            break;
          case 'json':
            p = _this4._from_json(resp.data);
            break;
          case 'geojson':
            p = _this4._from_json(resp.data);
            break;
          case 'kmz':
            p = _this4._from_kmz(resp.data);
            break;
          case 'gpx':
            p = _this4._from_gpx(resp.data);
            break;
          case 'jpeg':
            p = _this4._from_image(resp.data);
            break;
          case 'jpg':
            p = _this4._from_image(resp.data);
            break;
          default:
            p = _this4._from_json(resp.data);
        }
        return p;
      });
    }
  }]);

  return GeoDataService;
}();

exports.default = GeoDataService;

/***/ }),
/* 10 */
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
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


config.$inject = ["$stateProvider", "$uibTooltipProvider"];
Object.defineProperty(exports, "__esModule", {
  value: true
});

var _directives = __webpack_require__(5);

var _controllers = __webpack_require__(4);

var _services = __webpack_require__(6);

var mod = angular.module('designsafe');
mod.requires.push('ui.router', 'ang-drag-drop', 'ds.geo.directives', 'ds.geo.controllers', 'ds.geo.services');

function config($stateProvider, $uibTooltipProvider) {
  'ngInject';

  $stateProvider.state('geo', {
    url: '',
    templateUrl: '/static/designsafe/apps/geo/html/map.html',
    controller: 'MapSidebarCtrl as vm',
    resolve: {
      auth: function auth() {
        return true;
      }
    }
  });

  //config popups etc
  $uibTooltipProvider.options({ popupDelay: 1000 });
}

mod.config(config);

exports.default = mod;

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map