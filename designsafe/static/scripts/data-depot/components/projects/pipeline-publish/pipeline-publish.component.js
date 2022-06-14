import AgreementTemplate from './pipeline-agreement.html';
import PrivacyAgreementTemplate from './pipeline-privacy-agreement.html';
import PublicationMapping from '../mapping/publication-mapping.json'

class PipelinePublishCtrl {
    constructor(ProjectService, PublicationService, $http, $state) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.PublicationService = PublicationService;
        this.$http = $http;
        this.$state = $state;
    }

    $onInit() {
        this.project = this.ProjectService.current
        this.selectedListings = this.resolve.resolveParams.selectedListings;
        this.ui = {
            published: null,
            submitted: null,
            loading: true,
        }

        let publication = {
            project: { uuid: this.project.uuid, value: { projectId: this.project.value.projectId } },
            license: this.resolve.license,
        };

        if (this.project.value.projectType !== 'other') {
            let uuids = Object.keys(this.selectedListings);
            uuids.forEach((uuid) => {
                let listing = this.selectedListings[uuid];
                let entity = this.project.getRelatedByUuid(uuid);
                let attr = PublicationMapping[entity.name];
                let pubEntity = { name: entity.name, uuid: entity.uuid };
                pubEntity.fileObjs = listing.listing.map((file) => {
                    return {
                        name: file.name,
                        path: file.path,
                        system: file.system,
                        type: file.type,
                    };
                });
                if (!publication[attr] ||
                    publication[attr].length === 0 ||
                    typeof publication[attr] === 'undefined') {
                    publication[attr] = [];
                }
                publication[attr].push(pubEntity);
            });

            this.entityListName = '';
            this.mainEntityUuids = [];
            if (this.project.value.projectType === 'experimental') {
                this.entityListName = 'experimentsList';
            } else if (this.project.value.projectType === 'simulation') {
                this.entityListName = 'simulations';
            } else if (this.project.value.projectType === 'hybrid_simulation') {
                this.entityListName = 'hybrid_simulations';
            } else if (this.project.value.projectType === 'field_recon') {
                this.entityListName = 'missions';
                if ('reports' in publication) {
                    publication.reports.forEach((report) => {
                        this.mainEntityUuids.push(report.uuid);
                    });
                }
            }
            publication[this.entityListName] = [];
            this.resolve.resolveParams.primaryEntities.forEach((entity) => {
                publication[this.entityListName].push({uuid: entity.uuid});
                this.mainEntityUuids.push(entity.uuid);
            });
        } else {
            this.filePaths = this.selectedListings.listing.map(file => file.path);
        }
        this.publication = publication;
        this.PublicationService.getPublished(this.project.value.projectId)
        .then((resp) => {
            let publication = resp.data;
            if (publication.status) {
                this.ui.published = true;
            }
            this.ui.loading = false;
        }, (error) => {
            this.ui.published = false;
            this.ui.loading = false;
        });
    }

    return() {
        window.sessionStorage.clear();
        this.$state.go(
            'projects.view',
            { projectId: this.project.uuid },
            { reload: true }
        );
        this.close();
    }

    publish() {
        this.busy = true;
        this.$http.post(
            '/api/projects/publication/',
            {
                publication: this.publication,
                status: 'publishing',
                mainEntityUuids: this.mainEntityUuids,
                selectedFiles: this.filePaths
            }
        ).then((resp) => {
            this.ui.submitted = true;
            this.busy = false;
        }, (error) => {
            this.ui.error = true;
            this.ui.submitted = true;
            this.busy = false;
        });
    }
}

export const PipelinePublishComponent = {
    template: AgreementTemplate,
    controller: PipelinePublishCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
    size: 'lg',
};

export const PipelinePrivacyPublishComponent = {
    template: PrivacyAgreementTemplate,
    controller: PipelinePublishCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
    size: 'lg',
};
