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
            placeholder: 'Experiment',
            savedStatus: {}
        };
        this.projectId = this.ProjectService.resolveParams.projectId;
        this.publication = this.ProjectService.resolveParams.publication;
        this.project = this.ProjectService.resolveParams.project;
        this.amendment = this.ProjectService.resolveParams.amendment;
        this.authors = this.ProjectService.resolveParams.authors;
        this.publishedEntities = this.ProjectService.resolveParams.publishedEntities;

        this.ui.loading = false;
    }

    submitAmend() {
        this.ui.loading = true;
        this.$http.post(
            '/api/projects/amend-publication/',
            {
                projectId: this.project.value.projectId,
                authors: this.authors || undefined
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

    configureCitations() {
        this.publishedEntities.forEach((ent) => {
            this.authors[ent.uuid] = ent.value.authors;
            this.ui.savedStatus[ent.uuid] = false;
        })

        this.publishedKeyNames.forEach((key) => {
            this.publication[key].forEach((pubEnt) => {
                if (pubEnt.uuid in this.authors) {
                    this.authors[pubEnt.uuid] = pubEnt.authors;
                }
            });
        });
    }

    saveEntAuthors(entity, status) {
        this.ui.savedStatus[entity.uuid] = status;
        let statuses = Object.values(this.ui.savedStatus);
        if (statuses.every(value => value === true)) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.ui.confirmed = true;
        } else {
            this.ui.confirmed = false;
        }
    }

    sortAuthors(authors) {
        if (authors.length && 'order' in authors[0]) return authors;
        const sortedAuthors = authors.sort((a, b) => a.order - b.order);
        return sortedAuthors;
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
