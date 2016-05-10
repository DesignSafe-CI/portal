(function(window, angular, $) {
  "use strict";

  function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        WSBusServiceProvider.setUrl(
            (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
            window.location.hostname +
            (window.location.port ? ':' + window.location.port : '') +
            '/ws/websockets?subscribe-broadcast&subscribe-user'
        );
  }

  var app = angular.module('NotificationList', ['djng.urls','ds.wsBus', 'ds.notifications', 'logging']).config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', config]);


  angular.module('NotificationList').controller('NotificationListCtrl', ['$scope','$rootScope','notificationFactory', 'logger', function($scope,$rootScope,notificationFactory, logger) {
      $scope.data = {};
      $scope.showRawMessage = false;
      $scope.data.notifications = [];

      $scope.list = function(){
        notificationFactory.list().then(function(resp) {
            $scope.data.notifications = resp.data

            for (var i=0; i < $scope.data.notifications.length; i++){
              $scope.data.notifications[i]['fields']['body'] = angular.fromJson($scope.data.notifications[i]['fields']['body']);
              $scope.data.notifications[i]['fields']['notification_time'] = Date.parse($scope.data.notifications[i]['fields']['notification_time']);
            }
            logger.log($scope.data.notifications)
        })
      };
      $scope.list();

      $scope.delete = function(pk){
        notificationFactory.delete(pk).then(function(resp) {
          $scope.list();
        })
      }
  }]);

})(window, angular, jQuery);
