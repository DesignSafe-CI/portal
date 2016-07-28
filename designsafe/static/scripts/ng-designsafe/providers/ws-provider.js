(function(){
    'use strict';
    function WSBusService(configURL, $rootScope, logger){
        var ws;
        var service = {
            init: init,
            ws: ws,
            url: configURL,

        };

        return service;

        function init(url){
            ws = new WebSocket(url);
            logger.log('wss : ', ws);
            ws.onopen = function(){
                logger.log('websocket to data, connected');
            };
            ws.onmessage = function(e){
                var res = JSON.parse(e.data);
                //logger.log('onmessage e', e);
                processWSMessage(res);
            };
            ws.onerror = function(e){
                logger.log('WS error: ', e);
            };
            ws.onclose = function(e){
                logger.log('connection closed; reopening');
                init(url);
            };
            service.ws = ws;
        }

        function processWSMessage(msg){
            try{
              msg.extra = JSON.parse(msg.extra);
            }catch(e){
              logger.log('Message\'s extra is not JSON string. Error: ', e);
            }
            var toast = {};
            toast.level = msg.status.toLowerCase();
            //Convert operation name to title case. 
            //Operation name might be something like 'copy_file', 'job_submission' or 'publish'
            toast.title = msg.operation.replace('_', ' ').replace(/\w\S*/, 
                                    function(s){
                                      return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
                                    });
            toast.message = msg.message;
            msg._toast = toast;
            logger.log('broadcasting message to $rootScope: ', msg);
            $rootScope.$broadcast('ds.wsBus:default', msg);
        }
    }

    function WSBusServiceProvider($injector){
        var configURL = '';
        this.$get = ['$rootScope', 'logger', wsBusHelper];

        this.setUrl = function setUrl(url){
            configURL = url;
        };
        function wsBusHelper($rootScope, logger){
            return new WSBusService(configURL, $rootScope, logger);
        }
    }

    angular.module('ds.wsBus')
    .provider('WSBusService', WSBusServiceProvider);
})();
