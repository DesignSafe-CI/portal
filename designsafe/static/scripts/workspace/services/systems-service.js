/**
 * This service is currently a stub service static data. We don't need dynamic system
 * lookup right now, but it will be nicer to go ahead and code against this service
 * rather than having stubs all over the place.
 */
export function workspaceSystemsService($q, $http, djangoUrl) {
    'ngInject';
    let service = {};

    const systemsList = [
        {
            id: 'designsafe.storage.default',
            name: 'My Data',
            storage: {
                homeDir: '/',
                rootDir: '/corral-repl/tacc/NHERI/shared',
            },
            type: 'STORAGE',
            fileMgr: 'agave',
            baseUrl: '/api/agave/files',
        },
        {
            id: 'designsafe.storage.projects',
            name: 'My Projects',
            storage: {
                homeDir: '/',
                rootDir: '/corral-repl/tacc/NHERI/projects',
            },
            type: 'STORAGE',
            fileMgr: 'projects',
            baseUrl: '/api/projects/files',
        },
        {
            id: 'nees.public',
            name: 'Published',
            storage: {
                homeDir: '/',
                rootDir: '/corral-repl/tacc/NHERI/public/projects',
            },
            type: 'STORAGE',
            fileMgr: 'public',
            baseUrl: '/api/public/files',
        },
        {
            id: 'designsafe.storage.community',
            name: 'Community',
            storage: {
                homeDir: '/',
                rootDir: '/corral-repl/tacc/NHERI/community',
            },
            type: 'STORAGE',
            fileMgr: 'community',
            baseUrl: '/api/public/files',
        },
    ];

    service.getMonitor = function(systemId) {
        return $http({
            url: djangoUrl.reverse('designsafe_workspace:call_api', ['monitors']),
            method: 'GET',
            params: { target: systemId },
            cache: false,
        });
    };

    service.list = function() {
        return $q(function(resolve, reject) {
            resolve(systemsList);
        });
    };

    service.get = function(systemId) {
        return $q(function(resolve, reject) {
            let system;
            for (const s in systemsList) {
                if (s.id === systemId) {
                    system = s;
                    break;
                }
            }
            if (system) {
                resolve(system);
            } else {
                reject(system);
            }
        });
    };

    /**
   *
   * @param {string} system: The system to monitor.
   *
   * Returns a promise which resolves to the response from the TACC monitoring
   * API if the execution system has monitoring set up, or a dummy that lets us grab
   * data.heartbeat.status from the response (default to true).
   */
    service.getSystemStatus = function(system) {
        switch (system) {
            case 'designsafe.community.exec.stampede2.nores':
            case 'designsafe.community.exec.stampede2':
                return $http.get('https://portal.tacc.utexas.edu/commnq/stampede2.tacc.utexas.edu/summary.json',
                    { headers: { 'X-Requested-With': undefined, Authorization: undefined } })
                    .then((resp) => {
                        return resp.data;
                    }, (err) => {
                        return $q.reject(err);
                    });

            case 'designsafe.community.exec.maverick2':
                return $http.get('https://portal.tacc.utexas.edu/commnq/maverick2.tacc.utexas.edu/summary.json',
                    { headers: { 'X-Requested-With': undefined, Authorization: undefined } })
                    .then((resp) => {
                        return resp.data;
                    }, (err) => {
                        return $q.reject(err);
                    });

            case 'designsafe.community.exec.ls5':
                return $http.get('https://portal.tacc.utexas.edu/commnq/lonestar5.tacc.utexas.edu/summary.json',
                    { headers: { 'X-Requested-With': undefined, Authorization: undefined } })
                    .then((resp) => {
                        return resp.data;
                    }, (err) => {
                        return $q.reject(err);
                    });

            default: {
                let deferred = $q.defer();
                deferred.resolve({ heartbeat: { status: true } });
                return deferred.promise;
            }
        }
    };
    return service;
}
