(function(){
    'use strict';
    function WSBusController($rootScope){
        var busVM = this;
        busVM.ws = {};
        busVM.messages = [];
        
        function init(){
            var ws = new WebSocket('/ws/data?subscribe-broadcast');
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
            busVM.ws = ws;
            $rootScope.$on('ds.wsBus:default', processLocalMessage);
        }

        function processLocalMessage(event, data){
            busVM.messages.push({
                    event: event,
                    data: data
                });
        }

        function processWSMessage(event, data){
            var m, broadcast = true;
            for(var i = 0; i < busVM.messages.length; i++){
                m = busVM.messages[i];
                if (m.event === event && m.data === data){
                    broadcast = false;
                    busVM.messages = busVM.messages.splice(i, 1);
                    break;
                }
            }
            if(broadcast){
                $rootScope.$broadcast('ds.wsBus:' + event, data);
            }
        }
    }

    angular.module('ds.wsBus')
    .controller('WSBusController',
        ['$rootScope']);
})();
