(function(){
  'use strict';
  function WSBusService(configURL, $rootScope, logger){
    var ws;

    function init(url){
      ws = new WebSocket(url);
      ws.onopen = function(){

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
        init(url);
      };
      service.ws = ws;
    }

    function processWSMessage(msg){
      $rootScope.$broadcast('ds.wsBus:notify', msg);
    }

    var service = {
      init: init,
      ws: ws,
      url: configURL
    };

    return service;
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