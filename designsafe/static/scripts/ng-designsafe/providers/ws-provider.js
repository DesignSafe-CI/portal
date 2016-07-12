(function(){
    'use strict';
    function WSBusService(configURL, $rootScope, logger){
        var ws;
        var service = {
            init: init,
            ws: ws,
            url: configURL
        };

        return service;

        function init(url){
            ws = new WebSocket(url);
            logger.log('wss : ', ws)
            ws.onopen = function(){
                logger.log('websocket to data, connected');
            };
            ws.onmessage = function(e){
                var res = JSON.parse(e.data);
                logger.log('onmessage e', e)
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
