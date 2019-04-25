import _ from 'underscore';

import FileCategoriesTemplate from './file-categories.template.html';
import experimentalFileTags from './experimental-file-tags.json';
import simulationFileTags from './simulation-file-tags.json';
import hybridSimulationFileTags from './hybrid-simulation-file-tags.json';

const getFileUuid = (file) => {
    let promise;
    if (_.isEmpty(file.uuid())) {
        promise = file.getMeta();
    } else {
        let my_promise = () => {
            let prm = new Promise((resolve)=>{
                resolve(file);
            });
            return prm;
        };
        promise = my_promise();
    }
    return promise;
};

class FileCategoriesCtrl {
    constructor($q, Django, ProjectService, ProjectEntitiesService, $scope){
        'ngInject';
        this.Django = Django;
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.$q = $q;
        this.$scope = $scope;
    }

    $onInit() {
        this._ui = { busy: true, error: false };
        getFileUuid(this.file).then(()=>{this._ui.busy=false;});
    }

    removeCategory(entity) {
        getFileUuid(this.file).then((file)=>{
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

    addFileTag(entity) {
        this._ui.busy = true;
        let tagName = this.otherTagName[entity.uuid] || this.selectedFileTag[entity.uuid];
        getFileUuid(this.file).then((file)=>{
            entity.value.fileTags.push({
                fileUuid: file.uuid(),
                tagName: tagName
            });
        }).then(() => {
            return this.ProjectEntitiesService.update({
                data: {
                    uuid: entity.uuid,
                    entity: entity,
                }
            });
        }).then((res) => {
            let prjEntity = this.project.getRelatedByUuid(res.uuid);
            prjEntity.update(res);
        }).finally(() => {
            this._ui.busy = false;
            this.selectedFileTag[entity.uuid] = null;
            this.$scope.$apply();
        });
    }

    removeFileTag(entity, tag) {
        this._ui.busy = true;
        let tagName = tag.tagName;
        
        entity.value.fileTags = _.filter(
            entity.value.fileTags,
            (ft) => {
                if(ft.fileUuid === tag.fileUuid && ft.tagName === tagName){
                    return false;
                }
                return true;
            }
        );
    
        this.ProjectEntitiesService.update({
            data: {
                uuid: entity.uuid,
                entity: entity,
            }
        }).then((res) => {
            let prjEntity = this.project.getRelatedByUuid(res.uuid);
            prjEntity.update(res);
        }).finally(() => {
            this._ui.busy = false;
        });
    }

    fileTagsForEntity(entity) {
        if (this.project.value.projectType === 'experimental'){
            return experimentalFileTags[entity.name];
        } else if (this.project.value.projectType === 'simulation') {
            return simulationFileTags[entity.name];
        } else if (this.project.value.projectType === 'hybrid_simulation') {
            return hybridSimulationFileTags[entity.name];
        }
        return {};
    }

    tagsForFile(tags) {
        return _.filter(tags, (tag) => { return tag.fileUuid == this.file.uuid(); });
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
