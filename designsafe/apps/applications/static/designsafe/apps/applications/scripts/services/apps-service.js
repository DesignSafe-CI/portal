(function(window, angular, $, _) {
  "use strict";
  angular.module('designsafe').factory('Apps', ['$http', '$q', '$translate', 'djangoUrl', function($http, $q, $translate, djangoUrl) {

    var service = {};

    var default_list_opts = {
      publicOnly: false
    };

    service.list = function(query) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
        method: 'GET',
        params: {'q': query},
        cache: true
      });
    };

    service.getApps = function(app_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
        method: 'GET'
      });
    };

    service.get = function(app_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
        method: 'GET',
        params: {'appId': app_id}
      });
    };

    service.getPermissions = function(app_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
        method: 'GET',
        params: {'appId': app_id, 'pems': true}
      });
    };

    service.getMeta = function(app_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
        method: 'GET',
        params: {q:{'name': $translate.instant('apps_metadata_name'),'value.definition.id': app_id}}
      });
    };

    service.getMetaPems = function(uuid) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
        method: 'GET',
        params: {'uuid': uuid, 'pems': true}
      });
    };

    service.createApp = function(body) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
        method: 'POST',
        data: body
      });
    };

    service.createMeta = function(body) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
        method: 'POST',
        data: body
      });
    };

    service.updateMeta = function(body, uuid) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
        method: 'POST',
        data: body,
        params: {'uuid': uuid},
      });
    };

    service.updateMetaPermissions = function(permission, uuid) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
        method: 'POST',
        data: permission,
        params: {'uuid': uuid, 'username': permission.username, 'pems': true}
      });
    };

    service.getHistory = function(app_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
        method: 'GET',
        params: {'appId': app_id, 'history': true}
      });
    };

    service.getSyncMeta = function(app_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
        method: 'GET',
        params: {q:{'name': $translate.instant('apps_metadata_name'),'value.definition.id': app_id}}
      });
    };

    service.getSyncPermissions = function(app_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
        method: 'GET',
        params: {'appId': app_id, 'pems': true}
      });
    };

    service.syncPermissions = function(permission, uuid) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
        method: 'POST',
        data: permission,
        params: {'uuid': uuid, 'username': permission.username, 'pems': true}
      });
    };

    service.manageApp = function(appId, body){
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
        method: 'POST',
        data: body,
        params: {'appId': appId}
      });
    };

    service.deleteApp = function(app_id){
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
        method: 'DELETE',
        params: {'appId': app_id},
      });
    };

    service.deleteMeta = function(uuid){
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
        method: 'DELETE',
        params: {'uuid': uuid},
      });
    };

    service.getSystems = function(system_id, isPublic, type){
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
        method: 'GET',
        params: {'system_id': system_id, 'type': type, 'isPublic': isPublic}
      });
    };

    service.getSystemRoles = function(system_id){
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
        method: 'GET',
        params: {'system_id': system_id, 'roles': true}
      });
    };
    
    service.getRoleForUser = function(system_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
        method: 'GET',
        params: {'system_id': system_id, 'user_role': true}
      });
    };

    service.getFile = function(system_id, path){
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['files']),
        method: 'GET',
        params: {'system_id': system_id, 'path': path}
      });
    };

    return service;
  }]);

})(window, angular, jQuery, _);
