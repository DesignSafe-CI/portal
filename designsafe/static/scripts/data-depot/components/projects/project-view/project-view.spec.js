import projectExptFixture from '../fixtures/project-expt.json';
import entitiesExptFixture from '../fixtures/project-entities-expt.json';
import listingExptFixture from '../fixtures/listing-expt.json';

describe('projectView', () => {
    // Component dependencies
    let ProjectEntitiesService,
        ProjectService,
        FileListingService,
        FileOperationService,
        ProjectModel,
        UserService,
        $state,
        $stateParams,
        $q,
        $uibModal;

    // Test dependencies
    let $compile, $rootScope;

    // Async service mocks
    let projectPromise, projectEntityPromise, fileListingPromise, piPromise, copiPromise;

    beforeEach(angular.mock.module('ds-data'));
    beforeEach(() => {
        angular
            .module('django.context', [])
            .constant('Django', { user: 'test_user', context: { authenticated: true } });
        angular.mock.inject(function(
            _ProjectEntitiesService_,
            _ProjectService_,
            _FileListingService_,
            _FileOperationService_,
            _UserService_,
            _ProjectModel_,
            _$state_,
            _$stateParams_,
            _$q_,
            _$uibModal_,
            _$rootScope_,
            _$compile_,
        ) {
            ProjectEntitiesService = _ProjectEntitiesService_;
            ProjectService = _ProjectService_;
            FileListingService = _FileListingService_;
            FileOperationService = _FileOperationService_;
            ProjectModel = _ProjectModel_;
            UserService = _UserService_;
            $state = _$state_;
            $stateParams = _$stateParams_;
            $q = _$q_;
            $uibModal = _$uibModal_;
            $rootScope = _$rootScope_;
            $compile = _$compile_;


            projectPromise = $q.defer();
            projectEntityPromise = $q.defer();
            fileListingPromise = $q.defer();
            piPromise = $q.defer();
            copiPromise = $q.defer();


            spyOn(ProjectService, 'get').and.returnValue(projectPromise.promise);
            spyOn(ProjectEntitiesService, 'listEntities').and.returnValue(projectEntityPromise.promise);
            spyOn(FileListingService, 'browse').and.returnValue(fileListingPromise.promise);
            spyOn(FileListingService, 'setEntities');
            spyOn(UserService, 'getPublic').and.returnValues(piPromise.promise, copiPromise.promise);
            spyOn(ProjectModel.prototype, 'appendEntitiesRel')
            spyOn(ProjectModel.prototype, 'getAllRelatedObjects').and.returnValue([])

            projectPromise.resolve(new ProjectModel(projectExptFixture));
            projectEntityPromise.resolve(entitiesExptFixture);
            fileListingPromise.resolve({});
            piPromise.resolve({userData: [
                {
                  "fname": "pi_fname",
                  "lname": "pi_lname",
                  "username": "thbrown"
                }
              ]})
            copiPromise.resolve({userData: [
                {
                  "fname": "copi_fname",
                  "lname": "copi_lname",
                  "username": "jarosenb"
                },
              ]})
            FileListingService.listings.main = listingExptFixture;
            ProjectService.current = new ProjectModel(projectExptFixture) 

            // Populate $stateParams
            $state.go('projects.view', { projectId: '1052668239654088215-242ac119-0001-012', filePath: '/' });

            $rootScope.$digest();
        });
    });

    it('renders the component', () => {
        const element = angular.element('<project-view></project-view>');
        const component = $compile(element)($rootScope);
        $rootScope.$digest();


        expect(component.find('#test-prj-title').text()).toContain('PRJ-2224 | Walk Experiment Demo')
        expect(component.find('#test-prj-pi').text()).toContain('pi_lname, pi_fname')
        expect(component.find('#test-prj-copi').text()).toContain('copi_lname, copi_fname')
        expect(component.find('#test-prj-type').text()).toContain('experimental')
        expect(component.find('.test-prj-award').text()).toContain('Awards for Experimental Greatness - 1234567')
        expect(component.find('#test-prj-related').text()).toContain('Huge Dataset I')
        expect(component.find('#test-prj-keywords').text()).toContain('project, experiment, walk, presentations, demo, test')
        
    });
});
