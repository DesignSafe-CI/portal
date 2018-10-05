'use strict';

describe('ApplicationTrayCtrl', function() {
    var $rootScope, $controller, $q, $timeout, $uibModal, Apps, SimpleList, MultipleList, scope, ctrl;
    beforeEach(angular.mock.module("designsafe"));
    beforeEach(function(){
        angular.module("django.context", []).constant("Django", {user:"test_user"});
        angular.mock.inject(
            function(
                _$rootScope_,
                _$controller_,
                _$q_,
                _$timeout_,
                _$uibModal_,
                _Apps_,
                _SimpleList_,
                _MultipleList_
            ){
                $rootScope = _$rootScope_;
                $controller = _$controller_;
                $q = _$q_;
                $timeout = _$timeout_;
                $uibModal = _$uibModal_;
                Apps = _Apps_;
                SimpleList = _SimpleList_;
                MultipleList = _MultipleList_;
        });
    });
    beforeEach(inject(function($controller, $rootScope){
        scope = $rootScope.$new();
        var callbackResponse = {data:[
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
            ]};
        spyOn(Apps, 'list').and.callFake(function(){
            return {
                then: function(callback){
                    return callback(callbackResponse);
                }
            }
        });
      ctrl = $controller('ApplicationTrayCtrl', {
        $scope: scope,
        $rootScope: $rootScope,
        $q: $q,
        $timeout: $timeout,
        $uibModal: $uibModal,
        Apps: Apps,
        SimpleList: SimpleList,
        MultipleList: MultipleList
      });
    }));

    it("Should define controller", function(){
        expect(ctrl).toBeDefined();
    });

    it("Should see data as private", function(){
        expect(scope.data.publicOnly).toBe(false);
    });
});
