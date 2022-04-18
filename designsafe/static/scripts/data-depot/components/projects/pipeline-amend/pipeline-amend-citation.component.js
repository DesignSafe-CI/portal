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
        /*BOOKMARK:
        - Get this citation page working, need to sort authors and send back
        the amended data.
        - Get the publication preview working
        - Sort out the date issue
        - Check back for things marked "TODO"
        - Any spare time can be used to clean up
        */
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
            this.ui.placeholder = 'Experiment'
            this.amendFields = [
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
        } else {
            this.goStart();
        }

        

        this.ui.loading = false;
    }

    submitAmend() {
        this.ui.loading = true;
        let amendments = [];
        this.amendFields.forEach((field) => {
            this.amendment[field].forEach((entity) => {
                amendments.push(entity);
            });
        });
        this.$http.post(
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
    }

    saveAuthors(entity, status) {
        this.ui.savedStatus[entity.uuid] = status;
        let statuses = Object.values(this.ui.savedStatus);
        if (statuses.every(value => value === true)) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.ui.confirmed = true;
        } else {
            this.ui.confirmed = false;
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
        this.$state.go('projects.amendExperiment', {
            projectId: this.project.uuid,
            project: this.project,
            publication: this.publication,
            amendment: this.amendment,
            authors: this.authors,
            publishedEntities: this.publishedEntities,
        }, { reload: true });
    }

    goProject() {
        this.$state.go('projects.view', { projectId: this.project.uuid }, { reload: true });
    }

    goStart() {
        this.$state.go('projects.pipelineStart', { projectId: this.projectId }, { reload: true });
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
