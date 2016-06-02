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
    'django.context'
  ]);

  function config($httpProvider, $locationProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

    $locationProvider.html5Mode(true);
  }

  app.config(['$httpProvider', '$locationProvider', config]);

  app.controller('DataDepotBrowserCtrl', ['$scope', '$location', '$filter', 'Logging', 'Django',
    function($scope, $location, $filter, Logging, Django) {

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

      $scope.onPathChanged = function(listing) {
        var path = $filter('dsFileUrl')(listing);
        $location.state(angular.copy($scope.data));
        $location.path(path);
        if (listing.name == '$SEARCH') {
          $location.search('q', listing.query.q);
          $location.search('filters', listing.query.filters);
        }
      };

    }]);

})(window, angular, jQuery, _);
