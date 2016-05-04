/**
 * Created by mrhanlon on 4/28/16.
 */
(function(window, angular, $, _) {
  "use strict";

  var app = angular.module('DataDepotBrowser', [
    'ngCookies',
    'ng.django.urls',
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
  
  app.controller('DataDepotBrowserCtrl', ['$scope', '$location', 'Logging', 'Django', function($scope, $location, Logging, Django) {
    
    var logger = Logging.getLogger('DataDepotBrowser.DataDepotBrowserCtrl');
    
    $scope.onPathChanged = function(listing) {
      var path = [$scope.data.resource, listing.path];
      if (! (listing.source === 'box' && listing.id === 'folder/0')) {
        path.push(listing.name);
      }
      path = _.compact(path);  // remove any empty path components; some resource roots have these
      if (listing.type === 'folder') {
        path.push('');
      }
      $location.path(path.join('/'));
    };

    $scope.newFileEnabled = function() {
      return false;
    };
    
    $scope.data = {
      resource: Django.context.resource,
      listing: Django.context.listing
    };
    
  }]);

})(window, angular, jQuery, _);
