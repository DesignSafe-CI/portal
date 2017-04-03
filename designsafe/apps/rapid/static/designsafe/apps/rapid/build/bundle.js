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
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _rapidMainCtrl = __webpack_require__(1);

var _rapidMainCtrl2 = _interopRequireDefault(_rapidMainCtrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.rapid.controllers', []);

mod.controller('RapidMainCtrl', _rapidMainCtrl2.default);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RapidMainCtrl = function () {
  RapidMainCtrl.$inject = ["$scope", "RapidDataService"];
  function RapidMainCtrl($scope, RapidDataService) {
    'ngInject';

    var _this = this;

    _classCallCheck(this, RapidMainCtrl);

    this.RapidDataService = RapidDataService;
    this.show_sidebar = true;
    this.filter_options = {};

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
    this.map = L.map('map', { layers: [streets, satellite] }).setView([0, 0], 2);
    this.map.zoomControl.setPosition('topright');

    this.event_types = this.RapidDataService.get_event_types();
    console.log(this.event_types);

    this.RapidDataService.get_events().then(function (resp) {
      _this.events = resp;
      _this.events.forEach(function (d) {
        var marker = L.marker([d.location.lat, d.location.lon]);
        _this.map.addLayer(marker);
      });
    });
  }

  _createClass(RapidMainCtrl, [{
    key: 'zoom_to',
    value: function zoom_to(ev) {
      this.map.setView([ev.location.lat, ev.location.lon], 8, { animate: true });
    }
  }, {
    key: 'search',
    value: function search() {
      var _this2 = this;

      console.log(this.filter_options);
      var tmp = _.filter(this.events, function (item) {
        console.log(item);
        if (_this2.filter_options.event_type) {
          return item.event_type == _this2.filter_options.event_type.event_type;
        } else {
          return true;
        }
        // return item.title.substring(0, this.search_text.length) === this.search_text;
      });
      console.log(tmp);
      this.filtered_events = tmp;
    }
  }, {
    key: 'clear_filters',
    value: function clear_filters() {
      this.filter_options = {};
      this.search();
    }
  }]);

  return RapidMainCtrl;
}();

exports.default = RapidMainCtrl;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


config.$inject = ["$stateProvider", "$uibTooltipProvider", "$urlRouterProvider", "$locationProvider"];
Object.defineProperty(exports, "__esModule", {
  value: true
});

var _controllers = __webpack_require__(0);

var _services = __webpack_require__(3);

var _directives = __webpack_require__(5);

var mod = angular.module('designsafe');
mod.requires.push('ui.router', 'ds.rapid.controllers', 'ds.rapid.services', 'ds.rapid.directives');

function config($stateProvider, $uibTooltipProvider, $urlRouterProvider, $locationProvider) {
  'ngInject';

  $locationProvider.html5Mode({
    enabled: true
  });

  $stateProvider.state('rapid', {
    url: '/',
    templateUrl: '/static/designsafe/apps/rapid/html/index.html',
    controller: 'RapidMainCtrl as vm',
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

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _rapidDataService = __webpack_require__(4);

var _rapidDataService2 = _interopRequireDefault(_rapidDataService);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.rapid.services', []);

mod.service('RapidDataService', _rapidDataService2.default);

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RapidDataService = function () {
  RapidDataService.$inject = ["$http", "$q"];
  function RapidDataService($http, $q) {
    'ngInject';

    _classCallCheck(this, RapidDataService);

    this.$http = $http;
    this.$q = $q;
  }

  _createClass(RapidDataService, [{
    key: 'get_events',
    value: function get_events(opts) {
      console.log(opts);
      // return this.$http.get('/rapid/events', opts).then( (resp) => {
      //   console.log(resp);
      // });
      var events = [{
        title: 'New Zealand Earthquake',
        event_date: new Date(2015, 1, 1),
        event_type: 'earthquake',
        location_description: 'Central New Zealand',
        location: {
          lat: -38.0,
          lon: 177.0
        }
      }, {
        title: 'Tejas Flood',
        event_date: new Date(2016, 1, 1),
        event_type: 'flood',
        location_description: 'Central Texas',
        location: {
          lat: 30.0,
          lon: -100.0
        }
      }, {
        title: 'New Zealand Earthquake',
        event_date: new Date(2015, 1, 1),
        event_type: 'earthquake',
        location_description: 'Central New Zealand',
        location: {
          lat: -38.0,
          lon: 177.0
        }
      }, {
        title: 'Tejas Flood',
        event_date: new Date(2016, 1, 1),
        event_type: 'flood',
        location_description: 'Central Texas',
        location: {
          lat: 30.0,
          lon: -100.0
        }
      }, {
        title: 'New Zealand Earthquake',
        event_date: new Date(2015, 1, 1),
        event_type: 'earthquake',
        location_description: 'Central New Zealand',
        location: {
          lat: -38.0,
          lon: 177.0
        }
      }, {
        title: 'Tejas Flood',
        event_date: new Date(2016, 1, 1),
        event_type: 'flood',
        location_description: 'Central Texas',
        location: {
          lat: 30.0,
          lon: -100.0
        }
      }, {
        title: 'New Zealand Earthquake',
        event_date: new Date(2015, 1, 1),
        event_type: 'earthquake',
        location_description: 'Central New Zealand',
        location: {
          lat: -38.0,
          lon: 177.0
        }
      }, {
        title: 'Tejas Flood',
        event_date: new Date(2016, 1, 1),
        event_type: 'flood',
        location_description: 'Central Texas',
        location: {
          lat: 30.0,
          lon: -100.0
        }
      }];

      return this.$q(function (res, rej) {
        return res(events);
      });
    }
  }, {
    key: 'get_event_types',
    value: function get_event_types() {
      return [{
        event_type: 'earthquake',
        display: 'Earthquake'
      }, {
        event_type: 'tsunami',
        display: 'Tsunami'
      }, {
        event_type: 'flood',
        display: 'Flood'
      }, {
        event_type: 'hurricane',
        display: 'Hurricane'
      }];
    }
  }]);

  return RapidDataService;
}();

exports.default = RapidDataService;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _eventListing = __webpack_require__(6);

var _eventListing2 = _interopRequireDefault(_eventListing);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mod = angular.module('ds.rapid.directives', []);

mod.directive('eventListing', _eventListing2.default);

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = eventListing;
function eventListing() {
  return {
    templateUrl: "/static/designsafe/apps/rapid/html/event-listing.html",
    scope: {
      event: '=event'
    },
    link: function link($scope, element, attrs) {}
  };
}

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map