
import $ from 'jquery';
import angular from 'angular';
import _ from 'underscore';

function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider) {
    WSBusServiceProvider.setUrl(
        (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
        window.location.hostname +
        (window.location.port ? ':' + window.location.port : '') +
        '/ws/websockets/?subscribe-broadcast&subscribe-user'
    );
}

var app = angular.module('designsafe');
app.requires.push('ds.wsBus', 'ds.notifications', 'toastr', 'ui.bootstrap');

app.config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', config]);

angular.module('designsafe').controller('NotificationListCtrl', ['$scope','$rootScope','NotificationService', function($scope,$rootScope,NotificationService) {
    $scope.data = {};
    $scope.showRawMessage = false;

    $scope.list = function(page=0){
    $scope.data.pagination = {'limit': 10}
    var params = {'limit': $scope.data.pagination.limit, page: page, 'eventTypes[]': ['interactive_session_ready', 'job']}

    NotificationService.list(params).then(function(resp) {
        $scope.data.pagination.show = false;
        $scope.data.pagination.page = resp.page;
        $scope.data.pagination.total = resp.total;
        $scope.data.notifications = resp.notifs;

        for (var i = 0; i < $scope.data.notifications.length; i++) {
            const notification = $scope.data.notifications[i];
            if (notification['event_type'] == 'job') {
                notification['action_link'] = `/workspace/history`;
            } else if (notification['event_type'] == 'data_depot') {
                notification['action_link'] = '/data/browser';
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


