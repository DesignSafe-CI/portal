/**
 * Notification Badge Controller
 * @function
 * @param {Object} $rootScope
 * @param {Object} $scope
 * @param {Object} $filter
 * @param {Object} djangoUrl
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
    djangoUrl,
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
        $http.get(djangoUrl.reverse('designsafe_api:badge', []))
          .then((resp) => {
            $scope.data.unread = resp.data.unread;
          },
          (error) => {
            return this.$q.reject(error);
          });
      };

      $scope.count();

      $scope.init = function() {
          $rootScope.$on('notifications:read', $scope.count());
          $rootScope.$on('notifications:delete', function() { $scope.list(); });
      };
      $scope.init();
    }
