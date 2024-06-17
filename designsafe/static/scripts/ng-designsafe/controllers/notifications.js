/**
 * Notification Badge Controller
 * @function
 * @param {Object} $rootScope
 * @param {Object} $scope
 * @param {Object} $filter
 * @param {Object} Logging
 * @param {Object} Django
 * @param {Object} NotificationService
 * @param {Object} $http
 * @param {Object} logger
 */
export function NotificationBadgeCtrl(
    $rootScope,
    $scope,
    $filter,
    Logging,
    Django,
    NotificationService,
    $http,
    logger
) {
    'ngInject';
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

          for (var i = 0; i < $scope.data.notifications.length; i++) {
              const notification = $scope.data.notifications[i];
              if (notification['event_type'] == 'job') {
                  notification['action_link'] = `/rw/workspace/history`;
              } else if (notification['event_type'] == 'data_depot') {
                  notification['action_link'] = `/data/browser`;
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
        'notificationsurl': '/notifications'
      };

      $scope.count = function() {
        $http.get('/api/notifications/badge/').then(
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
    }
