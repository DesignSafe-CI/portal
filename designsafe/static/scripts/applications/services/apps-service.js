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
        })
            .then((resp) => { 
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    getApps() {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'GET',
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
        });
    }

    get(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'GET',
            params: { appId: appId },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    getPermissions(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'GET',
            params: { appId: appId, pems: true },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    getMeta(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'GET',
            params: { q: { name: this.$translate.instant('apps_metadata_name'), 'value.definition.id': appId } },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    getMetaPems(uuid) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'GET',
            params: { uuid: uuid, pems: true },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    createApp(body) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'POST',
            data: body,
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    createMeta(body) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'POST',
            data: body,
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    updateMeta(body, uuid) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'POST',
            data: body,
            params: { uuid: uuid },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    updateMetaPermissions(permission, uuid) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'POST',
            data: permission,
            params: { uuid: uuid, username: permission.username, pems: true },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    getHistory(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'GET',
            params: { appId: appId, history: true },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    getSyncMeta(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
            method: 'GET',
            params: { q: { name: this.$translate.instant('apps_metadata_name'), 'value.definition.id': appId } },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    getSyncPermissions(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
            method: 'GET',
            params: { appId: appId, pems: true },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    syncPermissions(permission, uuid) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['sync']),
            method: 'POST',
            data: permission,
            params: { uuid: uuid, username: permission.username, pems: true },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    manageApp(appId, body) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'POST',
            data: body,
            params: { appId: appId },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    deleteApp(appId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['apps']),
            method: 'DELETE',
            params: { appId: appId },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    deleteMeta(uuid) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
            method: 'DELETE',
            params: { uuid: uuid },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    getSystems(systemId, isPublic, type) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
            method: 'GET',
            params: { system_id: systemId, type: type, isPublic: isPublic },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    getSystemRoles(systemId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
            method: 'GET',
            params: { system_id: systemId, roles: true },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    getRoleForUser(systemId) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['systems']),
            method: 'GET',
            params: { system_id: systemId, user_role: true },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }

    getFile(systemId, path) {
        return this.$http({
            url: this.djangoUrl.reverse('designsafe_applications:call_api', ['files']),
            method: 'GET',
            params: { system_id: systemId, path: path },
        })
            .then((resp) => {
                return resp.data;
            },
            (error) => {
                return this.$q.reject(error);
            });
    }
}
