import AmendEntityTemplate from './amend-entity.template.html';

class AmendEntityCtrl {

    constructor($q, $uibModal) {
        'ngInject';
        this.$q = $q;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this.ui = {
            loading: true,
            references: false
        };
        this.entity = this.resolve.entity;
        this.missing = this.resolve.missing;
        let entCopy = JSON.parse(JSON.stringify(this.entity));
        this.form = {
            title: entCopy.value.title,
            description: entCopy.value.description
        }
        if ('refs' in this.entity.value) {
            this.ui.references = true;
            this.form.refs = entCopy.value.refs;
        }
    }

    dropEntity(group) {
        group.pop();
    }

     addEntity(group) {
        group.push({ reference: "", referencedoi: "" });
    }

    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    save() {
        if (this.ui.references) {
            this.form.refs = this.form.refs.filter(
                (ref) => ref.reference.length && ref.referencedoi.length
            );
        }
        Object.keys(this.form).forEach((key) => {
            this.entity.value[key] = this.form[key];
        })
        delete this.missing[this.entity.uuid];
        this.close();
    }

}

export const AmendEntityComponent = {
    template: AmendEntityTemplate,
    controller: AmendEntityCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&',
    },
};
