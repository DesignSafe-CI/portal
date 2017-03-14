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
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mapSidebar = __webpack_require__(3);

var _mapSidebar2 = _interopRequireDefault(_mapSidebar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.geo.controllers', []);

mod.controller('MapSidebarCtrl', _mapSidebar2.default);

exports.default = mod;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _customOnChange = __webpack_require__(4);

var _customOnChange2 = _interopRequireDefault(_customOnChange);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.geo.directives', []);

mod.directive('customOnChange', _customOnChange2.default);

exports.default = mod;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
// import customOnChange from './custom-on-change';

var mod = angular.module('ds.geo.services', []);

// mod.directive('customOnChange', customOnChange);

exports.default = mod;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _layer_group = __webpack_require__(5);

var _layer_group2 = _interopRequireDefault(_layer_group);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

console.log(_layer_group2.default);

var MapSidebarCtrl = function () {
  MapSidebarCtrl.$inject = ["$scope", "$window", "$timeout"];
  function MapSidebarCtrl($scope, $window, $timeout) {
    'ngInject';

    var _this = this;

    _classCallCheck(this, MapSidebarCtrl);

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

    this.map = L.map('geo_map', { layers: [streets, satellite] }).setView([51.505, -0.09], 6);
    this.map_title = 'New Map';
    L.control.layers(basemaps).addTo(this.map);
    this.map.zoomControl.setPosition('bottomleft');

    // this.drawnItems = new L.FeatureGroup();
    // this.map.addLayer(this.drawnItems);

    this.layer_groups = [new _layer_group2.default('New Group', new L.FeatureGroup())];
    this.map.addLayer(this.layer_groups[0].feature_group);
    this.active_layer_group = this.layer_groups[0];
    var drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        circle: false
      },
      edit: {
        featureGroup: this.active_layer_group.feature_group,
        remove: true
      }
    });

    this.active_layer_group.feature_group.on('click', function (e) {
      // console.log(e, e.layer)
    });

    this.map.addControl(drawControl);

    this.map.on('draw:created', function (e) {
      var object = e.layer;
      object.on('click', function (e) {
        console.log(e);
      });
      object.options.color = _this.secondary_color;
      object.options.fillColor = _this.primary_color;
      object.options.fillOpacity = 0.8;
      _this.active_layer_group.feature_group.addLayer(object);
      // this.current_layer = object;
      _this.$scope.$apply();
    });
  } // end constructor

  _createClass(MapSidebarCtrl, [{
    key: 'create_layer',
    value: function create_layer() {
      console.log("create_layer");
      var lg = new _layer_group2.default("New Group", new L.LayerGroup());
      this.layer_groups.push(lg);
      this.active_layer_group = this.layer_groups[this.layer_groups.length - 1];
      this.map.addLayer(lg.feature_group);
    }
  }, {
    key: 'show_hide_layer_group',
    value: function show_hide_layer_group(lg) {
      console.log(lg);
      lg.show ? this.map.addLayer(lg.feature_group) : this.map.removeLayer(lg.feature_group);
    }
  }, {
    key: 'select_active_layer_group',
    value: function select_active_layer_group(lg) {
      this.active_layer_group = lg;
      lg.active = true;
      lg.show = true;
    }
  }, {
    key: 'open_file_dialog',
    value: function open_file_dialog() {}
  }, {
    key: 'local_file_selected',
    value: function local_file_selected(ev) {
      var _this2 = this;

      var file = ev.target.files[0];
      var reader = new FileReader();
      reader.readAsText(file);
      reader.onload = function (e) {
        var json = JSON.parse(e.target.result);
        L.geoJSON(json).getLayers().forEach(function (l) {
          ;
          _this2.drawnItems.addLayer(l);
        });
        _this2.map.fitBounds(_this2.drawnItems.getBounds());
      };
    }
  }, {
    key: 'load_image',
    value: function load_image(ev) {
      var files = ev.target.files;
      for (var i = 0; i < files.length; i++) {
        var file = files[0];
        var reader = new FileReader(); // use HTML5 file reader to get the file

        reader.readAsArrayBuffer(file);
        reader.onloadend = function (e) {
          // get EXIF data
          var exif = EXIF.readFromBinaryFile(e.target.result);

          var lat = exif.GPSLatitude;
          var lon = exif.GPSLongitude;
          console.log(exif);

          //Convert coordinates to WGS84 decimal
          var latRef = exif.GPSLatitudeRef || "N";
          var lonRef = exif.GPSLongitudeRef || "W";
          lat = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef == "N" ? 1 : -1);
          lon = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef == "W" ? -1 : 1);

          //Send the coordinates to your map
          Map.AddMarker(lat, lon);
        };
      }
    }
  }, {
    key: 'update_layer_style',
    value: function update_layer_style(prop) {
      this.current_layer.setStyle({ prop: this.current_layer.options[prop] });
    }
  }, {
    key: 'save_project',
    value: function save_project() {
      console.log(this.drawnItems);
      this.drawnItems.eachLayer(function (l) {
        console.log(l.options);
      });
      var blob = new Blob([JSON.stringify(this.drawnItems.toGeoJSON())], { type: "application/json" });
      var url = URL.createObjectURL(blob);

      var a = document.createElement('a');
      a.download = "backup.json";
      a.href = url;
      a.textContent = "Download backup.json";
      a.click();
    }
  }]);

  return MapSidebarCtrl;
}();

exports.default = MapSidebarCtrl;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = customOnChange;
function customOnChange() {
  return {
    restrict: 'A',
    link: function link(scope, element, attrs) {
      var onChangeHandler = scope.$eval(attrs.customOnChange);
      element.bind('change', onChangeHandler);
    }
  };
}

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LayerGroup = function LayerGroup(label, fg) {
  _classCallCheck(this, LayerGroup);

  this.label = label;
  this.feature_group = fg;
  this.show = true;
  console.log(this.feature_group);
};

exports.default = LayerGroup;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


config.$inject = ["$stateProvider"];
Object.defineProperty(exports, "__esModule", {
  value: true
});

var _directives = __webpack_require__(1);

var _controllers = __webpack_require__(0);

var _services = __webpack_require__(2);

var mod = angular.module('designsafe');
mod.requires.push('ui.router', 'ds.geo.directives', 'ds.geo.controllers', 'ds.geo.services');

function config($stateProvider) {
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
}

mod.config(config);

exports.default = mod;

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map