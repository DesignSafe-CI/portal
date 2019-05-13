import _ from 'underscore';
import AgreementTemplate from './pipeline-agreement.html';

const attributeMap = {
    'designsafe.project.analysis': 'analysisList',
    'designsafe.project.model_config': 'modelConfigs',
    'designsafe.project.sensor_list': 'sensorLists',
    'designsafe.project.event': 'eventsList',
    'designsafe.project.report': 'reportsList',
    'designsafe.project.simulation.model': 'models',
    'designsafe.project.simulation.input': 'inputs',
    'designsafe.project.simulation.output': 'outputs',
    'designsafe.project.simulation.analysis': 'analysiss',
    'designsafe.project.simulation.report': 'reports',
    'designsafe.project.hybrid_simulation.global_model': 'global_models',
    'designsafe.project.hybrid_simulation.coordinator': 'coordinators',
    'designsafe.project.hybrid_simulation.sim_substructure': 'sim_substructures',
    'designsafe.project.hybrid_simulation.exp_substructure': 'exp_substructures',
    'designsafe.project.hybrid_simulation.coordinator_output': 'coordinator_outputs',
    'designsafe.project.hybrid_simulation.sim_output': 'sim_outputs',
    'designsafe.project.hybrid_simulation.exp_output': 'exp_outputs',
    'designsafe.project.hybrid_simulation.analysis': 'analysiss',
    'designsafe.project.hybrid_simulation.report': 'reports',
    'designsafe.project.field_recon.collection': 'collections',
    'designsafe.project.field_recon.report': 'reports',
};

class PipelinePublishCtrl {
    constructor(ProjectService, DataBrowserService, $http) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.$http = $http;
        this.DataBrowserService = DataBrowserService;
    }

    $onInit() {
        this.project = this.resolve.project;
        this.selectedListings = this.resolve.resolveParams.selectedListings;

        let publication = {
            project: this.project,
            license: this.resolve.license,
        };

        if (this.project.value.projectType !== 'other') {
            let uuids = Object.keys(this.selectedListings);
            uuids.forEach((uuid) => {
                let listing = this.selectedListings[uuid];
                let entity = this.project.getRelatedByUuid(uuid);
                let attr = attributeMap[entity.name];
                let pubEntity = { name: entity.name, uuid: entity.uuid };
                pubEntity.fileObjs = _.map(listing.children, (child) => {
                    return {
                        name: child.name,
                        path: child.path,
                        system: child.system,
                        type: child.type
                    };
                });
                if (!publication[attr] ||
                    _.isEmpty(publication[attr]) ||
                    typeof publication[attr] === 'undefined'){
                    publication[attr] = [];
                }
                publication[attr].push(pubEntity);
            });
    
            if (this.project.value.projectType === 'experimental'){
                publication.experimentsList = [{
                    uuid: this.resolve.resolveParams.experiment.uuid,
                    authors: this.resolve.resolveParams.experiment.value.authors || [],
                    guests: this.resolve.resolveParams.experiment.value.guests || [],
                }];
            } else if (this.project.value.projectType === 'simulation') {
                publication.simulations = [{
                    uuid: this.resolve.resolveParams.experiment.uuid,
                    authors: this.resolve.resolveParams.experiment.value.authors || [],
                    guests: this.resolve.resolveParams.experiment.value.guests || [],
                }];
            } else if (this.project.value.projectType === 'hybrid_simulation') {
                publication.hybrid_simulations = [{
                    uuid: this.resolve.resolveParams.experiment.uuid,
                    authors: this.resolve.resolveParams.experiment.value.authors || [],
                    guests: this.resolve.resolveParams.experiment.value.guests || [],
                }];
            } else if (this.project.value.projectType === 'field_recon') {
                publication.missions = [{
                    uuid: this.resolve.resolveParams.experiment.uuid,
                    authors: this.resolve.resolveParams.experiment.value.authors || [],
                    guests: this.resolve.resolveParams.experiment.value.guests || [],
                }];
            }
        }
        this.publication = publication;
    }

    publish() {
        this.busy = true;
        this.$http.post(
            '/api/projects/publication/',
            {
                publication: this.publication,
                status: 'publishing'
            }
        ).then((resp) => {
            this.DataBrowserService.state().publicationStatus = resp.data.response.status;
            this.published = true;
        }).finally( () => {
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
