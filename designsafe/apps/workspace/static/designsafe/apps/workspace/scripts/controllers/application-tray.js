(function(window, angular, $, _) {
  "use strict";
  angular.module('WorkspaceApp').controller('ApplicationTrayCtrl',
    ['$scope', '$rootScope', 'Apps', function($scope, $rootScope, Apps) {

      $scope.data = {};
      Apps.list().then(function(response) {
        $scope.data.apps = response.data;
      });

      $scope.$on('close-app', function(e, appId) {
        var app = _.findWhere($scope.data.apps, {'id':appId});
        if (app) {
          app._active = false;
        }
      });

      $scope.launchApp = function(app) {
        app._active = true;
        $rootScope.$broadcast('launch-app', app.id);
      };
    }]);

})(window, angular, jQuery, _);

// =======
//     $scope.launchApp = function(app) {
//       window.alert('GET ' + app._links.self.href);
//     };

//     // apps-list
//     $http(
//       {
//         method: 'GET',
//         url: 'apps-list',
//       }
//     ).success(function(resp) {
//         console.log('apps-list success');
//         console.log(resp);
//       }).error(function(resp) {
//         console.log('apps-list error ', resp);
//     });

//     // files-list
//     $http(
//       {
//         method: 'GET',
//         url: 'files-list',
//       }
//     ).success(function(resp) {
//         console.log('files-list success');
//         console.log(resp);
//       }).error(function(resp) {
//         console.log('files-list error ', resp);
//     });

//     // jobs list
//     $http(
//       {
//         method: 'GET',
//         url: 'jobs-list',
//       }
//     ).success(function(resp) {
//         console.log('jobs-list success');
//         console.log(resp);
//       }).error(function(resp) {
//        console.log('jobs-list error ', resp);
//     });

//     // jobs details
//     var data = {
//       'id': '4042824268683350501-242ac118-0001-007'
//     };
//     $http(
//       {
//         method: 'POST',
//         url: 'jobs-details/',
//         data: data
//       }
//     ).success(function(resp) {
//         console.log('jobs-details success');
//         console.log(resp);
//       }).error(function(resp) {
//         console.log('jobs-details error ', resp);
//     });


//   }]);

// })(window, angular, jQuery);
// >>>>>>> 9f2d958b2c936125ca226eddb76b0177bca7250e
