/**
 * Created by mrhanlon on 4/28/16.
 */
export const notifications = function(window, angular, $) {
  "use strict";

  var app = angular.module('designsafe');
  app.requires.push(
    'ngCookies',
    'djng.urls',  //TODO: djng
    'ui.bootstrap',
    'ds.notifications',
    'django.context',
    'toastr',
    'ds.wsBus',
    'logging',
    'ngMaterial'
  );

  app.config(['WSBusServiceProvider', '$httpProvider', 'toastrConfig',
    function config(WSBusServiceProvider, $httpProvider, toastrConfig) {
      /*
       * https://github.com/Foxandxss/angular-toastr#toastr-customization
       */
      angular.extend(toastrConfig, {
        positionClass: 'toast-bottom-left',
        timeOut: 20000
      });

      WSBusServiceProvider.setUrl(
        (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
        window.location.hostname +
        (window.location.port ? ':' + window.location.port : '') +
        '/ws/websockets?subscribe-broadcast&subscribe-user'
      );
    }
  ]);

  app.run(['WSBusService', 'logger',
                function init(WSBusService, logger){
    WSBusService.init(WSBusService.url);
  }]);
  app.run(['NotificationService', 'logger',
                function init(NotificationService, logger){
    NotificationService.init();
  }]);
  
  app.controller('NotificationBadgeCtrl',
    ['$rootScope', '$scope', '$filter', 'djangoUrl', 'Logging', 'Django', 'NotificationService', '$http', 'logger',
    function($rootScope, $scope, $filter, djangoUrl, Logging, Django, NotificationService, $http, logger) {

      NotificationService.processors.notifs = {
        'process': function notifyProcessor(msg){
          if (angular.element('#notification-container').hasClass('open')) {
            $scope.list();
          } else {
            $scope.data.unread++;
          }
          $scope.$apply();
          return;
        },
      };

      $scope.list = function() {
        NotificationService.list().then(function(resp) {
          $scope.data.notifications = resp.notifs;
          if (angular.element('#notification-container').hasClass('open')) {
            $scope.data.unread = 0;
          }

          for (var i=0; i < $scope.data.notifications.length; i++){
            if ($scope.data.notifications[i]['event_type'] == 'job') {
              $scope.data.notifications[i]['action_link']=djangoUrl.reverse('designsafe_workspace:process_notification', {'pk': $scope.data.notifications[i]['pk']});
            } else if ($scope.data.notifications[i]['event_type'] == 'data_depot') {
              $scope.data.notifications[i]['action_link']=djangoUrl.reverse('designsafe_api:process_notification', {'pk': $scope.data.notifications[i]['pk']});
            }
          }
        });
      };

      $scope.delete = function(pk){
        NotificationService.delete(pk).then(function(resp) {
          $scope.list();
        });
      };

      $scope.data = {
        'notificationsurl': djangoUrl.reverse('designsafe_notifications:index', [])
      };

      $scope.count = function() {
        $http.get(djangoUrl.reverse('designsafe_api:badge', [])).then(
          function(resp) {
            $scope.data.unread = resp.data.unread;
          });
      };

      $scope.count();

      $scope.init = function() {
          $rootScope.$on('notifications:read', $scope.count());
          $rootScope.$on('notifications:delete', function() { $scope.list(); });
      };
      $scope.init();
    }]);

  }