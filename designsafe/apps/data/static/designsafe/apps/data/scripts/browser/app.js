/**
 * Created by mrhanlon on 4/28/16.
 */
(function(window, angular, $, _) {
  "use strict";

  var app = angular.module('DataDepotBrowser', [
    'ngCookies',
    'djng.urls',
    'ui.bootstrap',
    'ng.designsafe',
    'django.context',
    'toastr'
  ]);

  app.config(['$httpProvider', '$locationProvider', 'toastrConfig',
    function config($httpProvider, $locationProvider, toastrConfig) {
      $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
      $httpProvider.defaults.xsrfCookieName = 'csrftoken';
      $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

      $locationProvider.html5Mode(true);

      angular.extend(toastrConfig, {
        positionClass: 'toast-bottom-left'
      });
    }
  ]);

  app.controller('DataDepotBrowserCtrl', ['$scope', '$location', '$filter', 'toastr', 'Logging', 'Django',
    function($scope, $location, $filter, toastr, Logging, Django) {

      var logger = Logging.getLogger('DataDepotBrowser.DataDepotBrowserCtrl');

      $scope.data = {
        user: Django.user,
        currentSource: Django.context.currentSource,
        sources: Django.context.sources,
        listing: Django.context.listing
      };

      /* initialize HTML5 history state */
      $location.state(angular.copy($scope.data));
      $location.replace();

      $scope.$on('$locationChangeSuccess', function ($event, newUrl, oldUrl, newState) {
        if (newUrl !== oldUrl) {
          _.extend($scope.data, newState);
        }
      });

      $scope.$on('designsafe:notify', function ($event, data) {
        console.log($event, data);
        var level = data.level || 'info';
        var toastop = toastr[level] || toastr.info;
        toastop(data.message, data.title, data.opts);
      });

      $scope.onPathChanged = function(listing) {
        var path = $filter('dsFileUrl')(listing);
        $location.state(angular.copy($scope.data));
        $location.path(path);
      };

    }]);

})(window, angular, jQuery, _);
