
describe('DataDepotFilePicker', function() {
    var DataBrowserService, FileListing, ProjectService,
        UserService, controller, $q, $rootScope;
    beforeEach(angular.mock.module('designsafe'));

    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', { user: 'test_user' });
        angular.mock.inject(function($componentController, _$q_, _$rootScope_,
            _UserService_, _DataBrowserService_, _FileListing_, _ProjectService_) {
            UserService = _UserService_;
            DataBrowserService = _DataBrowserService_;
            FileListing = _FileListing_;
            ProjectService = _ProjectService_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            controller = $componentController('ddfilepicker', {
                DataBrowserService: DataBrowserService,
                UserService: UserService,
                FileListing: FileListing,
                ProjectService: ProjectService
            });
            controller.resolve = { filename: null };
        });
    });

    it('Should have a called browse on init', function() {
        spyOn(controller, 'browse');
        controller.$onInit();
        expect(controller.browse).toHaveBeenCalled();
    });

    it('Should set the sources properly', ()=>{
        spyOn(controller, 'browse');
        spyOn(controller, 'listProjects');
        controller.$onInit();
        controller.setSource('community');
        expect(DataBrowserService.apiParams.fileMgr).toEqual('community');
        expect(DataBrowserService.apiParams.baseUrl).toEqual('/api/public/files');
        expect(controller.data.filesListing).toEqual(null);
        expect(controller.data.filePath).toEqual('/');
        expect(controller.data.selectedProject).toEqual(null);
        expect(controller.data.system).toEqual('designsafe.storage.community');
        expect(controller.project_list).toEqual(null);
        expect(controller.browse).toHaveBeenCalled();

        controller.setSource('myprojects');
        expect(DataBrowserService.apiParams.fileMgr).toEqual('agave');
        expect(DataBrowserService.apiParams.baseUrl).toEqual('/api/agave/files');
        expect(controller.data.filesListing).toEqual(null);
        expect(controller.data.filePath).toEqual('/');
        expect(controller.data.selectedProject).toEqual(null);
        expect(controller.project_list).toEqual(null);
        expect(controller.listProjects).toHaveBeenCalled();

        controller.setSource('mydata');
        expect(DataBrowserService.apiParams.fileMgr).toEqual('agave');
        expect(DataBrowserService.apiParams.baseUrl).toEqual('/api/agave/files');
        expect(controller.data.filesListing).toEqual(null);
        expect(controller.data.filePath).toEqual('');
        expect(controller.data.selectedProject).toEqual(null);
        expect(controller.data.system).toEqual('designsafe.storage.default');
        expect(controller.project_list).toEqual(null);
        expect(controller.browse).toHaveBeenCalled();

    });

    it('Should be able to select multiple files', ()=>{
        spyOn(controller, 'browse');
        spyOn(controller, 'listProjects');
        controller.$onInit();
        let files =  [
            { name: 'test1', system:'test.system', type:'file' },
            { name: 'test2', system:'test.system', type:'file' },
            { name: 'test3', system:'test.system', type:'file' },
            { name: 'test4', system:'test.system', type:'file' }
        ];

        controller.data.filesListing = {
            children: files
        };
        controller.selectRow(files[0]);
        controller.selectRow(files[1]);
        expect(controller.selectedFiles).toEqual([files[0], files[1]]);

        //now delselecting files should also work;
        controller.selectRow(files[1]);
        expect(controller.selectedFiles).toEqual([files[0]]);
    });

    it('Should not select a folder', ()=>{
        spyOn(controller, 'browse');
        spyOn(controller, 'listProjects');
        controller.$onInit();
        let files =  [
            { name: 'test1', system:'test.system', type:'folder' },
            { name: 'test2', system:'test.system', type:'folder' },
            { name: 'test3', system:'test.system', type:'file' },
            { name: 'test4', system:'test.system', type:'file' }
        ];

        controller.data.filesListing = {
            children: files
        };
        controller.selectRow(files[0]);
        expect(controller.selectedFiles.length).toEqual(0);
    });

    it('Should browse from breadcrumb links into a folder', ()=>{
        let mockListing = {
            children: []
        };
        spyOn(controller, 'browse');
        spyOn(DataBrowserService, 'browse').and.returnValue($q.when(mockListing));
        controller.$onInit();
        let file = { name:'test1', system:'test.system', type:'folder' };
        controller.browseFile(file);
        expect(controller.data.loading).toBe(true);
        expect(DataBrowserService.browse).toHaveBeenCalled();
        $rootScope.$digest();
        expect(controller.data.loading).toBe(false);
    });

    it('Should browse into a folder', ()=>{
        let mockListing = {
            path: '/test/1/2/3',
            children: []
        };
        spyOn(DataBrowserService, 'browse').and.returnValue($q.when(mockListing));
        controller.$onInit();
        controller.data.system = 'test.system';
        controller.data.filePath = 'test-path';
        controller.browse();
        expect(controller.data.loading).toBe(true);
        expect(DataBrowserService.browse).toHaveBeenCalledWith({ system: 'test.system', path:'test-path' });
        $rootScope.$digest();
        expect(controller.data.loading).toBe(false);
    });

});
