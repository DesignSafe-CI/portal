(function(){
    'use strict';
    function config(WSBusServiceProvider, $interpolateProvider, $httpProvider) {
        $interpolateProvider.startSymbol('[[').endSymbol(']]');
        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        WSBusServiceProvider.setUrl('wss://' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + '/ws/websockets?subscribe-broadcast');
    }

    angular.module('ds.dataApp',
        ['ds.api.data', 'ds.data', 'ds.userActivity', 'ds.wsBus'])
    .config(['WSBusServiceProvider', '$interpolateProvider', '$httpProvider', config]);
    angular.module('ds.dataApp')
    .run(['WSBusService', function init(WSBusService){
        WSBusService.init(WSBusService.url);
        console.log(WSBusService.url);
        //WSBusService.init(WSBusService.url);
    }]);
})();
