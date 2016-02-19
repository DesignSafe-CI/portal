(function(window, angular, $) {
  "use strict";

  function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        // WSBusServiceProvider.setUrl(
        //     (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
        //     window.location.hostname +
        //     (window.location.port ? ':' + window.location.port : '') +
        //     '/ws/websockets?subscribe-broadcast&subscribe-user'
        // );
  }

  var app = angular.module('NotificationList', ['ng.django.urls',]);//.config(['$interpolateProvider', '$httpProvider', config]);


  angular.module('NotificationList').controller('NotificationListCtrl', ['$scope','$rootScope','notificationFactory', function($scope,$rootScope,notificationFactory) {
  // angular.module('NotificationList').controller('NotificationListCtrl', ['$scope','$rootScope', function($scope,$rootScope) {
      $scope.message ='testing this out';
      $scope.data = {};

      $scope.list = function(){
          notificationFactory.list().then(function(resp) {
              $scope.data.notifications = resp.data
              // console.log('$scope.data.notifications', $scope.data.notifications)
              //how to parse (JSON.parse(x)?) body for each notification?
              for (var i=0; i < $scope.data.notifications.length; i++){
                $scope.data.notifications[i]['fields']['body'] = angular.fromJson($scope.data.notifications[i]['fields']['body']);
              }
              console.log($scope.data.notifications)
          })
      };

      $scope.list();

  }]);

})(window, angular, jQuery);
