'use strict';

describe('ApplicationTrayCtrl', function() {

  beforeEach(module('WorkspaceApp'));

  describe('ApplicationTrayCtrl controller', function() {

    it('should ....', inject(function($rootScope, $controller, Apps) {
      spyOn(Apps, 'list').and.callFake(function() {
        return {
          then: function(callback) {
            return callback({data:[{name: 'testing', description: 'testing'}]});
          }
        };
      });

      var scope = $rootScope.$new();
      var ctrl = $controller('ApplicationTrayCtrl', {
        $scope: scope, $rootScope: $rootScope, Apps: Apps
      });

      expect(ctrl).toBeDefined();
      expect(scope.data.publicOnly).toBe(false);
      expect(Apps.list).toHaveBeenCalled();
      expect(scope.data.apps.length).toBe(1);
      expect(scope.data.apps[0].name).toBe('testing');
    }));

  });
});