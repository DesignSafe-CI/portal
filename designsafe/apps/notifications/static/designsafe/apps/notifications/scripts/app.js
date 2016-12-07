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

  angular.module('designsafe').controller('NotificationListCtrl', ['$scope','$rootScope','notificationFactory', 'Logging', 'djangoUrl', function($scope,$rootScope,notificationFactory,Logging, djangoUrl) {
      $scope.data = {};
      $scope.showRawMessage = false;
      $scope.data.notifications = [];
      var logger = Logging.getLogger('DesignSafe.notifications');

      $scope.list = function(){
        notificationFactory.list().then(function(resp) {
            $scope.data.notifications = resp.data;

            for (var i=0; i < $scope.data.notifications.length; i++){
              $scope.data.notifications[i] = angular.fromJson($scope.data.notifications[i]);
              // $scope.data.notifications[i]['fields']['extra'] = angular.fromJson($scope.data.notifications[i]['fields']['extra']);
              $scope.data.notifications[i]['datetime'] = Date($scope.data.notifications[i]['datetime']);

              if ($scope.data.notifications[i]['event_type'] == 'job') {
                $scope.data.notifications[i]['action_link']=djangoUrl.reverse('designsafe_workspace:process_notification', {'pk': $scope.data.notifications[i]['pk']});
              } else if ($scope.data.notifications[i]['event_type'] == 'data') {
                $scope.data.notifications[i]['action_link']=djangoUrl.reverse('designsafe_api:process_notification', {'pk': $scope.data.notifications[i]['pk']});
              }
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
