(function(){
    'use strict';
    function NotificationService($rootScope, logger, toastr){
        var service = {
            init: init,
        };

        return service;

        function init(){
            $rootScope.$on('ds.wsBus:default', processMessage);
            toastr.info('will this work', 'Notification testcallback',
                {
                    closeButton: true,
                    closeHtml: '<button>undo</button>',
                    onHidden: function undo(clicked, toast){
                        console.log('clicked', clicked)
                        console.log('toast', toast)

                    }
            });
        }

        function processMessage(e, msg){
            //var rScope = $injector.get('$rootScope');
            logger.log('websockets msg', msg);
            if (msg.toastrType) {
                toastr.info(msg.status, 'Notification testcallback')
            }
            if (msg.status == 'FINISHED' || msg.status == 'FAILED') {
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
        this.$get = ['$rootScope', 'logger', 'toastr', NotificationBusHelper];

        // this.setUrl = function setUrl(url){
            // configURL = url;
        // };
        function NotificationBusHelper($rootScope, logger, toastr){
            return new NotificationService($rootScope, logger, toastr);
        }
    }

    angular.module('ds.notifications')
    .provider('NotificationService', NotificationServiceProvider);
})();
