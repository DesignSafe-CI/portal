(function(){
    'use strict';
    function WSBusService(){
        var ws;
        var service = {
            init: init,
            ws: ws,
            url: url,
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
                cnosole.log('Received: ', res);
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

        function processWSMesage(event, data){
            $rootScope.$broadcast('ds.wsBus:default', {event: event, data:data});
        }
    }

//    angular.module('ds.wsBus')
//    .service('WSBusService', 
//        ['$rootScope', WSBusService]);
})();
