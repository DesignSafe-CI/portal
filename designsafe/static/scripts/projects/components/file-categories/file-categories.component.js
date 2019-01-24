import FileCategoriesTemplate from './file-categories.template.html';

class FileCategoriesCtrl {
    constructor(Django, ProjectService, ProjectEntitiesService){
        'ngInject';
        this.Django = Django;
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
    }

    $onInit() {
        this._ui = { busy: false, error: false };
    }
}

export const FileCategoriesComponent = {
    template: FileCategoriesTemplate,
    controller: FileCategoriesCtrl,
    controllerAs: '$ctrl',
    bindings: {
        project: '=',
        file: '=',
    },
};
