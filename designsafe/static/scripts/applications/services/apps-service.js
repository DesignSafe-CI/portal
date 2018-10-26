export function appsService(window, angular, $, _) {
    'ngInject';
    'use strict';
    angular.module('designsafe').factory('Apps', ['$http', '$q', '$translate', 'djangoUrl', function($http, $q, $translate, djangoUrl) {
        let service = {};

        service.list = function(query) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
                method: 'GET',
                params: {q: query},
                cache: true,
            });
        };

        service.getApps = function(appId) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
                method: 'GET',
            });
        };

        service.get = function(appId) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
                method: 'GET',
                params: {appId: appId},
            });
        };

        service.getPermissions = function(appId) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
                method: 'GET',
                params: {appId: appId, pems: true},
            });
        };

        service.getMeta = function(appId) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
                method: 'GET',
                params: {q: {name: $translate.instant('apps_metadata_name'), 'value.definition.id': appId}},
            });
        };

        service.getMetaPems = function(uuid) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
                method: 'GET',
                params: {uuid: uuid, pems: true},
            });
        };

        service.createApp = function(body) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
                method: 'POST',
                data: body,
            });
        };

        service.createMeta = function(body) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
                method: 'POST',
                data: body,
            });
        };

        service.updateMeta = function(body, uuid) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
                method: 'POST',
                data: body,
                params: {uuid: uuid},
            });
        };

        service.updateMetaPermissions = function(permission, uuid) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
                method: 'POST',
                data: permission,
                params: {uuid: uuid, username: permission.username, pems: true},
            });
        };

        service.getHistory = function(appId) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
                method: 'GET',
                params: {appId: appId, history: true},
            });
        };

        service.getSyncMeta = function(appId) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
                method: 'GET',
                params: {q: {name: $translate.instant('apps_metadata_name'), 'value.definition.id': appId}},
            });
        };

        service.getSyncPermissions = function(appId) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
                method: 'GET',
                params: {appId: appId, pems: true},
            });
        };

        service.syncPermissions = function(permission, uuid) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
                method: 'POST',
                data: permission,
                params: {uuid: uuid, username: permission.username, pems: true},
            });
        };

        service.manageApp = function(appId, body) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
                method: 'POST',
                data: body,
                params: {appId: appId},
            });
        };

        service.deleteApp = function(appId) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
                method: 'DELETE',
                params: {appId: appId},
            });
        };

        service.deleteMeta = function(uuid) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
                method: 'DELETE',
                params: {uuid: uuid},
            });
        };

        service.getSystems = function(systemId, isPublic, type) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
                method: 'GET',
                params: {systemId: systemId, type: type, isPublic: isPublic},
            });
        };

        service.getSystemRoles = function(systemId) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
                method: 'GET',
                params: {systemId: systemId, roles: true},
            });
        };

        service.getRoleForUser = function(systemId) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
                method: 'GET',
                params: {systemId: systemId, user_role: true},
            });
        };

        service.getFile = function(systemId, path) {
            return $http({
                url: djangoUrl.reverse('designsafe_applications:call_api', ['files']),
                method: 'GET',
                params: {systemId: systemId, path: path},
            });
        };

        return service;
    }]);
}
