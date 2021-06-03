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

    onSubmit() {
        this.submitted = false;
        this.error = '';
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
