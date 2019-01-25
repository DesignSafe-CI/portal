import _ from 'underscore';

import FileCategoriesTemplate from './file-categories.template.html';

class FileCategoriesCtrl {
    constructor($q, Django, ProjectService, ProjectEntitiesService){
        'ngInject';
        this.Django = Django;
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.$q = $q;
    }

    $onInit() {
        this._ui = { busy: false, error: false };
    }

    removeCategory(entity) {
        let promise;
        if (_.isEmpty(this.file.uuid())) {
            promise = this.file.getMeta();
        } else {
            let my_promise = () => {
                let defer = this.$q.defer();
                defer.resolve(this.file);
                return defer.promise;
            };
            promise = my_promise();
        }
        promise.then((file)=>{
            if (!_.contains(entity.associationIds, file.uuid())){
                return undefined;
            }
            entity.associationIds = _.difference(entity.associationIds, [this.file.uuid()]);
            entity.value.files = _.difference(entity.value.files, [this.file.uuid()]);
            return entity;
        }).then( (ret) => {
            if (!ret){
                return undefined;
            }
            return this.ProjectEntitiesService.update({
                data: {
                    uuid: ret.uuid,
                    entity: ret,
                },
            });
        }).then( (ret) => {
            if (!ret) {
                return this.file;
            }
            let entity = this.project.getRelatedByUuid(ret.uuid);
            entity.update(ret);
            this.file.setEntities(this.project.uuid, this.project.getAllRelatedObjects());
            return this.file;
        });
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
