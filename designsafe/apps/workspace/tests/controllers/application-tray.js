'use strict';

describe('ApplicationTrayCtrl', function() {

  beforeEach(module('WorkspaceApp'));

  describe('ApplicationTrayCtrl controller', function() {

    beforeEach(function() {
      spyOn()
    });

    it('should ....', inject(function($rootScope, $controller) {
      //spec body
      var scope = $rootScope.$new();
      var ctrl = $controller('ApplicationTrayCtrl', {
        $scope: scope, $rootScope: $rootScope
      });
      expect(ctrl).toBeDefined();
      console.log(scope.data.apps);
      expect(scope.data.publicOnly).toBe(false);
    }));

  });
});