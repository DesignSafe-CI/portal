(function(angular) {
    "use strict";
    angular.module('WorkspaceApp').config(['$translateProvider', function($translateProvider) {
        $translateProvider.translations('en', {
            error_system_monitor: "The execution system for this app is currently unavailable. Your job submission may fail.",
            error_app_run: "Could not find appId provided",
            error_app_disabled: "The app you're trying to run is currently disabled. Please enable the app and try again",
            apps_metadata_name: "ds_apps",
            apps_metadata_list_name: "ds_apps_list"
        });
        $translateProvider.preferredLanguage('en');
    }]);
})(angular);
