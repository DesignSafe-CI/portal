import _ from 'underscore';

import FileCategoriesTemplate from './file-categories.template.html';
import experimentalFileTags from './experimental-file-tags.json';
import simulationFileTags from './simulation-file-tags.json';
import hybridSimulationFileTags from './hybrid-simulation-file-tags.json';
import fieldReconFileTags from './field-recon-file-tags.json';
import otherFileTags from './other-file-tags.json';
import { values } from '@uirouter/core';

const getFileUuid = (file) => {
    let promise;
    if (_.isEmpty(file.uuid())) {
        promise = file.fetch();
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
    constructor($q, Django, ProjectModel, ProjectService, ProjectEntitiesService, httpi, $scope){
        'ngInject';
        this.Django = Django;
        this.ProjectModel = ProjectModel;
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.httpi = httpi;
        this.$q = $q;
        this.$scope = $scope;
    }

    $onInit() {
        this._ui = { 
            busy: true,
            error: false,
            isOther: this.project.value.projectType === 'other',
        };
        this.projectResource = this.httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
        getFileUuid(this.file).finally( ()=>{
            this._ui.busy=false;
        });
    }

    removeCategory(entity) {
        this._ui.busy = true;
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
        }).finally(() => {
            this._ui.busy = false;
            this.$scope.$apply();
        });
    }

    removeProjectTag(tag) {
        this._ui.busy = true;
        let tagName = tag.tagName;
        
        this.project.value.fileTags = _.filter(
            this.project.value.fileTags,
            (ft) => {
                if(ft.fileUuid === tag.fileUuid && ft.tagName === tagName){
                    return false;
                }
                return true;
            }
        );

        var projectData = {};
        projectData.uuid = this.project.uuid;
        projectData.fileTags = this.project.value.fileTags;
        projectData.title = this.project.value.title;
        projectData.pi = this.project.value.pi;
        projectData.coPis = this.project.value.coPis;
        projectData.projectType = this.project.value.projectType;
        projectData.projectId = this.project.value.projectId;
        projectData.description = this.project.value.description;
        projectData.keywords = this.project.value.keywords;
        projectData.teamMembers = this.project.value.teamMembers;
        projectData.associatedProjects = this.project.value.associatedProjects;
        projectData.awardNumber = this.project.value.awardNumber;

        this.savePrj(projectData).finally(() => {
            this._ui.busy = false;
        });
    }

    addProjectTag() {
        this._ui.busy = true;

        let tagName;
        if (this.selectedFileTag[this.project.uuid] === 'other' && typeof this.otherTagName !== undefined) {
            tagName = this.otherTagName[this.project.uuid];
        } else {
            tagName = this.selectedFileTag[this.project.uuid];
        }

        getFileUuid(this.file).then((file) => {
            this.project.value.fileTags.push({
                fileUuid: file.uuid(),
                tagName: tagName
            });
        }).then(() => {
            var projectData = {};
            projectData.uuid = this.project.uuid;
            projectData.fileTags = this.project.value.fileTags;
            projectData.title = this.project.value.title;
            projectData.pi = this.project.value.pi;
            projectData.coPis = this.project.value.coPis;
            projectData.projectType = this.project.value.projectType;
            projectData.projectId = this.project.value.projectId;
            projectData.description = this.project.value.description;
            projectData.keywords = this.project.value.keywords;
            projectData.teamMembers = this.project.value.teamMembers;
            projectData.associatedProjects = this.project.value.associatedProjects;
            projectData.awardNumber = this.project.value.awardNumber;
    
            return this.savePrj(projectData);
        }).then(() => {
            this.selectedFileTag[this.project.uuid] = null;
            this.$scope.$apply();
        }).finally( ()=> {
            this._ui.busy = false;
        });
    }

    savePrj(options) {
        return this.projectResource.post({ data: options }).then((resp) => {
            return new this.ProjectModel(resp.data);
        });
    }

    addFileTag(entity) {
        this._ui.busy = true;
        let tagName;
        if (this.selectedFileTag[entity.uuid] === 'other' && typeof this.otherTagName !== undefined) {
            tagName = this.otherTagName[entity.uuid];
        } else {
            tagName = this.selectedFileTag[entity.uuid];
        }

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
        } else if (this.project.value.projectType === 'other'){
            return otherFileTags['designsafe.project'];
        } else if (this.project.value.projectType === 'field_recon') {
            return fieldReconFileTags[entity.name];
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
        categoryListing: '=',
        tagListing: '=',
    },
};
