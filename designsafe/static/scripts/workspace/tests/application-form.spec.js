import appMeta from '../fixtures/app-meta.fixture.json';

describe('ApplicationFormCtrl', function() {
    let scope,
        $rootScope,
        $localStorage,
        $location,
        $anchorScroll,
        $translate,
        WorkspaceApps,
        Jobs,
        Systems,
        $mdToast,
        Django,
        ProjectService,
        $q,
        ctrl,
        app,
        appBin;

    beforeEach(() => {
        angular.mock.module('workspace');
    });
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(
            (
                _$rootScope_,
                _$localStorage_,
                _$location_,
                _$anchorScroll_,
                _$translate_,
                _WorkspaceApps_,
                _Jobs_,
                _Systems_,
                _$mdToast_,
                _ProjectService_,
                _$q_
            ) => {
                $rootScope = _$rootScope_;
                $localStorage = _$localStorage_;
                $location = _$location_;
                $anchorScroll = _$anchorScroll_;
                $translate = _$translate_;
                WorkspaceApps = _WorkspaceApps_;
                Jobs = _Jobs_;
                Systems = _Systems_;
                $mdToast = _$mdToast_;
                ProjectService = _ProjectService_;
                $q = _$q_;
            });
    });
    beforeEach(inject(($controller, $rootScope) => {
        scope = $rootScope.$new();

        app = appMeta;

        appBin = {
            applications: [app],
            value: {
                definition: {
                    appIcon: app.value.definition.appIcon,
                    label: app.value.definition.appIcon,
                    id: `${app.value.definition.appIcon}::${app.value.definition.appCategory}`,
                    orderBy: app.value.definition.appIcon,
                },
            },
        };

        spyOn(Jobs, 'getWebhookUrl').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback({ data: 'https://designsafe-ci.org/api/notifications/wh/jobs/' });
                },
            };
        });

        spyOn(Systems, 'getSystemStatus').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback({ data: { heartbeat: { status: true } } } );
                },
            };
        });

        spyOn(WorkspaceApps, 'get').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback({ data: app.value.definition });
                },
            };
        });

        ctrl = $controller('ApplicationFormCtrl', {
            $scope: scope,
            $rootScope: $rootScope,
            $localStorage: $localStorage,
            $location: $location,
            $anchorScroll: $anchorScroll,
            $translate: $translate,
            WorkspaceApps: WorkspaceApps,
            Jobs: Jobs,
            Systems: Systems,
            $mdToast: $mdToast,
            Django: Django,
            ProjectService: ProjectService,
        });
    }));

    it('Should define controller', () => {
        expect(ctrl).toBeDefined();
    });

    it('Should define onSubmit', () => {
        expect(ctrl).toBeDefined(ctrl.onSubmit);
    });

    it('Should define closeApp', () => {
        expect(ctrl).toBeDefined(ctrl.closeApp);
    });

    it('Should define onLaunchNotebook', () => {
        expect(ctrl).toBeDefined(ctrl.onLaunchNotebook);
    });

    it('Should define resetForm', () => {
        expect(ctrl).toBeDefined(ctrl.resetForm);
    });

    it('Should see submitting as false', () => {
        expect(scope.data.submitting).toBe(false);
    });

    it('loads an app when broadcast', () => {
        $rootScope.$broadcast('launch-app', app);
        $rootScope.$apply();

        expect(scope.data.app).not.toBe(null);
        expect(scope.data.app.id).toBe(app.value.definition.id);
    });

    it('loads an app description for binned app', () => {
        let callbackResponse = { appDescription: 'This is an App Description!' };

        spyOn(WorkspaceApps, 'getAppDropdownDescription').and.callFake(() => {
            return {
                then: function(callback) {
                    return callback({ data: callbackResponse });
                },
            };
        });

        $rootScope.$broadcast('launch-app', appBin);
        $rootScope.$apply();

        expect(scope.data.bin).not.toBe(null);
        expect(scope.data.bin.description).toBe(callbackResponse.appDescription);
    });
});
