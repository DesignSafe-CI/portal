import VersionOtherSelection from './version-other-selection.template.html';
import VersionOtherCitation from './version-other-citation.template.html';
import VersionExperimentalSelection from './version-experimental-selection.template.html';
import VersionExperimentalCitation from './version-experimental-citation.template.html';
import VersionChanges from './version-changes.template.html';

class PipelineVersionCtrl {
    constructor(
        ProjectEntitiesService,
        FileOperationService,
        FileListingService,
        PublicationService,
        ProjectService,
        $uibModal,
        $state,
        $http,
        $q
    ) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.FileOperationService = FileOperationService;
        this.FileListingService = FileListingService;
        this.PublicationService = PublicationService;
        this.ProjectService = ProjectService;
        this.$uibModal = $uibModal
        this.$state = $state;
        this.$http = $http;
        this.$q = $q;
    }

    $onInit() {
        this.ui = {
            loading: true,
            success: false,
            warning: false,
            error: false,
            submitted: false,
            confirmed: false,
            selectionComp: '',
            citationComp: ''
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.filePath = this.ProjectService.resolveParams.filePath;
        this.publication = this.ProjectService.resolveParams.publication;
        this.selectedListing = this.ProjectService.resolveParams.selectedListing;
        this.revisionText = '';
        if (!this.publication) {
            this.goStart();
        } else {
            this.$q.all([
                this.ProjectService.get({ uuid: this.projectId }),
                this.ProjectEntitiesService.listEntities({ uuid: this.projectId, name: 'all' }),
                this.FileListingService.browse({
                    section: 'main',
                    api: 'agave',
                    scheme: 'private',
                    system: 'project-' + this.projectId,
                    path: this.filePath,
                }),
            ]).then(([project, entities, listing]) => {
                this.project = project;
                this.project.appendEntitiesRel(entities);
                this.listing = listing;
                this.pubData = {
                    project: { uuid: this.project.uuid, value: { projectId: this.project.value.projectId } },
                    license: this.publication.licenses
                };
                switch(this.project.value.projectType) {
                    case 'experimental': {
                        this.authors = {}
                        this.project.experiment_set.forEach((exp) => {
                            this.authors[exp.uuid] = exp.value.authors
                        });
                        // TESTING - selected publishable uuids in Exp project...
                        this.mainEntityUuids = [
                            '3849330284117683735-242ac119-0001-012',
                            '7091290346386681365-242ac118-0001-012'
                        ]
                        this.pubData['eventsList'] = [
                            {
                                name: 'designsafe.project.event',
                                uuid: '9123280811976289815-242ac119-0001-012',
                                fileObjs: [
                                    {
                                        name: '00005.jpg',
                                        path: '/Setup Documentation/00005.jpg',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                    {
                                        name: '00006.jpg',
                                        path: '/Setup Documentation/00006.jpg',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                    {
                                        name: '00007.jpg',
                                        path: '/Setup Documentation/00007.jpg',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                    {
                                        name: '00003.jpg',
                                        path: '/00003.jpg',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                    {
                                        name: '00004.jpg',
                                        path: '/00004.jpg',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                    {
                                        name: '00005.jpg',
                                        path: '/00005.jpg',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                    {
                                        name: '00007.jpg',
                                        path: '/00007.jpg',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                ],
                            },
                            {
                                name: 'designsafe.project.event',
                                uuid: '7920466498774307306-242ac116-0001-012',
                                fileObjs: [
                                    {
                                        name: '00008.jpg',
                                        path: '/Setup Documentation/00008.jpg',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                    {
                                        name: '00009.jpg',
                                        path: '/Setup Documentation/00009.jpg',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                ],
                            },
                        ],
                        this.pubData['modelConfigs'] = [
                            {
                                name: 'designsafe.project.model_config',
                                uuid: '3339522405406469655-242ac11a-0001-012',
                                fileObjs: [
                                    {
                                        name: '00002.jpg',
                                        path: '/00002.jpg',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                    {
                                        name: 'lotsotestfiles',
                                        path: '/lotsotestfiles',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'dir',
                                    },
                                ],
                            },
                            {
                                name: 'designsafe.project.model_config',
                                uuid: '7206731579572621801-242ac119-0001-012',
                                fileObjs: [
                                    {
                                        name: 'Globus Folder',
                                        path: '/Globus Folder',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'dir',
                                    },
                                ],
                            },
                        ],
                        this.pubData['analysisList'] = [
                            {
                                name: 'designsafe.project.analysis',
                                uuid: '7342634922269732375-242ac11a-0001-012',
                                fileObjs: [
                                    {
                                        name: 'objects2.pyc',
                                        path: '/objects2.pyc',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                ],
                            },
                            {
                                name: 'designsafe.project.analysis',
                                uuid: '1805800103257444841-242ac119-0001-012',
                                fileObjs: [
                                    {
                                        name: 'objekt.py',
                                        path: '/objekt.py',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                ],
                            },
                        ],
                        this.pubData['sensorLists'] = [
                            {
                                name: 'designsafe.project.sensor_list',
                                uuid: '2799945664009989655-242ac11a-0001-012',
                                fileObjs: [
                                    {
                                        name: 'sensor_details.txt',
                                        path: '/sensor_details.txt',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                    {
                                        name: 'sensor_settings.py',
                                        path: '/sensor_settings.py',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                ],
                            },
                            {
                                name: 'designsafe.project.sensor_list',
                                uuid: '8057478701564301801-242ac119-0001-012',
                                fileObjs: [
                                    {
                                        name: 'pressure_readings_sensor4test.csv',
                                        path: '/pressure_readings_sensor4test.csv',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                    {
                                        name: 'sensor_arrangment_I-A.jpg',
                                        path: '/sensor_arrangment_I-A.jpg',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                ],
                            },
                        ],
                        this.pubData['reportsList'] = [
                            {
                                name: 'designsafe.project.report',
                                uuid: '1442706179203994091-242ac118-0001-012',
                                fileObjs: [
                                    {
                                        name: 'urlstocheck.txt',
                                        path: '/urlstocheck.txt',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                ],
                            },
                            {
                                name: 'designsafe.project.report',
                                uuid: '7396616410269609495-242ac119-0001-012',
                                fileObjs: [
                                    {
                                        name: 'objekt.pyc',
                                        path: '/objekt.pyc',
                                        system: 'project-1052668239654088215-242ac119-0001-012',
                                        type: 'file',
                                    },
                                ],
                            },
                        ],
                        this.pubData['experimentsList'] = [
                            { uuid: '7091290346386681365-242ac118-0001-012' },
                            { uuid: '3849330284117683735-242ac119-0001-012' },
                        ]
                        // TESTING
                        this.ui.selectionComp = 'projects.versionExperimentalSelection'
                        this.ui.citationComp = 'projects.versionExperimentalCitation'
                        break;
                    }
                    case 'other': {
                        this.authors = this.publication.project.value.teamOrder
                        this.ui.selectionComp = 'projects.versionOtherSelection'
                        this.ui.citationComp = 'projects.versionOtherCitation'
                    }
                }
                this.ui.loading = false;
            });
        }
    }

    onBrowse(file) {
        if (file.type === 'dir') {
            this.$state.go(this.$state.current.name, {filePath: file.path.replace(/^\/+/, '')})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'private', file})
        }
    }

    submitVersion() {
        this.ui.warning = false;
        if (this.revisionText.length < 10) {
            return this.ui.warning = true;
        }
        this.ui.loading = true;
        let filePaths = (this.selectedListing
            ? this.selectedListing.listing.map((file) => file.path)
            : null);
        this.$http.post(
            '/api/projects/publication/',
            {
                /*
                for Experimental, this will need:
                selected experiments/entities
                // may not even need this shit...
                    analysisList: [
                        {
                            name: name,
                            uuid:123,
                            fileObjs:[files]
                        }
                    ]
                project *
                license *
                */
                publication: this.pubData, // this might need to be updated
                mainEntityUuids: this.mainEntityUuids,
                selectedFiles: filePaths, // make sure this doesn't bork if empty...
                revision: true,
                revisionText: this.revisionText,
                revisionAuthors: this.authors, // is a list if Other...
                status: 'publishing'
            }
        ).then((resp) => {
            this.ui.success = true;
            this.ui.submitted = true;
            this.ui.loading = false;
        }, (error) => {
            this.ui.error = true;
            this.ui.submitted = true;
            this.ui.loading = false;
        });
    }

    saveAuthors() {
        this.ui.confirmed = true;
    }

    saveSelections() {
        let selectedFiles = this.FileListingService.getSelectedFiles('main')
        if (!selectedFiles.length) {
            return;
        }
        this.selectedListing = {
            ...this.FileListingService.listings.main,
            listing: selectedFiles,
        };
        this.FileListingService.selectedListing = this.selectedListing;
    }

    undoSelections() {
        this.selectedListing = null;
    }

    navigate(destCompName) {
        let params = {
            projectId: this.projectId,
            publication: this.publication,
            selectedListing: this.selectedListing
        }
        this.$state.go(destCompName, params, { reload: true });
    }

    goStart() {
        this.navigate('projects.pipelineStart');
    }
    
    goSelection() {
        this.navigate(this.ui.selectionComp);
    }

    goCitation() {
        this.navigate(this.ui.citationComp);
    }

    goChanges() {
        this.navigate('projects.versionChanges');
    }

    goProject() {
        this.navigate('projects.view');
    }
}

export const VersionOtherSelectionComponent = {
    template: VersionOtherSelection,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const VersionOtherCitationComponent = {
    template: VersionOtherCitation,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const VersionExperimentalSelectionComponent = {
    template: VersionExperimentalSelection,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const VersionExperimentalCitationComponent = {
    template: VersionExperimentalCitation,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};

export const VersionChangesComponent = {
    template: VersionChanges,
    controller: PipelineVersionCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
