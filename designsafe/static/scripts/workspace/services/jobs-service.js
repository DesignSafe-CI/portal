import * as d3 from 'd3';

export function jobsService($http, djangoUrl) {
    'ngInject';
    let service = {};

    service.list = function(options) {
        options.limit = options.limit || 10;
        options.offest = options.offest || 0;
        return $http.get(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), {
            params: options,
        }).then(resp => {
            let data = resp.data;
            data.forEach(d => {
                d.created = new Date(d.created);
            });
            return data;
        });
    };

    service.get = function(uuid) {
        return $http.get(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), {
            params: { job_id: uuid },
        });
    };

    service.submit = function(data) {
        return $http.post(djangoUrl.reverse('designsafe_workspace:call_api', ['jobs']), data);
    };

    service.jobsByDate = function(jobs) {
        let nested = d3.nest()
            .key(function(d) {
                let ct = d.created;
                ct.setHours(0, 0, 0);
                return ct;
            })
            .entries(jobs);
        nested.forEach(function(d) {
            d.key = new Date(d.key);
        });
        nested = nested.sort(function(a, b) {
            return a.key - b.key;
        });
        return nested;
    };
    return service;
}
