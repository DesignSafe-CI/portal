// import NeesCitationModalTemplate from './show-more.template.html';
import angular from 'angular';
import ShowMoreTemplate from './show-more.template.html';


class ShowMoreCtrl {
    constructor () {
    }
    $onInit() {
        this.expanded = false;
        this.bypass = true;

        // get height
        angular.element(document).ready(() => {
            let height = document.getElementsByClassName('show-more').clientHeight;
            if (height > 80) {
                this.bypass = false
            }
        });
    }
}

export const ShowMoreComponent = {
    template: ShowMoreTemplate,
    controller: ShowMoreCtrl,
    controllerAs: '$ctrl',
    bindings: {
        content: '<',
        label: '<'
    }
};
