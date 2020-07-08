import { TestScheduler } from 'rxjs/testing';
import { race } from 'rxjs';

describe('RapidDataService', function() {
    var FileListingService, $httpBackend, $http, testScheduler;

    beforeEach(angular.mock.module('designsafe'));
    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function(_FileListingService_, _$httpBackend_, _$http_) {
            FileListingService = _FileListingService_;
            $httpBackend = _$httpBackend_;
            $http = _$http_;
        });
    });

    beforeEach(() => {
        testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });
    });
    
    it('Should handle successful file listing.', () => {
        const observableTests = ({ hot, cold, flush, expectObservable }) => {
            spyOn(FileListingService.$http, 'get').and.returnValue(null);
            spyOn(FileListingService, 'listingSuccessCallback').and.returnValue(null);
            spyOn(FileListingService, 'from').and.returnValue(cold('--a|'));
            const params = {
                section: 'main',
                api: 'agave',
                system: 'test.system',
                path: '/test/path',
                offset: 0,
                limit: 100,
            };
            const listingObservable = FileListingService.mapParamsToListing(params);
            
            // Formats backend API call correctly
            expect(FileListingService.$http.get).toHaveBeenCalledWith(
                '/api/agave/files/listing/agave/test.system/test/path/',
                { params: { offset: 0, limit: 100 } }
            );
            // Emits identically to from($http.get(...))
            expectObservable(listingObservable).toBe('--a|');

            flush();
            // Fires callback after it emits.
            expect(FileListingService.listingSuccessCallback).toHaveBeenCalledWith('main');
        };
        testScheduler.run(observableTests); 
    });
    
    it('Should handle file listing with error.', () => {
        const observableTests = ({ hot, cold, flush, expectObservable }) => {
            spyOn(FileListingService.$http, 'get').and.returnValue(null);
            spyOn(FileListingService, 'listingErrorCallback').and.returnValue(null);

            spyOn(FileListingService, 'from').and.returnValue(cold('--#', null, new Error('Failed listing.')));

            const params = {
                section: 'main',
                api: 'agave',
                system: 'test.system',
                path: '/test/path',
                offset: 0,
                limit: 100,
            };
            const listingObservable = FileListingService.mapParamsToListing(params);
            
            // Formats backend API call correctly
            expect(FileListingService.$http.get).toHaveBeenCalledWith(
                '/api/agave/files/listing/agave/test.system/test/path/',
                { params: { offset: 0, limit: 100 } }
            );

            flush();
            // Fires callback after it emits.
            expect(FileListingService.listingErrorCallback).toHaveBeenCalledWith('main');
        };
        testScheduler.run(observableTests);
    });
});
