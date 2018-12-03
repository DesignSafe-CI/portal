export class Apps {
    constructor($http, $translate, djangoUrl) {
        'ngInject';
        this.$http = $http;
        this.$translate = $translate;
        this.djangoUrl = djangoUrl;
    }

    list(query) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'GET',
            params: { q: query },
            cache: true,
        });
    }

    getApps() {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'GET',
        });
    }

    get(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'GET',
            params: { appId: appId },
        });
    }

    getPermissions(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'GET',
            params: { appId: appId, pems: true },
        });
    }

    getMeta(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'GET',
            params: { q: { name: this.$translate.instant('apps_metadata_name'), 'value.definition.id': appId } },
        });
    }

    getMetaPems(uuid) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'GET',
            params: { uuid: uuid, pems: true },
        });
    }

    createApp(body) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'POST',
            data: body,
        });
    }

    createMeta(body) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'POST',
            data: body,
        });
    }

    updateMeta(body, uuid) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'POST',
            data: body,
            params: { uuid: uuid },
        });
    }

    updateMetaPermissions(permission, uuid) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'POST',
            data: permission,
            params: { uuid: uuid, username: permission.username, pems: true },
        });
    }

    getHistory(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'GET',
            params: { appId: appId, history: true },
        });
    }

    getSyncMeta(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
            method: 'GET',
            params: { q: { name: this.$translate.instant('apps_metadata_name'), 'value.definition.id': appId } },
        });
    }

    getSyncPermissions(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
            method: 'GET',
            params: { appId: appId, pems: true },
        });
    }

    syncPermissions(permission, uuid) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
            method: 'POST',
            data: permission,
            params: { uuid: uuid, username: permission.username, pems: true },
        });
    }

    manageApp(appId, body) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'POST',
            data: body,
            params: { appId: appId },
        });
    }

    deleteApp(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'DELETE',
            params: { appId: appId },
        });
    }

    deleteMeta(uuid) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'DELETE',
            params: { uuid: uuid },
        });
    }

    getSystems(systemId, isPublic, type) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
            method: 'GET',
            params: { system_id: systemId, type: type, isPublic: isPublic },
        });
    }

    getSystemRoles(systemId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
            method: 'GET',
            params: { system_id: systemId, roles: true },
        });
    }

    getRoleForUser(systemId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
            method: 'GET',
            params: { system_id: systemId, user_role: true },
        });
    }

    getFile(systemId, path) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['files']),
            method: 'GET',
            params: { system_id: systemId, path: path },
        });
    }
}
