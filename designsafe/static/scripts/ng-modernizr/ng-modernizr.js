(function(window, angular) {
    'ngInject';
    var mod = angular.module('ng.modernizr', []);
    mod.provider('Modernizr', function() {
        this.$get = function() {
            return window.Modernizr || {};
        };
    });
})(window, angular);
