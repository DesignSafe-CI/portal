(function(angular) {
    "use strict";
    angular.module('WorkspaceApp').config(['$translateProvider', function($translateProvider) {
        $translateProvider.translations('en', {
            error_system_monitor: "The execution system for this app is currently unavailable. Your job submission may fail.",
        });
        $translateProvider.preferredLanguage('en');
    }]);
})(angular);
