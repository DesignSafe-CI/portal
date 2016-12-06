(function(window, angular, $) {
  "use strict";

  function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider) {
        WSBusServiceProvider.setUrl(
            (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
            window.location.hostname +
            (window.location.port ? ':' + window.location.port : '') +
            '/ws/websockets?subscribe-broadcast&subscribe-user'
        );
  }

  var app = angular.module('designsafe');
  app.requires.push('djng.urls','ds.wsBus', 'ds.notifications', 'logging', 'toastr');

  app.config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', config]);
  
  angular.module('designsafe').controller('NotificationListCtrl', ['$scope','$rootScope','notificationFactory', 'Logging', function($scope,$rootScope,notificationFactory, Logging) {
      $scope.data = {};
      $scope.showRawMessage = false;
      $scope.data.notifications = [];
      var logger = Logging.getLogger('DesignSafe.notifications');

      $scope.list = function(){
        notificationFactory.list().then(function(resp) {
            $scope.data.notifications = resp.data;

            for (var i=0; i < $scope.data.notifications.length; i++){
              $scope.data.notifications[i]['fields']['body'] = angular.fromJson($scope.data.notifications[i]['fields']['body']);
              $scope.data.notifications[i]['fields']['extra'] = angular.fromJson($scope.data.notifications[i]['fields']['extra']);
              $scope.data.notifications[i]['fields']['notification_time'] = Date.parse($scope.data.notifications[i]['fields']['notification_time']);
            }
        });
      };
      $scope.list();

      $scope.delete = function(pk){
        notificationFactory.delete(pk).then(function(resp) {
          $scope.list();
        });
      };
  }]);

})(window, angular, jQuery);
