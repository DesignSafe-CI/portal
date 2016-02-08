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
            //var ws = new WebSocket('/ws/data?subscribe-broadcast');
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
                console.log('connection closed');
            };
            service.ws = ws;
        }

        function processWSMessage(msg){
            //var rScope = $injector.get('$rootScope');
            // console.log('websockets msg', msg);
            var notification_badge = angular.element( document.querySelector( '#notification_badge' ) );
            notification_badge.removeClass('label-default')
            notification_badge.addClass('label-info')
            console.log('notification_badge', notification_badge.html());
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
