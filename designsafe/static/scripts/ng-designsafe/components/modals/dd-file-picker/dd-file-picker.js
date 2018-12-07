import _ from 'underscore';
import template from './dd-file-picker.html';

class DataDepotFilePickerCtrl {
    constructor(DataBrowserService, UserService, FileListing, ProjectService) {
        'ngInject';
        this.DataBrowserService = DataBrowserService;
        this.UserService = UserService;
        this.FileListing = FileListing;
        this.ProjectService = ProjectService;
    }

    $onInit () {
        this.selectedFiles = [];
        this.picker = this.picker || 'file';
        this.data = {
            busyListingPage: true,
            filesListing: null,
            wants: false,
            loading: false,
            systemsList: [],
            system: 'designsafe.storage.default',
            dirPath: [],
            offset: 0,
            filePath: '',
            source: 'mydata',
            selectedProject: null,
            projectSelected: false,
            publishedSelected: false
        };
        // console.log(this.filename);
        //filename comes from the modal controller bindings
        this.saveas = { filename: this.resolve.filename };
        this.selected = null;
        this.single = this.resolve.single;
        // If there was a previous listing, bring them back to that place...
        if (this.DataBrowserService.state().listing) {
            this.data.system = this.DataBrowserService.state().listing.system;
            this.data.filePath = this.DataBrowserService.state().listing.path;
            this.data.dirPath = this.data.filePath.split('/');
            if (this.data.system.startsWith('project')) {
                this.data.source = 'myprojects';
                this.data.projectSelected = true;
                var project_uuid = this.data.system.replace('project-', '');
                this.ProjectService.get({ uuid:project_uuid }).then((resp)=> {
                    this.data.selectedProject = resp;
                });

            } else if (this.data.system === 'designsafe.storage.default') {
                this.data.source = 'mydata';
            } else if (this.data.system === 'designsafe.storage.community'){
                this.data.source = 'community';
            } else {
                this.data.source = 'public';
            }
        }

        this.browse();
    }

    ok () {
        this.modalInstance.close({ selected:this.selectedFiles, saveas:this.saveas.filename, location:this.selected });
    }

    cancel () {
        this.modalInstance.dismiss('cancel');
    }

    listProjects () {
        this.data.loading=true;
        this.data.selectedProject = null;
        this.ProjectService.list().then( (resp)=> {
            this.data.project_list = resp;
            this.data.loading = false;
            this.data.projectSelected = false;
        });
    }

    listPublished() {
        this.data.loading=true;
        this.data.selectedPublished = null;
        this.setSource('public');
    }

    selectPublished (pub) {
        this.data.system = pub.system;
        this.data.filePath = pub.path;
        this.data.publishedSelected = true;
        this.data.selectedPublished = pub;
        this.selected = pub;
        this.browse();
    }

    selectProject (project) {
        this.data.system = 'project-' + project.uuid;
        this.data.filePath = '/';
        this.data.projectSelected = true;
        this.data.selectedProject = project;
        this.selected = project;
        this.browse();
    }

    browse () {
        this.data.loading = true;
        this.data.error = null;
        this.DataBrowserService.browse({ system: this.data.system, path:this.data.filePath }).then((resp)=> {
            this.data.filesListing = resp;
            this.selected = resp;
            this.data.loading = false;
            this.data.filePath = this.data.filesListing.path;
            this.data.dirPath = this.data.filePath.split('/');
        }, (err)=> {
            this.data.loading = false;
            this.data.error = 'Something went wrong';
        });
    }

    setSource (src) {
        this.data.source = src;
        this.data.error = null;
        this.data.filePath = '/';
        this.data.filesListing = null;
        this.data.selectedProject = null;
        this.selected = null;
        this.data.project_list = null;
        this.data.published_list = null;
        if (this.data.source === 'myprojects') {
            this.DataBrowserService.apiParams.fileMgr = 'agave';
            this.DataBrowserService.apiParams.baseUrl = '/api/agave/files';
            this.data.filesListing = null;
            this.data.filePath = '/';
            this.data.dirPath = [];
            this.listProjects();
        } else if  (this.data.source == 'community') {
            this.DataBrowserService.apiParams.fileMgr = 'community';
            this.DataBrowserService.apiParams.baseUrl = '/api/public/files';
            this.data.filesListing = null;
            this.data.filePath = '/';
            this.data.selectedProject = null;
            this.data.system = 'designsafe.storage.community';
            this.project_list = null;
            this.browse();
        } else if  (this.data.source == 'public') {
            this.DataBrowserService.apiParams.fileMgr = 'public';
            this.DataBrowserService.apiParams.baseUrl = '/api/public/files';
            this.data.system = 'nees.public';
            this.data.filePath = '/';
            this.data.filesListing = null;
            this.data.publishedSelected == false;
            this.browse();
        } else {
            this.DataBrowserService.apiParams.fileMgr = 'agave';
            this.DataBrowserService.apiParams.baseUrl = '/api/agave/files';
            this.data.filesListing = null;
            this.data.filePath = '';
            this.data.selectedProject = null;
            this.data.system = 'designsafe.storage.default';
            this.project_list = null;
            this.browse();
        }
    }

    selectRow (file) {
        if (file.type !== 'file') return;
        if (this.single) {
            this.data.filesListing.children.forEach((d)=> {
                d.selected = false;
            });
            this.selectedFiles = [];
        }
        if (this.saveas.filename) {
            this.saveas.filename = file.name;
        } else {
            this.selectedFiles.push(file);
            file.selected = file.selected ? false : true;

            //filter out the file if it was previously selected
            if (!file.selected) {
                this.selectedFiles = _.reject(this.selectedFiles, (d)=>{
                    return d.name === file.name && d.system === file.system;
                });
            }
        }
    }

    browseTrail ($event, index){
        $event.stopPropagation();
        $event.preventDefault();
        if (this.data.dirPath.length <= index+1){
            return;
        }
        this.browseFile({ type: 'dir',
            system: this.data.filesListing.system,
            resource: this.data.filesListing.resource,
            path: this.data.dirPath.slice(0, index+1).join('/') });
    }

    browseFile (file){
        if (file.type !== 'folder' && file.type !== 'dir'){
            return;
        }

        this.data.filesListing = null;
        this.data.loading = true;
        this.data.error = null;
        this.DataBrowserService.browse(file)
            .then((listing)=> {
                this.data.filesListing = listing;
                if (this.data.filesListing.children.length > 0){
                    this.data.filePath = this.data.filesListing.path;
                    this.data.dirPath = this.data.filePath.split('/');
                }
                this.selected = listing;
                this.data.loading = false;
            }, (err)=>{
                this.data.error = 'Unable to list the selected data source';
                this.data.loading = false;
            });
    }

    displayName(file) {
        if (file.systemId === 'nees.public') {
            if (file.name === '.' ) {
                return '..';
            }
            return file.projecTitle || file.name;

        }
        if (file.name === '.' ) {
            return '..';
        }
        return file.name;


    }

    renderName (file){
        if (file.meta) {
            return file.meta.title;
        }
        if (typeof file.metadata === 'undefined' ||
      file.metadata === null ||
      _.isEmpty(file.metadata)){
            return file.name;
        }
        return file.name;
    }

    scrollToBottom (){
        this.data.loading = this.DataBrowserService.loadingMore;
        this.DataBrowserService.scrollToBottom().then((resp)=> {
            this.data.loading = false;
        }, (err)=> {
            this.data.loading =  false;
        });

    }

}

export const DataDepotFilePickerComponent = {
    controller: DataDepotFilePickerCtrl,
    controllerAs: '$ctrl',
    template: template,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    }
};
