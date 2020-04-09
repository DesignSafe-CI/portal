import _ from 'underscore';
import FileCategorySelectorTemplate from './file-category-selector.template.html';

class FileCategorySelectorCtrl {
    constructor($q, Django, ProjectService, DataBrowserService, ProjectEntitiesService){
        'ngInject';
        this.Django = Django;
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.DataBrowserService = DataBrowserService;
        this.$q = $q;
    }

    $onInit() {
        this._ui = { busy: false, error: false };
        this.state = this.DataBrowserService.state();
    }

    selectMultiple() {
        // hides dropdowns for additionally selected files
        if (this.state.selected.length > 1) {
            if (this.file == this.state.selected[0]) {
                return true;
            } else if (this.state.selected.includes(this.file)) {
                return false;
            }
            return true;
        } 
        return true;
        
    }

    saveSelection() {
        if (this.state.selected.length > 1) {
            this.categorizeFiles(this.state.selected);
        } else {
            this.categorizeFiles([this.file]);
        }
    }

    categorizeFiles(inputs) {
        this._ui.busy = true;

        var promises = [];
        var promise;

        inputs.forEach((file) => {
            if (_.isEmpty(file.uuid())) {
                promise = file.getMeta();
            } else {
                let my_promise = () => {
                    let defer = this.$q.defer();
                    defer.resolve(file);
                    return defer.promise;
                };
                promise = my_promise();
            }
            promises.push(promise);
        });

        this.$q.all(promises).then((files) => {
            let entity = this.project.getRelatedByUuid(this.selectedUuid);
            files.forEach((file) => {
                if (_.contains(entity.associationIds, file.uuid())){
                    return undefined;
                }
                entity.associationIds.push(file.uuid());
                entity.value.files.push(file.uuid());
            });
            return entity;
        }).then((ret) => {
            if (!ret){
                return undefined;
            }
            return this.ProjectEntitiesService.update({
                data: {
                    uuid: ret.uuid,
                    entity: ret,
                },
            });
        }).then((ret) => {
            if (!ret) {
                return inputs;
            }
            let entity = this.project.getRelatedByUuid(ret.uuid);
            entity.update(ret);
            
            inputs.forEach((file) => {
                file.setEntities(this.project.uuid, this.project.getAllRelatedObjects());
            });
            return inputs;
        }).finally( ()=> {
            this._ui.busy = false;
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
