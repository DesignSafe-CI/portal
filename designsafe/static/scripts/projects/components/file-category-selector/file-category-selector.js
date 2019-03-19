import _ from 'underscore';
import FileCategorySelectorTemplate from './file-category-selector.template.html';

class FileCategorySelectorCtrl {
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

    selectCategory() {
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
            let entity = this.project.getRelatedByUuid(this.selectedUuid);
            if (_.contains(entity.associationIds, file.uuid())){
                return undefined;
            }
            entity.associationIds.push(file.uuid());
            entity.value.files.push(file.uuid());
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
        }).finally( ()=> {
            this.selectedUuid = '';
        });
    }

}

export const FileCategorySelectorComponent = {
    template: FileCategorySelectorTemplate,
    controller: FileCategorySelectorCtrl,
    controllerAs: '$ctrl',
    bindings: {
        project: '=',
        file: '=',
    },
};
