/**
 * This service is currently a stub service static data. We don't need dynamic system
 * lookup right now, but it will be nicer to go ahead and code against this service
 * rather than having stubs all over the place.
 */
export function workspaceSystemsService($q, $http, djangoUrl) {
    var service = {};

    var systemsList = [
        {
          id: 'designsafe.storage.default',
          name: 'My Data',
          storage: {
              homeDir: '/',
              rootDir: '/corral-repl/tacc/NHERI/shared'
          },
          type: 'STORAGE',
          uuid: '5072762172135903717-242ac114-0001-006',
          fileMgr: 'agave',
          baseUrl: '/api/agave/files'
        },
        {
          id: 'designsafe.storage.projects',
          name: 'My Projects',
          storage: {
            homeDir: '/',
            rootDir: '/corral-repl/tacc/NHERI/projects'
          },
          type: 'STORAGE',
          uuid: '5762770863681049062-242ac117-0001-006', // UUID seems to be unused
          fileMgr: 'projects',
          baseUrl: '/api/projects/files'
        },
        {
          id: 'nees.public',
          name: 'Published',
          storage: {
            homeDir: '/',
            rootDir: '/corral-repl/tacc/NHERI/public/projects'
          },
          type: 'STORAGE',
          uuid: '8688297665752666597-242ac119-0001-006',
          fileMgr: 'public',
          baseUrl: '/api/public/files'
        },
    ];

    service.getMonitor = function(system_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_workspace:call_api', ['monitors']),
        method: 'GET',
        params: {'target': system_id},
        cache: false
      });
    };

    service.list = function() {
      return $q(function(resolve, reject) {
        resolve(systemsList);
      });
    };

    service.get = function(systemId) {
      return $q(function(resolve, reject) {
        var system;
        for (var s in systemsList) {
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
      switch(system) {
        case 'designsafe.community.exec.stampede2.nores':
          return $http.get("https://portal.tacc.utexas.edu/commnq/stampede2.tacc.utexas.edu/summary.json", 
          {headers: {'X-Requested-With': undefined, 'Authorization': undefined}});
          break;

          case 'designsafe.community.exec.maverick':
          return $http.get("https://portal.tacc.utexas.edu/commnq/maverick.tacc.utexas.edu/summary.json", 
          {headers: {'X-Requested-With': undefined, 'Authorization': undefined}});
          break;

          case 'designsafe.community.exec.ls5':
          return $http.get("https://portal.tacc.utexas.edu/commnq/lonestar5.tacc.utexas.edu/summary.json", 
          {headers: {'X-Requested-With': undefined, 'Authorization': undefined}});
          break;
          
          default:
          let deferred = $q.defer()
          deferred.resolve({'data': {'heartbeat': {'status': true}}})
          return deferred.promise
      }
    }

    return service;
  }