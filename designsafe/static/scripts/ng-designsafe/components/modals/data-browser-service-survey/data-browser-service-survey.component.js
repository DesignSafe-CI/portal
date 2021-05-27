import DataBrowserServiceSurveyTemplate from './data-browser-service-survey.template.html';
class DataBrowserServiceSurveyCtrl {
    constructor($http) {
        'ngInject';
        this.$http = $http;
    }

    $onInit() {
        this.reasonModel = {
            integration: false,
            train: false,
            validate: false,
            input: false,
            education: false,
        };
        (this.customReasonSelected = false), (this.customReason = '');

        this.didCollect = undefined;

        this.professionalLevel = '';
        this.customProfessionalLevel = '';

        this.comments = '';

        this.validationErrors = {
            reasons: false,
            didCollect: false,
            professionalLevel: false
        }
    }

    validate() {
        let reasons = Object.values(this.reasonModel).filter((v) => v);
        if (this.customReasonSelected) {
            reasons = [...reasons, this.customReason];
        }
        if (!reasons.length) {
            this.validationErrors.reasons = true;
            return false;
        }
        this.validationErrors.reasons = false;

        if (this.didCollect === undefined) {
            this.validationErrors.didCollect = true;
            return false;
        }
        this.validationErrors.didCollect - false;

        let professionalLevel = this.professionalLevel;
        if (professionalLevel === 'other') {
            professionalLevel = this.customProfessionalLevel;
        }
        if (!professionalLevel) {
            this.validationErrors.professionalLevel = true;
            return false;
        }
        this.validationErrors.professionalLevel = false;

        return {
            projectId: this.resolve.projectId,
            reasons: JSON.stringify(reasons),
            didCollect: this.didCollect,
            professionalLevel,
            comments: this.comments,
        };
    }

    submit() {
        const postBody = this.validate();
        if (postBody) {
            this.$http.post('/api/datafiles/microsurvey/', postBody);
            this.dismiss();
        }

    }
}

export const DataBrowserServiceSurveyComponent = {
    template: DataBrowserServiceSurveyTemplate,
    controller: DataBrowserServiceSurveyCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
