import AmendCitationTemplate from './amend-citation.template.html';

class PipelineAmendCitationCtrl {
    constructor(
        ProjectService,
        UserService,
        $uibModal,
        $state,
        $http
    ) {
        'ngInject';
        this.ProjectService = ProjectService;
        this.UserService = UserService;
        this.$uibModal = $uibModal
        this.$state = $state;
        this.$http = $http;
    }

    $onInit() {
        this.ui = {
            loading: true,
            success: false,
            error: false,
            submitted: false,
            placeholder: '',
            savedStatus: {},
            confirmed: false
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.publication = this.ProjectService.resolveParams.publication;
        this.project = this.ProjectService.resolveParams.project;
        this.amendment = this.ProjectService.resolveParams.amendment;

        if (!this.publication || !this.project) {
            this.goStart();
        }
        const prj_type = this.publication.project.value.projectType;
        this.publishedDate = new Date(this.amendment.created).getFullYear();
        this.publishedEntities = [];
        this.amendFields = [];
        this.authors = {};
        if (prj_type == 'experimental') {
            this.amendComp = 'projects.amendExperiment';
            this.ui.placeholder = 'Experiment'
            this.amendFields = [
                'experimentsList',
                'modelConfigs',
                'sensorLists',
                'eventsList',
                'analysisList',
                'reportsList'
            ]
            this.amendment.experimentsList.forEach((experiment) => {
                if (experiment.value.dois.length) {
                    this.publishedEntities.push(experiment);
                    this.authors[experiment.uuid] = experiment.authors;
                    this.ui.savedStatus[experiment.uuid] = false;
                }
            });
        }
        else if (prj_type == 'field_recon') {
            this.amendComp = 'projects.amendFieldRecon';
            this.ui.placeholder = 'Mission';
            this.amendFields = [
                'socialscience',
                'planning',
                'geoscience'
            ];

            //make sure we get the order of the primary entities first
            this.primaryEnts = [].concat(
                this.amendment.missions || [],
                this.amendment.reports || []
            );
            this.orderedPrimary = this.ordered(this.project, this.primaryEnts);

            //add ordered primary entities to published entities variable
            this.orderedPrimary.forEach((entity) => {
                if(entity.value.dois.length) {
                    this.publishedEntities.push(entity);
                    this.authors[entity.uuid] = entity.authors;
                    this.ui.savedStatus[entity.uuid] = false;
                }
            });
        } 
        else if (prj_type == 'simulation'){
            this.amendComp = 'projects.amendSimulation';
            this.ui.placeholder = 'Simulation';
            this.amendFields = [
                'models',
                'inputs',
                'outputs',
                'analysiss',
                'reports'
            ]
            this.amendment.simulationsList.forEach((simulation) => {
                if (simulation.value.dois.length) {
                    this.publishedEntities.push(simulation);
                    this.authors[simulation.uuid] = simulation.authors;
                    this.ui.savedStatus[simulation.uuid] = false;
                }
            });
        } else {
            this.goStart();
        }

        this.ui.loading = false;
    }

    submitAmend() {
        this.ui.loading = true;
        let amendments = [];
        this.amendFields.forEach((field) => {
            if (field in this.amendment) {
                this.amendment[field].forEach((entity) => {
                    amendments.push(entity);
                });
            }
        });
        this.$http.put(
            '/api/projects/amend-publication/',
            {
                projectId: this.project.value.projectId,
                authors: this.authors || undefined,
                amendments: amendments,
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
        this.ui.loading = false;
    }

    saveAuthors(entity, status) {
        this.ui.savedStatus[entity.uuid] = status;
        let statuses = Object.values(this.ui.savedStatus);
        const updateAuths = structuredClone(this.authors[entity.uuid]);
        if (status) {
            this.ui.loading = true;
            delete this.authors[entity.uuid];
        }
        if (statuses.every(value => value === true)) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.ui.confirmed = true;
        } else {
            this.ui.confirmed = false;
        }
        if (status) {
            this.authors[entity.uuid] = updateAuths;
            this.ui.loading = false;
        }
    }

    orderAuthors(up, entity) {
        var a;
        var b;
        this.saveAuthors(entity, false)
        if (up) {
            if (this.selectedAuthor.order <= 0) {
                return;
            }
            // move up
            a = this.authors[entity.uuid].find(x => x.order === this.selectedAuthor.order - 1);
            b = this.authors[entity.uuid].find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.selectedAuthor.order >= this.authors[entity.uuid].length - 1) {
                return;
            }
            // move down
            a = this.authors[entity.uuid].find(x => x.order === this.selectedAuthor.order + 1);
            b = this.authors[entity.uuid].find(x => x.order === this.selectedAuthor.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        }
    }

    goAmend() {
        this.$state.go(this.amendComp, {
            projectId: this.project.uuid,
            project: this.project,
            publication: this.publication,
            amendment: this.amendment,
            authors: this.authors,
        }, { reload: true });
    }

    goProject() {
        this.$state.go('projects.view', { projectId: this.project.uuid }, { reload: true });
    }

    goStart() {
        this.$state.go('projects.pipelineStart', { projectId: this.projectId }, { reload: true });
    }

    ordered(parent, entities) {
        let order = (ent) => {
            if (ent._ui && ent._ui.orders && ent._ui.orders.length) {
                return ent._ui.orders.find(order => order.parent === parent.uuid);
            }
            return 0;
        };
        entities.sort((a,b) => {
            if (typeof order(a) === 'undefined' || typeof order(b) === 'undefined') {
                return -1;
            }
            return (order(a).value > order(b).value) ? 1 : -1;
        });

        return entities;
    }
}

export const AmendCitationComponent = {
    template: AmendCitationTemplate,
    controller: PipelineAmendCitationCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
