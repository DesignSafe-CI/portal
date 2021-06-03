import LeaveFeedbackModalTemplate from './leave-feedback-modal.template.html';

class LeaveFeedbackModalCtrl {
    constructor(TicketsService) {
        'ngInject';

        this.TicketsService = TicketsService;
        this.feedbackForm = {
            name: '',
            email: '',
            body: '',
        };
        this.error = '';
        this.submitted = false;
    }

    $onInit() {
        this.project = this.resolve.project;
    }

    onSubmit() {
        this.submitted = false;
        this.error = '';
        this.feedbackForm.subject = `Project Feedback for ${this.project.value.projectId}`;
        this.feedbackFrom.projectId = this.project.value.projectId;
        this.feedbackForm.title = this.project.value.title;
        this.TicketsService.feedback(this.feedbackForm).then(
            (resp) => {
                this.submitted = true;
                this.feedbackForm = {
                    name: '',
                    email: '',
                    body: '',
                };
            },
            (err) => {
                this.error = err;
            }
        );
    }
}

const LeaveFeedbackModalComponent = {
    template: LeaveFeedbackModalTemplate,
    controller: LeaveFeedbackModalCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};

export default LeaveFeedbackModalComponent;
