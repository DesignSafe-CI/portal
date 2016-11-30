(function(){
    'use strict';

    function NotificationService($rootScope, logger, toastr) {
        var processors = {};

        function init(){
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
          var proc = processors[msg.type].process();
          proc(msg);
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
          var toastViewLinkFunc = processors[msg.type].renderLink();
          var toastViewLink = null;
          if (typeof toastViewLink !== 'undefined'){
            toastViewLink = toastViewLinkFunc(msg);
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
        this.$get = ['$rootScope', 'Logging', 'toastr', 'toastrConfig', NotificationBusHelper];

        // this.setUrl = function setUrl(url){
            // configURL = url;
        // };
        function NotificationBusHelper($rootScope, Logging, toastr){
            return new NotificationService($rootScope, Logging, toastr);
        }
    }

    angular.module('ds.notifications')
    .provider('NotificationService', NotificationServiceProvider);
})();
