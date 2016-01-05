(function(window, angular, $) {
  "use strict";
  angular.module('WorkspaceApp').controller('ApplicationTrayCtrl', ['$scope', '$http', 'Apps', function($scope, $http, Apps) {

    $scope.data = {};
    $scope.data.apps = Apps.list();

    $scope.launchApp = function(app) {
      window.alert('GET ' + app._links.self.href);
    };

    // apps-list
    $http(
      {
        method: 'GET',
        url: 'apps-list',
      }
    ).success(function(resp) {
        console.log('apps-list success');
        console.log(resp);
      }).error(function(resp) {
        console.log('apps-list error ', resp);
    });

    // files-list
    $http(
      {
        method: 'GET',
        url: 'files-list',
      }
    ).success(function(resp) {
        console.log('files-list success');
        console.log(resp);
      }).error(function(resp) {
        console.log('files-list error ', resp);
    });

    // jobs list
    $http(
      {
        method: 'GET',
        url: 'jobs-list',
      }
    ).success(function(resp) {
        console.log('jobs-list success');
        console.log(resp);
      }).error(function(resp) {
       console.log('jobs-list error ', resp);
    });

    // jobs details
    var data = {
      'id': '4042824268683350501-242ac118-0001-007'
    };
    $http(
      {
        method: 'POST',
        url: 'jobs-details/',
        data: data
      }
    ).success(function(resp) {
        console.log('jobs-details success');
        console.log(resp);
      }).error(function(resp) {
        console.log('jobs-details error ', resp);
    });


  }]);

})(window, angular, jQuery);
