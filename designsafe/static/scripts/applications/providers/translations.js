export function appTranslateProvider(angular) {
    'ngInject';
    "use strict";
    angular.module('designsafe').config(['$translateProvider', function($translateProvider) {
        $translateProvider.translations('en', {
            error_app_create: "An error ocurred creating your app - ",
            error_app_delete: "An error ocurred deleting your app - ",
            error_app_delete_permissions: "User does not have permissions to delete public app",
            error_app_view: "Could not get app with the given id",
            error_app_clone: "An error ocurred while trying to clone - ",
            error_app_edit: "An error ocurred while trying to edit - ",
            error_app_edit_permissions: "User does not have permissions to edit app",
            error_app_exists: "An app with this name and version already exists. Please change name or version",
            error_app_meta: "An error ocurred getting the app",
            error_app_permissions: "An error ocurred getting app permissions - ",
            error_app_permissions_update: "An error ocurred updating app permissions - ",
            error_app_publish: "An error ocurred publishing your app - ",
            error_app_publish_permission: "An error ocurred publishing your app - User does not have permissions to publish apps",
            error_app_system_roles: "An error ocurred getting your app system permissions - ",
            error_app_update: "An error ocurred updating your app - ",
            error_form_invalid: "Form is invalid. Please check all required fields",
            error_form_codemirror: "JSON parsing error. Make sure your form has valid JSON",
            error_tab_get: "An error ocurred getting your app tray - ",
            error_tab_add: "An error ocurred adding your tray",
            error_tab_delete: "An error ocurred deleting your tray",
            error_tab_edit: "An error ocurred editing your app tray",

            storage_default: "designsafe.storage.default",
            execution_default: "designsafe.community.exec.stampede",
            admin_username: 'ds_admin',
            apps_metadata_custom: "html",
            apps_metadata_name: "ds_apps",
            apps_metadata_list_name: "ds_apps_list",
            apps_sync_error: "An error ocurred updating apps",
            apps_sync_success: "Successfully updated ",
            apps_sync_todate: "All Apps are up to date",


        });
        $translateProvider.preferredLanguage('en');
        $translateProvider.useSanitizeValueStrategy('escape');
    }]);
}
