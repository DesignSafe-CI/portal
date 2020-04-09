import { PublishedComponent } from './published.component';
import fixture from '../../fixtures/published.fixture.json';

describe('PublishedComponent', () => {
    let $rootScope, $state, $filter, Django, $window, DataBrowserService, PublishedService,
        FileListing, $uibModal, $http, $stateParams, $q, ctrl, deferred;

    
    beforeEach(() => {
        angular.mock.module('ds-data');
    });
    

    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function (_$rootScope_, _$state_, _$filter_, _Django_,
            _DataBrowserService_, _PublishedService_, _FileListing_, _$uibModal_, _$http_,
            _$window_, _$stateParams_, _$q_) {
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
            $stateParams = { filePath: '/' };
            $q = _$q_;

            deferred = _$q_.defer();
        });
    });

    
    beforeEach( () => {
        const PublishedDataCtrl = PublishedComponent.controller;
        
        ctrl = new PublishedDataCtrl(
            $state,
            $filter,
            Django,
            $window,
            DataBrowserService,
            PublishedService,
            FileListing,
            $uibModal,
            $http,
            $stateParams
        );
    });
    
    it('Should define controller', () => {
        expect(ctrl).toBeDefined();
    });

    it('Should define template', () => {
        expect(PublishedComponent.template).toBeDefined();
    });

    it('Should resolve promises', () => {
        spyOn(DataBrowserService, 'state').and.returnValue({ listing: { path: '/PRJ-2110' } });
        spyOn(PublishedService, 'getPublished').and.returnValue(deferred.promise);
        spyOn(FileListing, 'get').and.returnValue($q.defer().promise);
        spyOn(PublishedService, 'updateHeaderMetadata').and.returnValue({});
        ctrl.$stateParams = { filePath: '/PRJ-2110' };
        ctrl.$onInit();
        deferred.resolve(fixture);
        $rootScope.$digest();

        expect(PublishedService.getPublished).toHaveBeenCalledWith('PRJ-2110');
        expect(PublishedService.updateHeaderMetadata).toHaveBeenCalledWith('PRJ-2110', fixture);


    });
    
});