import { has } from 'underscore';
class NeesPublicationCtrl {
    constructor($stateParams, $state, PublicationService, FileListingService, FileOperationService, $uibModal) {
        'ngInject';
        this.$stateParams = $stateParams;
        this.$state = $state;
        this.PublicationService = PublicationService;
        this.$uibModal = $uibModal;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.onBrowse = this.onBrowse.bind(this);
    }

    $onInit() {
        this.data = {
            customRoot: {
                name: 'Published',
                href: this.$state.href('publicData', { systemId: 'nees.public', filePath: '' }),
                system: 'nees.public',
                path: '/',
            },
        };

        //Retrieve NEES project name using path
        this.projectName = this.$stateParams.filePath.replace(/^\/+/, '').split('.')[0];
        this.PublicationService.getNeesPublished(this.projectName).then((res) => {
            this.project = res.data;
            if (has(res.data, 'metadata')) {
                this.PublicationService.updateNeesMetatags(res.data.metadata);
            }
            this.breadcrumbParams = {
                path: this.$stateParams.filePath,
                skipRoot: true,
                root: {label: this.project.name, path: this.project.path}
            }
            
        });
        this.FileListingService.browse({ section: 'main', api: 'agave', scheme: 'public', system: 'nees.public', path: this.$stateParams.filePath });

    }
    onBrowse(file) {
        if (file.type === 'dir') {
            this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, '')})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'public', file})
        }
    }
    showExp (exp) {
        this.$uibModal.open({
            component: 'neesCitationModal',
            resolve: {
                experiment: () => exp
            }
        });
    }   
    showDoiList(prj) {
        this.$uibModal.open({
            component: 'neesDoiList',
            resolve: {
                project: () => prj
            }
        });
    }
}

export const NeesPublishedComponent = {
    controller: NeesPublicationCtrl,
    template: require('./nees-publication.template.html'),
};
