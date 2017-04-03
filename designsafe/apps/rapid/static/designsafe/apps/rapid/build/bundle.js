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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RapidMainCtrl = function RapidMainCtrl($scope) {
  _classCallCheck(this, RapidMainCtrl);
};

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

var mod = angular.module('designsafe');
mod.requires.push('ui.router', 'ds.rapid.controllers', 'ds.rapid.services');

function config($stateProvider, $uibTooltipProvider, $urlRouterProvider, $locationProvider) {
  'ngInject';

  $locationProvider.html5Mode({
    enabled: true
  });

  $stateProvider.state('rapid', {
    url: '',
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
  RapidDataService.$inject = ["$http"];
  function RapidDataService($http) {
    'ngInject';

    _classCallCheck(this, RapidDataService);

    this.$http = $http;
  }

  _createClass(RapidDataService, [{
    key: 'get_events',
    value: function get_events(opts) {
      console.log(opts);
      $http.get('/rapid/events', opts).then(function (resp) {
        console.log(resp);
      });
    }
  }]);

  return RapidDataService;
}();

exports.default = RapidDataService;

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map