(function(){
    'use strict';
    function WSBusService(configURL, $rootScope){
        var ws;
        var service = {
            init: init,
            ws: ws,
            url: configURL,
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
                processWSMessage(res.event, res.data);
            };
            ws.onerror = function(e){
                console.log('WS error: ', e);
            };
            ws.onclose = function(e){
                console.log('connection closed');
            };
            console.log('WSBusController initialized');
        }

        function processWSMessage(event, data){
            //var rScope = $injector.get('$rootScope');
            $rootScope.$broadcast('ds.wsBus:default', {event: event, data:data});
        }
    }

    function WSBusServiceProvider($injector){
        var configURL = '';
        this.$get = ['$rootScope', wsBusHelper];

        this.setUrl = function setUrl(url){
            console.log('setting url', url);
            configURL = url;
        };

        function wsBusHelper($rootScope){
            return new WSBusService(configURL, $rootScope);
        }
    }

    angular.module('ds.wsBus')
    .provider('WSBusService', WSBusServiceProvider);
})();
