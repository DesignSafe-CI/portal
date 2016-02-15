(function(){
    'use strict';
    function NotificationService($rootScope){
        var service = {
            init: init,
        };

        return service;

        function init(){
            $rootScope.$on('ds.wsBus:default', processMessage);
            console.log('notifications provider initiated')
        }

        function processMessage(e, msg){
            //var rScope = $injector.get('$rootScope');
            console.log('websockets msg', msg);
            if (msg.body.status == 'FINISHED' || msg.body.status == 'FAILED') {
                var notification_badge = angular.element( document.querySelector( '#notification_badge' ) );
                notification_badge.removeClass('label-default')
                notification_badge.addClass('label-info')

                var numNotifications = notification_badge.html();
                if (isNaN(numNotifications)) {
                    notification_badge.html(1);
                } else {
                    notification_badge.html(Number(numNotifications) + 1);
                }
            }
        }
    }

    function NotificationServiceProvider($injector){
        // var configURL = '';
        this.$get = ['$rootScope', NotificationBusHelper];

        // this.setUrl = function setUrl(url){
            // configURL = url;
        // };
        function NotificationBusHelper($rootScope){
            return new NotificationService($rootScope);
        }
    }

    angular.module('ds.notifications')
    .provider('NotificationService', NotificationServiceProvider);
})();
