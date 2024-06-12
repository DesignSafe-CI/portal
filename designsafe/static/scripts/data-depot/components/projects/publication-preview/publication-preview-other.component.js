import PublicationPreviewOtherTemplate from './publication-preview-other.component.html';
import PublicationPopupTemplate from './publication-popup.html';
const FacilityData = require('../../../../projects/components/facility-data.json');
class PublicationPreviewOtherCtrl {

    constructor(ProjectService, FileListingService, FileOperationService, $uibModal, $state, $q) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$q = $q;
    }

    $onInit() {
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.project = this.ProjectService.resolveParams.project;
        this.listings = this.ProjectService.resolveParams.selectedListings;
        this.data = this.ProjectService.resolveParams.data;
        this.ui = {
            loading: true,
            facilities: FacilityData.facility.facilities_list,
        };

        if (!this.data) {
                // we do not display a file listing in other's preview section
                this.ProjectService.get({ uuid: this.projectId }).then((project) => {
                this.project = project;
                this.createdYear = new Date(this.project.created).getFullYear();
                this.dateCreated = new Date(this.project.created);
                this.ui.loading = false;
            });
        } else {
            this.project = this.data;
            this.createdYear = new Date(this.project.created).getFullYear();
            this.dateCreated = new Date(this.project.created);
            this.ui.loading = false;
        }    
    }

    goWork() {
        this.$state.go('projects.view', {projectId: this.project.uuid, data: this.project}, {reload: true});
    }

    getEF(str) {
        if (str !='' && str !='None') {
            let efs = this.ui.facilities;
            let ef = efs.find((ef) => {
                return ef.name === str;
            });
            return ef.label;
        }
    }

    isValid(ent) {
        if (ent && ent != '' && ent != 'None') {
            return true;
        }
        return false;
    }

    goCuration() {
        this.$state.go('projects.curation', {projectId: this.project.uuid, data: this.project}, {reload: true});
    }

    prepareModal() {
        this.$uibModal.open({
            template: PublicationPopupTemplate,
            controllerAs: '$ctrl',
            controller: ['$uibModalInstance', 'state', 'project', function($uibModalInstance, state, project) {
                this.cancel = function () {
                    $uibModalInstance.close();
                };
                this.proceed = function () {
                    $uibModalInstance.close('Continue to publication pipeline...');
                    state.go('projects.pipelineStart', {projectId: project.uuid}, {reload: true});
                };
            }],
            resolve: {
                project: this.project,
                state: this.$state,
            },
            bindings: {
                dismiss: '&',
                close: '&'
            },
            size: 'lg',
        });
    }

    listAuthors(authors) {
        const prepAuthors = authors.sort((a, b) => a.order - b.order);
        let listAuthors = [];
        prepAuthors.forEach((u, i, arr) => {
            if (i === 0 && arr.length - 1 === 0) {
                listAuthors += `${u.lname}, ${u.fname[0]}. `;
            } else if (i === 0 && arr.length - 1 > 0) {
                listAuthors += `${u.lname}, ${u.fname[0]}., `;
            } else if (i === arr.length - 1) {
                listAuthors += `${u.fname[0]}. ${u.lname}. `;
            } else {
                listAuthors += `${u.fname[0]}. ${u.lname}, `;
            }
        });
        return listAuthors;
    }

    onBrowse(file) {
        if (file.type === 'dir') {
            this.$state.go(this.$state.current.name, {filePath: file.path})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'private', file})
        }
    }

}


export const PublicationPreviewOtherComponent = {
    template: PublicationPreviewOtherTemplate,
    controller: PublicationPreviewOtherCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
