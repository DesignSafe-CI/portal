import ManageAuthorsTemplate from './manage-authors.template.html';

class ManageAuthorsCtrl {
    constructor() {
        'ngInject';
    }

    $onInit() {
        this.title;
        this.label;
        this.authors;
        this.selectedMember;
        this.currentDate = new Date().getFullYear();
    }
    // funcs
    orderMembers(up) {
        this.saved = false;
        var a;
        var b;
        if (up) {
            if (this.selectedMember.order <= 0) {
                return;
            }
            // move up
            a = this.authors.find(x => x.order === this.selectedMember.order - 1);
            b = this.authors.find(x => x.order === this.selectedMember.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        } else {
            if (this.selectedMember.order >= this.authors.length - 1) {
                return;
            }
            // move down
            a = this.authors.find(x => x.order === this.selectedMember.order + 1);
            b = this.authors.find(x => x.order === this.selectedMember.order);
            a.order = a.order + b.order;
            b.order = a.order - b.order;
            a.order = a.order - b.order;
        }
    }
}

export const ManageAuthorsComponent = {
    template: ManageAuthorsTemplate,
    controller: ManageAuthorsCtrl,
    controllerAs: '$ctrl',
    bindings: {
        title: '<',
        label: '<',
        authors: '=',
        submit: '&?'
    }
};
