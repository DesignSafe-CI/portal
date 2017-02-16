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
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
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
    this.map = L.map('geo_map').setView([51.505, -0.09], 6);

    //method binding for callback, sigh...
    this.local_file_selected = this.local_file_selected.bind(this);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    var drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        circle: false
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: true
      }
    });

    this.drawnItems.on('click', function (e) {
      if (_this.current_layer == e.layer) {
        _this.current_layer = null;
      } else {
        _this.current_layer = e.layer;
      };
      _this.$scope.$apply();
    });

    this.map.addControl(drawControl);

    this.map.on('draw:created', function (e) {
      var object = e.layer;
      object.options.color = '#ff0000';
      object.options.fillColor = '#ff0000';
      object.options.fillOpacity = 0.8;
      _this.drawnItems.addLayer(object);
      _this.current_layer = object;
      _this.$scope.$apply();
    });
  }

  _createClass(MapSidebarCtrl, [{
    key: 'open_file_dialog',
    value: function open_file_dialog() {
      this.$timeout(function () {
        angular.element('#local_file').trigger('click');
      });
    }
  }, {
    key: 'open_image_dialog',
    value: function open_image_dialog() {
      this.$timeout(function () {
        angular.element('#local_image').trigger('click');
      });
    }
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
    key: 'update_color',
    value: function update_color() {
      this.current_layer.setStyle({ color: this.current_layer.options.color });
    }
  }, {
    key: 'update_fill',
    value: function update_fill() {
      this.current_layer.setStyle({ fillColor: this.current_layer.options.fillColor });
      this.current_layer.setStyle({ color: this.current_layer.options.fillColor });
    }
  }, {
    key: 'update_opacity',
    value: function update_opacity() {
      this.current_layer.setStyle({ fillOpacity: this.current_layer.options.fillOpacity });
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
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


config.$inject = ["$stateProvider"];
Object.defineProperty(exports, "__esModule", {
  value: true
});

var _directives = __webpack_require__(2);

var _controllers = __webpack_require__(4);

var _services = __webpack_require__(5);

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

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _customOnChange = __webpack_require__(3);

var _customOnChange2 = _interopRequireDefault(_customOnChange);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.geo.directives', []);

mod.directive('customOnChange', _customOnChange2.default);

exports.default = mod;

/***/ }),
/* 3 */
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
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mapSidebar = __webpack_require__(0);

var _mapSidebar2 = _interopRequireDefault(_mapSidebar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.geo.controllers', []);

mod.controller('MapSidebarCtrl', _mapSidebar2.default);

exports.default = mod;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
// import customOnChange from './custom-on-change';

var mod = angular.module('ds.geo.services', []);

// mod.directive('customOnChange', customOnChange);

exports.default = mod;

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map