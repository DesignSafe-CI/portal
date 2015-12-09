(function(){
    'use strict';
    function WSBusService(configURL, $rootScope, $cookies){
        var ws;
        var service = {
            init: init,
            ws: ws,
            url: configURL
        };

        return service;

        function init(url){
            //var ws = new WebSocket('/ws/data?subscribe-broadcast');
            ws = new WebSocket(url);
            ws.onopen = function(){
                console.log('websocket to data, connected');
            };
            ws.onmessage = function(e){
                var res = JSON.parse(e.data);
                processWSMessage(res);
            };
            ws.onerror = function(e){
                console.log('WS error: ', e);
            };
            ws.onclose = function(e){
                console.log('connection closed');
            };
            service.ws = ws;
        }

        function processWSMessage(msg){
            //var rScope = $injector.get('$rootScope');
            $rootScope.$broadcast('ds.wsBus:default', msg);
        }
    }

    function WSBusServiceProvider($injector){
        var configURL = '';
        this.$get = ['$rootScope', '$cookies', wsBusHelper];

        this.setUrl = function setUrl(url){
            configURL = url;
        };
        function wsBusHelper($rootScope, $cookies){
            return new WSBusService(configURL, $rootScope, $cookies);
        }
    }

    angular.module('ds.wsBus')
    .provider('WSBusService', WSBusServiceProvider);
})();
