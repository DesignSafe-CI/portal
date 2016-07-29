'use strict';

describe('ApplicationTrayCtrl', function() {

  beforeEach(module('WorkspaceApp'));

  describe('ApplicationTrayCtrl controller', function() {

    it('should ....', inject(function($rootScope, $controller, $q, $timeout, $uibModal, $translate, Apps, SimpleList, MultipleList) {
      spyOn(Apps, 'list').and.callFake(function() {
        return {
          then: function(callback) {
            return callback({data:[
              {
                "name": "ds_app_list",
                "created": "2016-06-27T16:33:02.796-05:00",
                "schemaId": null,
                "lastUpdated": "2016-06-27T17:07:38.506-05:00",
                "associationIds": [],
                "_links": {"self": {"href": "https://agave.designsafe-ci.org/meta/v2/data/5026667269377355290-242ac1110-0001-012"}},
                "value": {
                  "type": "apps-list",
                  "apps": [{"type": "agave", "id": "shell-runner-two-0.1.0"}, {"type": "agave", "id": "shell-runner-four-0.1.0"}, {"type": "agave", "id": "shell-runner-five-0.1.0"}],
                  "label": "test_list"
                },
                "owner": "test_user",
                "internalUsername": null,
                "uuid": "5026667269377355290-242ac1110-0001-012"
              }
            ]});
          }
        };
      });

      var scope = $rootScope.$new();
      var ctrl = $controller('ApplicationTrayCtrl', {
        $scope: scope,
        $rootScope: $rootScope,
        $q: $q,
        $timeout: $timeout,
        $uibModal: $uibModal,
        $translate: $translate,
        Apps: Apps,
        SimpleList: SimpleList,
        MultipleList: MultipleList
      });

      expect(ctrl).toBeDefined();
      expect(scope.data.publicOnly).toBe(false);
      // expect(Apps.list).toHaveBeenCalled();
      // expect(scope.simpleList.lists['test_list'].length).toBe(3);
      // expect(scope.simpleList.lists['test_list'][0].label).toBe('shell-runner-two-0.1.0');
    }));

  });
});
