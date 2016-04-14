(function(){
    'use strict';
    function NotificationService($rootScope, logger, toastr){
        var service = {
            init: init,
        };

        return service;

        function init(){
            $rootScope.$on('ds.wsBus:default', processMessage);
            toastr.info('should log the toast once this closes', 'Notification testcallback',
                {
                    closeButton: true,
                    closeHtml: '<button onclick="alert(\'js in the closehtml!\')">close</button>',
                    // closeHtml: '<a onclick="alert(\'js in the closehtml!\')">close link</a>',
                    onHidden: function callback(clicked, toast){
                        logger.log('clicked', clicked)
                        logger.log('toast', toast)
                    },
                    timeOut: 500000,
                    extendedTimeOut: 1000000,
                    tapToDismiss: false
            });
        }

        function processMessage(e, msg){
            //var rScope = $injector.get('$rootScope');
            logger.log('websockets msg', msg);
            if (msg.toast) {
                if(msg.action_link) {
                    toastr.info(msg.toast.msg,
                    {
                        closeButton: true,
                        closeHtml: '<a target="_blank" href="' + msg.action_link.value + '">' + msg.action_link.label + '</a>',
                        onHidden: function undo(clicked, toast){
                            logger.log('clicked', clicked)
                            logger.log('toast', toast)

                        }
                    });
                } else {
                    toastr.info(msg.toast.msg);
                }
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
