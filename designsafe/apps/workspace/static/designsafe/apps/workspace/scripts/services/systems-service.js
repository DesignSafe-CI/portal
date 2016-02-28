/**
 * This service is currently a stub service static data. We don't need dynamic system
 * lookup right now, but it will be nicer to go ahead and code against this service
 * rather than having stubs all over the place.
 */
(function(window, angular, $, _) {
  'use strict';
  angular.module('WorkspaceApp').factory('Systems', ['$q', 'djangoUrl', function($q, djangoUrl) {
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
          uuid: '5072762172135903717-242ac114-0001-006'
        },
        {
          id: 'nees.public',
          name: 'Public Data',
          storage: {
            homeDir: '/',
            rootDir: '/corral-repl/tacc/NHERI/public/projects'
          },
          type: 'STORAGE',
          uuid: '8688297665752666597-242ac119-0001-006'
        }
    ];

    service.list = function() {
      return $q(function(resolve, reject) {
        resolve(systemsList);
      });
    };

    service.get = function(systemId) {
      return $q(function(resolve, reject) {
        var system;
        for (s in systemsList) {
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

    return service;
  }]);
})(window, angular, jQuery, _);
