const { initial } = require('underscore');

describe('filesListing', () => {
    // Component dependencies
    let FileListingService, $state;

    // Test dependencies
    let $compile, $rootScope, $document;

    const initialListing = {
        loading: false,
        loadingScroll: false,
        reachedEnd: false,
        listing: [],
        selectedFiles: [],
        selectAll: false,
        params: {
            api: '',
            system: '',
            scheme: 'private',
            path: '',
            offset: 0,
            limit: 100,
        },
        listingSubscriber: undefined,
        scrollSubscriber: undefined,
        error: null,
        errorScroll: null,
        rootEntities: [],
        selectedForPublication: false,
    };

    beforeEach(angular.mock.module('ds-data'));
    beforeEach(() => {
        angular
            .module('django.context', [])
            .constant('Django', { user: 'test_user', context: { authenticated: true } });
        angular.mock.inject(function(_FileListingService_, _$state_, _$rootScope_, _$compile_, _$document_) {
            $rootScope = _$rootScope_;
            $compile = _$compile_;
            $state = _$state_;
            FileListingService = _FileListingService_;
            $document = _$document_;
        });

        spyOn(FileListingService, 'browseScroll').and.returnValue('hello');
    });

    it('Render an empty listing', () => {
        $rootScope.listing = initialListing;
        let el = angular.element('<files-listing listing="listing"></files-listing>');
        component = $compile(el)($rootScope);
        $rootScope.$digest();

        expect(component.text()).toContain('This folder is empty!');
    });

    it('Render an empty listing (project)', () => {
        $rootScope.listing = { ...initialListing, params: { ...initialListing.params, system: 'project-xyz' } };
        let el = angular.element('<files-listing listing="listing"></files-listing>');
        component = $compile(el)($rootScope);
        $rootScope.$digest();

        expect(component.text()).toContain('Learn how to move files to a project');
    });

    it('Render an empty listing (category select)', () => {
        $rootScope.listing = { ...initialListing, params: { ...initialListing.params, system: 'project-xyz' } };
        let el = angular.element('<files-listing listing="listing" edit-tags="true"></files-listing>');
        component = $compile(el)($rootScope);
        $rootScope.$digest();

        expect(component.text()).toContain('Learn how to assign files to categories');
    });

    it('Render an error message', () => {
        $rootScope.listing = { ...initialListing, error: { message: 'There was an error.' } };
        let el = angular.element('<files-listing listing="listing"></files-listing>');
        component = $compile(el)($rootScope);
        $rootScope.$digest();

        expect(component.text()).toContain('There was an error.');
    });

    it('Render a listing', () => {
        $rootScope.listing = {
            ...initialListing,
            listing: [
                {
                    name: "testfile",
                    system: 'designsafe.storage.default',
                    path: '/path/to/file',
                    type: 'dir',
                    format: 'folder',
                    length: 0,
                    lastModified: '2016-04-28T15:09:35.000-05:00',
                },
            ],
        };
        let el = angular.element('<files-listing listing="listing"></files-listing>');
        component = $compile(el)($rootScope);
        $rootScope.$digest();

        expect(component.find('.test-file-name').text()).toContain('testfile');
        expect(component.find('.test-length-folder').text()).toContain('--');
    });

    it('Renders an operation button that calls a bound operation', () => {
        $rootScope.listing = {
            ...initialListing,
            listing: [
                {
                    name: "testfile",
                    system: 'designsafe.storage.default',
                    path: '/path/to/file',
                    type: 'dir',
                    format: 'folder',
                    length: 0,
                    lastModified: '2016-04-28T15:09:35.000-05:00',
                },
            ],
        };
        const mockOperation = jasmine.createSpy('mock-operation')
        $rootScope.mockOperation = mockOperation;
        $rootScope.operationLabel = 'Test Operation';
        let el = angular.element('<files-listing listing="listing" operation-label="operationLabel" operation="mockOperation(file)"></files-listing>');
        component = $compile(el)($rootScope);
        $rootScope.$digest();

        expect(component.find('.test-op-btn').text()).toContain('Test Operation');
        const opButton = component.find('.test-op-btn');
        opButton.triggerHandler('click');
        expect(mockOperation).toHaveBeenCalledWith({
            name: "testfile",
            system: 'designsafe.storage.default',
            path: '/path/to/file',
            type: 'dir',
            format: 'folder',
            length: 0,
            lastModified: '2016-04-28T15:09:35.000-05:00',
            $$hashKey: jasmine.any(String)
        });


    })

    it('Clicking filename calls browse function', () => {
        $rootScope.listing = {
            ...initialListing,
            listing: [
                {
                    name: "testfile",
                    system: 'designsafe.storage.default',
                    path: '/path/to/file',
                    type: 'dir',
                    format: 'folder',
                    length: 0,
                    lastModified: '2016-04-28T15:09:35.000-05:00',
                },
            ],
        };
        const mockBrowse = jasmine.createSpy('mock-browse')
        $rootScope.onBrowse = mockBrowse;
        let el = angular.element('<files-listing listing="listing" on-browse="onBrowse(file)"></files-listing>');
        component = $compile(el)($rootScope);
        $rootScope.$digest();

        const fileHref = component.find('.test-file-name');
        fileHref.triggerHandler('click');
        expect(mockBrowse).toHaveBeenCalledWith({
            name: "testfile",
            system: 'designsafe.storage.default',
            path: '/path/to/file',
            type: 'dir',
            format: 'folder',
            length: 0,
            lastModified: '2016-04-28T15:09:35.000-05:00',
            $$hashKey: jasmine.any(String)
        });
    });

    it('calls browseScroll on scroll to bottom', (done) => {
        const fileMeta = {
            name: "testfile",
            system: 'designsafe.storage.default',
            path: '/path/to/file',
            type: 'dir',
            format: 'folder',
            length: 0,
            lastModified: '2016-04-28T15:09:35.000-05:00',
        }
        $rootScope.listing = {
            ...initialListing,
            // Stub listing of 30 files
            listing: Array.from(Array(30)).map((_, key) => ({...fileMeta, key})),
        };

        let el = angular.element('<files-listing listing="listing"></files-listing>');
        component = $compile(el)($rootScope);
        // Add element to the DOM to give it nonzero height/scroll properties.
        angular.element($document[0].body).append(component);
        $rootScope.$digest();

        let scrollDiv = component.find('#listing-scroll')
        // Scroll 1000px down from top
        scrollDiv.scrollTop(1000);
        $rootScope.$digest();

        // setTimeout is needed here to catch the handling of the scroll event
        setTimeout(() => {
            expect(FileListingService.browseScroll).toHaveBeenCalled();
            done()
        }, 0)
    })

    it('Render inside trash', () => {
        $rootScope.listing = {
            ...initialListing,
            params: {
                system: 'designsafe.storage.default',
                path: 'test/.Trash/',
            },
        };

        let el = angular.element('<files-listing listing="listing"></files-listing>');
        component = $compile(el)($rootScope);
        $rootScope.$digest();
        expect(component.text()).toContain('Trashed items will be kept a maximum of 90 days.');

        $rootScope.listing.params.path = 'testUser/.Trash/testing';
        $rootScope.$digest();
        expect(component.text()).toContain('Trashed items will be kept a maximum of 90 days.');

        $rootScope.listing.params.system = 'project-12345';
        $rootScope.listing.params.path = '.Trash/';
        $rootScope.$digest();
        expect(component.text()).toContain('Trashed items will be kept a maximum of 90 days.');

        $rootScope.listing.params.path = '.Trash/testing';
        $rootScope.$digest();
        expect(component.text()).toContain('Trashed items will be kept a maximum of 90 days.');
    });


});
