(function(window, angular, $) {
    'use strict';

    function config($interpolateProvider, $httpProvider) {
        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    }
    'ngInject';
    var app = angular.module('logging', []).config(config);

    function noop() {}

    var noopConsole = {
        log: noop,
        info: noop,
        warn: noop,
        error: noop,
        trace: noop,
        dir: noop
    };


    function LoggingService(){
        var service = {};
        var debug = !!(window.console && window.debug);

        // service.log = function(msg, level) {
        //   var level = level || 'info'
        //   if (debug) {
        //     console.log(level, ': ', msg);
        //   }
        // };

        // service.error = function(msg){
        //   service.log(msg, 'error')
        // };

        if (!debug) return noopConsole;

        for (var key in window.console) {
            if (typeof window.console[key] !== 'function') continue;
            service[key] = window.console[key].bind(window.console);
        }

        return service;
    }

    function LoggingServiceProvider($injector){
        this.$get = [LoggingService];
    }

    angular.module('logging')
        .provider('logger', LoggingServiceProvider);


})(window, angular, jQuery);
