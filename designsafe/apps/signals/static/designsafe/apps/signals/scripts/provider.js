(function(){
    'use strict';
    function WSBusService(configURL, $rootScope){
        var ws;
        var service = {
            init: init,
            ws: ws,
            url: configURL
        };

        return service;

        function init(url){
            ws = new WebSocket(url);
            console.log('wss : ', ws)
            ws.onopen = function(){
                console.log('websocket to data, connected');
            };
            ws.onmessage = function(e){
                var res = JSON.parse(e.data);
                console.log('onmessage e', e)
                processWSMessage(res);
            };
            ws.onerror = function(e){
                console.log('WS error: ', e);
            };
            ws.onclose = function(e){
                console.log('connection closed; reopening');
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
        this.$get = ['$rootScope', wsBusHelper];

        this.setUrl = function setUrl(url){
            configURL = url;
        };
        function wsBusHelper($rootScope){
            return new WSBusService(configURL, $rootScope);
        }
    }

    angular.module('ds.wsBus')
    .provider('WSBusService', WSBusServiceProvider);
})();
