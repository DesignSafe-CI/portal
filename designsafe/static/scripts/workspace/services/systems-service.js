/**
 * This service is currently a stub service static data. We don't need dynamic system
 * lookup right now, but it will be nicer to go ahead and code against this service
 * rather than having stubs all over the place.
 */
export function workspaceSystemsService($q, $http) {
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
            url: '/rw/workspace/api/monitors/',
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
     * API if the execution system has monitoring set up.
     */
    service.getSystemStatus = (hostname) => {
        return $http.get('https://tap.tacc.utexas.edu/status/').then(
            (resp) => {
                const system = Object.values(resp.data).find((s) => s.hostname === hostname);
                return system;
            },
            (err) => {
                return $q.reject(err);
            }
        );
    };
    return service;
}
