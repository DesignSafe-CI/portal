describe('neesPublishedComponent', () => {
    let $rootScope, $state, $filter, Django, $window, DataBrowserService, PublishedService,
        FileListing, $uibModal, $http, $stateParams, $q, ctrl, deferred, browsePromise, neesPromise;

    beforeEach(() => {
        angular.mock.module('ds-data');
    });
    
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function (_$rootScope_, _$state_, _$filter_, _Django_,
            _DataBrowserService_, _PublishedService_, _FileListing_, _$uibModal_, _$http_,
            _$window_, _$stateParams_, _$q_, $componentController) {
            $rootScope = _$rootScope_;
            $state = _$state_;
            $filter = _$filter_;
            Django = _Django_;
            $window = _$window_;
            DataBrowserService = _DataBrowserService_;
            PublishedService = _PublishedService_;
            FileListing = _FileListing_;
            $uibModal = _$uibModal_;
            $http = _$http_;
            $stateParams = { filePath: '/NEES-0000-0000.groups' };
            $q = _$q_;
            deferred = _$q_.defer();

            browsePromise = $q.defer();
            neesPromise = $q.defer();

            spyOn(DataBrowserService, 'browse').and.returnValue(browsePromise.promise);
            spyOn(PublishedService, 'getNeesPublished').and.returnValue(neesPromise.promise);
            spyOn($state, 'go');
            
            const mockedServices = {
                $stateParams: $stateParams,
                DataBrowserService: DataBrowserService,
                PublishedService, PublishedService,
                $state: $state
            };
            ctrl = $componentController(
                'neesPublicationComponent',
                mockedServices
            );
            ctrl.$onInit();
        });

    });

    it('Should define controller', () => {
        expect(ctrl).toBeDefined();
    });
    it('should have necessary methods', () => {
        expect(ctrl.onBrowse).toBeDefined();
        expect(ctrl.onDetail).toBeDefined();
        expect(ctrl.onSelect).toBeDefined();
        expect(ctrl.scrollToBottom).toBeDefined();
        expect(ctrl.scrollToTop).toBeDefined();
        expect(ctrl.resolveBreadcrumbHref).toBeDefined();
    });
    it('should call DataBrowserService and ProjectService with correct args', () => {
        expect(DataBrowserService.browse).toHaveBeenCalledWith({ system: 'nees.public', path: '/NEES-0000-0000.groups' });
        expect(PublishedService.getNeesPublished).toHaveBeenCalledWith('NEES-0000-0000');
    });
    it('onBrowse should browse to publication listing if path is root', () => {
        ctrl.onBrowse({
            preventDefault: ()=>{return;},
            stopPropagation: ()=>{return;}
        },
        { path: '/' }
        );
        expect(ctrl.$state.go).toHaveBeenCalledWith('publicData');
    });
    it('onBrowse should browse to a NEES publication if path is provided', () => {
        ctrl.onBrowse({
            preventDefault: ()=>{return;},
            stopPropagation: ()=>{return;}
        },
        { path: '/NEES-0000-0000.groups/path/to/file' }
        );
        expect(ctrl.$state.go).toHaveBeenCalledWith(
            'neesPublished', 
            { filePath: '/NEES-0000-0000.groups/path/to/file' },
            { reload: true });
    });
    
});