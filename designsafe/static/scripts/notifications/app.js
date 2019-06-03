
import $ from 'jquery';
import angular from 'angular';
import _ from 'underscore';

function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider) {
    WSBusServiceProvider.setUrl(
        (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
        window.location.hostname +
        (window.location.port ? ':' + window.location.port : '') +
        '/ws/websockets?subscribe-broadcast&subscribe-user'
    );
}

var app = angular.module('designsafe');
app.requires.push('djng.urls','ds.wsBus', 'ds.notifications', 'logging', 'toastr', 'ui.bootstrap');   //TODO: djng

app.config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', config]);

angular.module('designsafe').controller('NotificationListCtrl', ['$scope','$rootScope','NotificationService', 'djangoUrl', function($scope,$rootScope,NotificationService, djangoUrl) {
    $scope.data = {};
    $scope.showRawMessage = false;

    $scope.list = function(page=0){
    $scope.data.pagination = {'limit': 10}
    var params = {'limit': $scope.data.pagination.limit, page: page}

    NotificationService.list(params).then(function(resp) {
        $scope.data.pagination.show = false;
        $scope.data.pagination.page = resp.page;
        $scope.data.pagination.total = resp.total;
        $scope.data.notifications = resp.notifs;

        for (var i=0; i < $scope.data.notifications.length; i++){
            // $scope.data.notifications[i] = angular.fromJson($scope.data.notifications[i]);
            // $scope.data.notifications[i]['fields']['extra'] = angular.fromJson($scope.data.notifications[i]['fields']['extra']);
            // $scope.data.notifications[i]['datetime'] = Date($scope.data.notifications[i]['datetime']);

            if ($scope.data.notifications[i]['event_type'] == 'job') {
            $scope.data.notifications[i]['action_link']=djangoUrl.reverse('designsafe_workspace:process_notification', {'pk': $scope.data.notifications[i]['pk']});
            } else if ($scope.data.notifications[i]['event_type'] == 'data_depot') {
            $scope.data.notifications[i]['action_link']=djangoUrl.reverse('designsafe_api:process_notification', {'pk': $scope.data.notifications[i]['pk']});
            }
        }

        if ($scope.data.pagination.total > 0) {
            var offset = $scope.data.pagination.page * $scope.data.pagination.limit;
            $scope.data.pagination.item_start = offset + 1;
            if (offset + $scope.data.pagination.limit > $scope.data.pagination.total) {
                $scope.data.pagination.item_end = $scope.data.pagination.total;
            } else {
                $scope.data.pagination.item_end = offset + $scope.data.pagination.limit;
            }
        }
        if ($scope.data.pagination.total > $scope.data.pagination.limit) {
            $scope.data.pagination.show = true;
            $scope.data.pagination.current = $scope.data.pagination.page + 1;
        }

        $rootScope.$emit('notifications:read', 'all');
    });
    };
    $scope.list();

    $scope.delete = function(pk){
    NotificationService.delete(pk).then(function(resp) {
        $scope.list();
        $rootScope.$emit('notifications:delete');
    });
    };

    $scope.pageChanged = function() {
        var load_page = $scope.data.pagination.current - 1;
        $scope.list(load_page)
            // .then(function() {
            //     /* scroll to top of listing */
            //     $anchorScroll('directory-contents');

            //      update $location
            //     $location
            //         .state(angular.copy($scope.model))
            //         .search('page', load_page);
            // });
    };
}]);


