import LeaveFeedbackModalTemplate from './leave-feedback-modal.template.html';

class LeaveFeedbackModalCtrl {
    constructor(TicketsService, Django) {
        'ngInject';

        this.TicketsService = TicketsService;
        this.Django = Django;
        this.success = false;
        this.error = false;
        this.submitting = false;
    }

    $onInit() {
        this.project = this.resolve.project;
        this.resetForm();
    }

    resetForm() {
        this.feedbackForm = {
            name: `${this.Django.first_name} ${this.Django.last_name}`,
            email: this.Django.email,
            body: '',
            subject: `Project Feedback for ${this.project.value.projectId}`,
            projectId: this.project.value.projectId,
            title: this.project.value.title,
        };
    }

    onSubmit() {
        this.success = false;
        this.error = false;
        this.submitting = true;

        this.TicketsService.feedback(this.feedbackForm)
            .then(
                () => {
                    this.success = true;
                    this.resetForm();
                },
                () => {
                    this.error = true;
                }
            )
            .finally(() => {
                this.submitting = false;
            });
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
