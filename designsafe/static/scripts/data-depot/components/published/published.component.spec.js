import { PublishedComponent } from './published.component';
import fixture from '../../fixtures/published.fixture.json';

describe('PublishedComponent', () => {
    let $rootScope, $state, $filter, Django, $window, PublicationService, FileOperationService,
        FileListingService, $uibModal, $http, $stateParams, $q, ctrl, deferred;

    
    beforeEach(() => {
        angular.mock.module('ds-data')
    })
    

    beforeEach(() => {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function (_$rootScope_, _$state_, _$filter_, _Django_,
            _FileOperationService_, _PublicationService_, _FileListingService_, _$uibModal_, _$http_,
            _$window_, _$stateParams_, _$q_) {
            $rootScope = _$rootScope_;
            $state = _$state_;
            $filter = _$filter_;
            Django = _Django_;
            $window = _$window_;
            FileListingService = _FileListingService_;
            FileOperationService = _FileOperationService_;
            PublicationService = _PublicationService_;
            $uibModal = _$uibModal_;
            $http = _$http_;
            $stateParams = {filePath: '/'};
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
            FileListingService,
            FileOperationService,
            PublicationService,
            $uibModal,
            $http,
            $stateParams
        );
    })
    
    it('Should define controller', () => {
        expect(ctrl).toBeDefined();
    });

    it('Should define template', () => {
        expect(PublishedComponent.template).toBeDefined()
    })
    
})