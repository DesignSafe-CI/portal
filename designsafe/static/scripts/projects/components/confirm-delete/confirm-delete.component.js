import ConfirmDeleteTemplate from './confirm-delete.component.html';
import _ from 'underscore';

class ConfirmDeleteCtrl {

    constructor(ProjectEntitiesService, ProjectModel) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.ProjectModel = ProjectModel;
    }

    $onInit() {
        this.ent = this.resolve.options;
        this._ui = {displayType: ''};

        if (typeof this.ent.username !== 'undefined') {
            this._ui.displayType = 'name';
        } else {
            this._ui.displayType = 'category';
        }
    }

    delete () {
        this.close({$value: true});
    }

    cancel() {
        this.close();
    }


}

export const ConfirmDeleteComponent = {
    template: ConfirmDeleteTemplate,
    controller: ConfirmDeleteCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
};
