import {AppTrayComponent} from '../components/application-tray/application-tray.component';

describe('AppTrayComponent', () => {
    let $rootScope;
    let $controller;
    let $q;
    let $timeout;
    let $uibModal;
    let $state;
    let $stateParams;
    let $translate;
    let $mdToast;
    let $location;
    let Apps;
    let SimpleList;
    let scope;
    let ctrl;
    beforeEach(() => {
        angular.mock.module('workspace');
    });
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject(
            (
                _$rootScope_,
                _$controller_,
                _$q_,
                _$timeout_,
                _$uibModal_,
                _$state_,
                _$stateParams_,
                _$translate_,
                _Apps_,
                _SimpleList_,
                _$mdToast_
            ) => {
                $rootScope = _$rootScope_;
                $controller = _$controller_;
                $q = _$q_;
                $timeout = _$timeout_;
                $uibModal = _$uibModal_;
                $state = _$state_;
                $stateParams = _$stateParams_;
                $translate = _$translate_;
                Apps = _Apps_;
                SimpleList = _SimpleList_;
                $mdToast = _$mdToast_;
            });
    });
    beforeEach(inject(($componentController, $rootScope) => {
        scope = $rootScope.$new();
        const callbackResponse = {
            data: [
                {
                    name: 'ds_app_list',
                    created: '2016-06-27T16:33:02.796-05:00',
                    schemaId: null,
                    lastUpdated: '2016-06-27T17:07:38.506-05:00',
                    associationIds: [],
                    _links: {self: {href: 'https://agave.designsafe-ci.org/meta/v2/data/5026667269377355290-242ac1110-0001-012'}},
                    value: {
                        type: 'apps-list',
                        apps: [{type: 'agave', id: 'shell-runner-two-0.1.0'}, {type: 'agave', id: 'shell-runner-four-0.1.0'}, {type: 'agave', id: 'shell-runner-five-0.1.0'}],
                        label: 'test_list',
                    },
                    owner: 'test_user',
                    internalUsername: null,
                    uuid: '5026667269377355290-242ac1110-0001-012',
                },
            ],
        };
        spyOn(Apps, 'list').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback(callbackResponse);
                },
            };
        });
        ctrl = new AppTrayComponent.controller(scope, $location, $rootScope, $q, $state, $stateParams, $translate, Apps, SimpleList, $mdToast);
        ctrl.$onInit();
    }));

    it('Should define controller', () => {
        expect(ctrl).toBeDefined();
    });

    it('Should see data as private', () => {
        expect(ctrl.data.publicOnly).toBe(false);
    });
});
