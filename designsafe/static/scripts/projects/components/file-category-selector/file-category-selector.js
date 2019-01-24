import FileCategorySelectorTemplate from './file-category-selector.template.html';

class FileCategorySelectorCtrl {
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

export const FileCategorySelectorComponent = {
    template: FileCategorySelectorTemplate,
    controller: FileCategorySelectorCtrl,
    controllerAs: '$ctrl',
    bindings: {
        project: '=',
    },
};
