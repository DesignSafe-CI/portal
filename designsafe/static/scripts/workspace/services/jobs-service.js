export function jobsService($http, djangoUrl) {
    'ngInject';
    let service = {};

    service.list = function(options) {
        let params = {
            limit: options.limit || 10,
            offset: options.offset || 0,
        };
        return $http.get(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), {
            params: params,
        });
    };

    service.get = function(uuid) {
        return $http.get(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), {
            params: {'job_id': uuid}
        });
    };

    service.submit = function(data) {
        return $http.post(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), data);
    };

    service.getWebhookUrl = function() {
        return $http.get(djangoUrl.reverse('designsafe_api:jobs_wh_handler'));
    };

    return service;
}
