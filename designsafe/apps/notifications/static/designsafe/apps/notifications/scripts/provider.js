(function(){
    'use strict';

    function NotificationService($rootScope, logger, toastr) {
        var processors = {};

        function init(){
          logger.log('Connecting to local broadcast channels');
          $rootScope.$on('ds.wsBus:notify', processMessage);
          $rootScope.$on('ds.notify:default', processToastr);
        }

        function processDataBrowserMessage(e, msg){
          if (msg.type != 'FileSelection'){
            toastr.success(msg.msg);
          }
        }

        function processMessage(e, msg){
          processToastr(e, msg);
          if (typeof processors[msg.event_type] !== 'undefined' &&
              typeof processors[msg.event_type].process !== 'undefined' &&
              typeof processors[msg.event_type].process === 'function'){

              processors[msg.event_type].process(msg);
          } else {
            logger.warning('Process var is not a function for this event type. ', processors);
          }
        }

        function processToastr(e, msg){
          try{
            msg.extra = JSON.parse(msg.extra);
          }catch(error){
            logger.error('Message\'s extra is not JSON string. Error: ', error);
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
          if (typeof processors[msg.event_type] === 'undefined'){
            console.warning('No proessor for this type of event. ', msg);
            return;
          }
          var toastViewLink = processors[msg.event_type].renderLink(msg);
          if (typeof toastViewLink !== 'undefined'){
            toastMessage += '<a href="' + toastViewLink + '">View</a>';
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
        this.$get = ['$rootScope', 'logger', 'toastr', NotificationBusHelper];
        function NotificationBusHelper($rootScope, logger, toastr){
            return new NotificationService($rootScope, logger, toastr);
        }
    }

    angular.module('ds.notifications')
    .provider('NotificationService', NotificationServiceProvider);
})();
