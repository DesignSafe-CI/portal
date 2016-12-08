/**
 * Created by mrhanlon on 4/28/16.
 */
(function(window, angular, $) {
  "use strict";

  var app = angular.module('designsafe');
  app.requires.push(
    'ngCookies',
    'djng.urls',
    'ui.bootstrap',
    'ds.notifications',
    'django.context',
    'toastr',
    'ds.wsBus'
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
    ['$rootScope', '$scope', '$filter', 'djangoUrl', 'Logging', 'Django', 'NotificationService', '$http',
    function($rootScope, $scope, $filter, djangoUrl, Logging, Django, NotificationService, $http) {

      // var logger = Logging.getLogger('DataDepotBrowser.DataDepotBrowserCtrl');

      NotificationService.processors.notifs = {
        'process': function notifyProcessor(msg){
          $scope.data.unread++;
          $scope.$apply();
          return;
        },

      };

      $scope.data = {
        'notificationsurl': djangoUrl.reverse('designsafe_notifications:index', [])
      };
      // $scope.init = function() {

      // }

      $scope.count = function() {
        $http.get(djangoUrl.reverse('designsafe_api:badge', [])).then(
          function(resp) {
            $scope.data.unread = resp.data.unread
          });
      };

      $scope.count()

    }]);

})(window, angular, jQuery);
