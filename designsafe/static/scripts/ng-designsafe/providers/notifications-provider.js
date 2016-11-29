(function(){
    'use strict';
    function NotificationService($rootScope, logger, toastr, djangoUrl) {
        var processors = {};

        // processors.job = {
        //   'process': function notifyProcessor(msg){
        //     logger.log('processing msg: ', msg);
        //     return msg.extra;
        //   },
        //   'renderLink': function renderLink(msg){
        //     logger.log('rendering link: ', msg);
        //     return msg.extra['target_path'] // this will only be present when indexing is complete
        //   }
        // };

        // processors.data = {
        //   'process': function notifyProcessor(msg){
        //     logger.log('processing msg: ', msg);
        //     return msg.extra;
        //   },
        //   'renderLink': function renderLink(msg){
        //     logger.log('rendering link: ', msg);
        //     if (msg.status == 'ERROR'){
        //       return;
        //     }
        //     return msg.extra;
        //   }
        // };

        function renderLink(msg){
          if (msg.status == 'SUCCESS') {
            if (msg.event_type == 'job') {
              var url=djangoUrl.reverse('designsafe_workspace:process_notification', {'pk': msg.pk});
              console.log('job url link', url)
              return url
            } else if (msg.event_type == 'data') {
              var url=djangoUrl.reverse('designsafe_api:process_notification', {'pk': msg.pk});
              // var url=djangoUrl.reverse('designsafe_api:process_notification');
              console.log('data url link', url)
              return url
            }
          }
        }

        function init(){
          logger.log('Connecting to local broadcast channels');
          $rootScope.$on('ds.wsBus:notify', processMessage);
          $rootScope.$on('ds.notify:default', processToastr);
        }

        function processMessage(e, msg){
          processToastr(e, msg);
          processors['notifs'].process(msg)

          if (typeof processors[msg.event_type] !== 'undefined' &&
              typeof processors[msg.event_type].process !== 'undefined' &&
              typeof processors[msg.event_type].process === 'function'){

              processors[msg.event_type].process(msg);

              // var notification_badge = angular.element( document.querySelector( '#notification_badge' ) );
              // notification_badge.removeClass('label-default')
              // notification_badge.addClass('label-info')

              // var numNotifications = notification_badge.html(); //is there a better way to do this? having trouble using scope variables
              // if (isNaN(numNotifications)) {
              //     notification_badge.html(1);
              // } else {
              //     notification_badge.html(Number(numNotifications) + 1);
              // }
          } else {
            logger.warn('Process var is not a function for this event type. ', processors);
          }
        }

        function processToastr(e, msg){
          try{
            // msg.extra = JSON.parse(msg.extra);
            msg.extra = (typeof msg.extra === 'string') ? JSON.parse(msg.extra) : msg.extra;
          }catch(error){
            logger.error('Message\'s extra is not JSON or JSON string. Error: ', error);
          }
          var toastLevel = msg.status.toLowerCase();
          //Convert operation name to title case.
          //Operation name might be something like 'copy_file', 'job_submission' or 'publish'
          var toastTitle = msg.operation.replace(/_/g, ' ').replace(/\w\S*/,
            function(s){
              return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
            });

          var toastMessage = '<p>' + msg.message + '</p>';
          var toastOp = toastr[toastLevel] || toast.info;
          // if (typeof processors[msg.event_type] === 'undefined'){
          //   logger.warn('No processor for this type of event. ', msg);
          //   return;
          // }
          var toastViewLink = renderLink(msg);
          if (typeof toastViewLink !== 'undefined'){
            toastMessage += '<a href="' + toastViewLink + '" target="_blank">View</a>';
          }
          toastOp(toastMessage, toastTitle, {allowHtml: true});
        }

      return {
        init: init,
        processors: processors
      };

    }

    function NotificationServiceProvider($injector){
        // var configURL = '';
        this.$get = ['$rootScope', 'logger', 'toastr', 'djangoUrl', NotificationBusHelper];
        function NotificationBusHelper($rootScope, logger, toastr, djangoUrl){
            return new NotificationService($rootScope, logger, toastr, djangoUrl);
        }
    }

    angular.module('ds.notifications').provider('NotificationService', NotificationServiceProvider);

})();
