import neesFixture from './nees-publication.fixture.json';

describe('neesPublishedComponent', () => {
    let $rootScope,
        $state,
        Django,
        FileListingService,
        FileOperationService,
        PublicationService,
        $uibModal,
        $stateParams,
        $q,
        browsePromise,
        $componentController,
        $compile,
        neesPromise,
        component;

    beforeEach(() => {
        angular.mock.module('ds-data');
    });

    beforeEach(() => {
        angular
            .module('django.context', [])
            .constant('Django', { user: 'test_user', context: { authenticated: true } });
        angular.mock.inject(function(
            _$rootScope_,
            _$state_,
            _Django_,
            _PublicationService_,
            _FileOperationService_,
            _FileListingService_,
            _$uibModal_,
            _$stateParams_,
            _$q_,
            _$componentController_,
            _$compile_
        ) {
            $rootScope = _$rootScope_;
            $state = _$state_;
            Django = _Django_;
            PublicationService = _PublicationService_;
            FileListingService = _FileListingService_;
            FileOperationService = _FileOperationService_;
            $uibModal = _$uibModal_;
            $stateParams = _$stateParams_;
            $q = _$q_;
            $componentController = _$componentController_;
            $compile = _$compile_;

            browsePromise = $q.defer();
            neesPromise = $q.defer();

            spyOn(FileListingService, 'browse').and.returnValue(browsePromise.promise);
            spyOn(FileOperationService, 'openPreviewModal');
            spyOn(PublicationService, 'getNeesPublished').and.returnValue(neesPromise.promise);
            spyOn(PublicationService, 'updateNeesMetatags');
            spyOn($uibModal, 'open');

            // Trigger a state transition to populate $stateParams
            $state.go('neesPublished', { filePath: '/NEES-0000-0000.groups' });
            $rootScope.$digest();

            // Render the component and call $rootScope.$digest() to resolve the fixture.
            const element = angular.element('<nees-published></nees-published>');
            neesPromise.resolve({ data: neesFixture });
            component = $compile(element)($rootScope);
            $rootScope.$digest();
        });
    });

    it('should call DataBrowserService and ProjectService with correct args', () => {
        expect(FileListingService.browse).toHaveBeenCalledWith({
            section: 'main',
            api: 'agave',
            scheme: 'public',
            system: 'nees.public',
            path: '/NEES-0000-0000.groups',
        });
        expect(PublicationService.getNeesPublished).toHaveBeenCalledWith('NEES-0000-0000');
        expect(PublicationService.updateNeesMetatags).toHaveBeenCalledWith(neesFixture.metadata);
    });

    it('renders metadata table', () => {
        expect(component.find('#description').text()).toContain('This research investigates');
        expect(component.find('#pis').text()).toContain('David Sanders');
        expect(component.find('#orgs').text()).toContain('University of Nevada-Reno NV, United States');
        expect(component.find('#project-type').text()).toContain('NEES');
        expect(component.find('#nees-id').text()).toContain('NEES-2013-1216');
        expect(component.find('#start-date').text()).toContain('2012-05-15T00:00:00');
        expect(component.find('#sponsor').text()).toContain('NSF-1207903');
    });

    it('renders experiment table', () => {
        expect(component.find('.test-expt-title').text()).toContain('Shake Table Testing');
        expect(component.find('.test-expt-creators').text()).toContain('David Sanders');
        expect(component.find('.test-expt-doi').text()).toContain('10.4231/D33B5W88M');
        expect(component.find('.test-expt-type').text()).toContain('Shake Table');
        expect(component.find('.test-expt-description').text()).toContain('The dynamic, system performance');
        expect(component.find('.test-expt-start').text()).toContain('2014-07-11T00:00:00');
        expect(component.find('.test-expt-end').text()).toContain('2014-07-15T00:00:00');
        expect(component.find('.test-expt-material').text()).toContain('Cap Beam');
    });

    it('opens DOI modal', () => {
        const doiModalArgs = {
            component: 'neesDoiList',
            resolve: {
                project: jasmine.any(Function),
            },
        };
        const doiButton = component.find('#doi-button');
        doiButton.triggerHandler('click');
        expect($uibModal.open).toHaveBeenCalledWith(doiModalArgs);
    });

    it('opens citation modal', () => {
        const citeModalArgs = {
            component: 'neesCitationModal',
            resolve: {
                experiment: jasmine.any(Function),
            },
        };
        const citationButton = component.find('.test-btn-cite');
        citationButton.triggerHandler('click');
        expect($uibModal.open).toHaveBeenCalledWith(citeModalArgs);
    });

    it('browse folder in listing', () => {
        FileListingService.listings.main.listing = [{ name: 'testfolder', path: '/test/path', type: 'dir' }];
        $rootScope.$digest();
        const listing = component.find('.test-file-name');

        spyOn($state, 'go');
        listing.triggerHandler('click');
        expect($state.go).toHaveBeenCalledWith('neesPublished', { filePath: 'test/path' });
    });

    it('browse file in listing', () => {
        FileListingService.listings.main.listing = [{ name: 'testfolder', path: '/test/path', type: 'raw' }];
        $rootScope.$digest();
        const listing = component.find('.test-file-name');

        spyOn($state, 'go');
        listing.triggerHandler('click');
        expect(FileOperationService.openPreviewModal).toHaveBeenCalledWith({
            api: 'agave',
            scheme: 'public',
            file: { name: 'testfolder', path: '/test/path', type: 'raw', $$hashKey: jasmine.any(String) },
        });
    });
});
