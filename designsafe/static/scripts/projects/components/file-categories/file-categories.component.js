import FileCategoriesTemplate from './file-categories.template.html';
import experimentalFileTags from './experimental-file-tags.json';
import simulationFileTags from './simulation-file-tags.json';
import hybridSimulationFileTags from './hybrid-simulation-file-tags.json';
import fieldReconFileTags from './field-recon-file-tags.json';
import otherFileTags from './other-file-tags.json';

class FileCategoriesCtrl {
    constructor($q, $state, Django, ProjectModel, ProjectService, PublicationService, ProjectEntitiesService, FileListingService, httpi, $scope) {
        'ngInject';
        this.Django = Django;
        this.ProjectModel = ProjectModel;
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.FileListingService = FileListingService;
        this.PublicationService = PublicationService;
        this.httpi = httpi;
        this.$q = $q;
        this.$scope = $scope;
        this.$state = $state;
    }

    $onInit() {
        this.scheme = this.FileListingService.listings[this.section].params.scheme
        this.version = 0;
        if(this.scheme === 'private') {
            this.project = this.ProjectService.current;
        }
        else {
            this.project = this.PublicationService.current.project
            if ('revision' in this.PublicationService.current) {
                this.version = this.PublicationService.current.revision;
            }
        }

        this._ui = {
            busy: false,
            error: false,
            isOther: this.project.value.projectType === 'other',
            showTags: this.showTags || false,
            editTags: this.editTags || false,
        };

        this.parentPath = this.file.path.replace(/\/[^\/]+\/?$/, '')
        this.projectResource = this.httpi.resource('/api/projects/:uuid/').setKeepTrailingSlash(true);
    }

    updateEntity(entity, file) {
        this.ProjectEntitiesService.update({
            data: { uuid: entity.uuid, entity: entity },
        })
            .then((updatedEnt) => {
                let oldEnt = this.project.getRelatedByUuid(updatedEnt.uuid);
                oldEnt.update(updatedEnt);
                this.FileListingService.setEntities(this.section, this.project.getAllRelatedObjects());
                //if (file) {
                //    file.setEntities(this.project.uuid, this.project.getAllRelatedObjects());
                //}
            })
            .finally(() => {
                this._ui.busy = false;
            });
    }

    savePrj(options) {
        return this.projectResource.post({ data: options }).then((resp) => {
            return new this.ProjectModel(resp.data);
        });
    }

    removeCategory(entity) {
        this._ui.busy = true;

        this.rmUuid = (allIds, idToRm) => {
            let index = allIds.indexOf(idToRm);
            if (index >= 0) {
                allIds.splice(index, 1);
            }
            return allIds;
        };

        if (!this.file.uuid) {
            this.FileListingService.getUuid(
                this.section,
                'agave',
                'private',
                this.file.system,
                this.file.path,
                this.file.key
            ).then((file) => {
                if (!entity.associationIds.includes(file.uuid)) {
                    return undefined;
                }
                this.rmUuid(entity.associationIds, file.uuid);
                this.rmUuid(entity.value.files, file.uuid);
                entity.value.fileObjs = (entity.value.fileObjs ?? []).filter(f => f.path !== this.file.path)
                this.updateEntity(entity, this.file);
            });
        } else {
            if (!entity.associationIds.includes(this.file.uuid)) {
                return undefined;
            }
            this.rmUuid(entity.associationIds, this.file.uuid);
            this.rmUuid(entity.value.files, this.file.uuid);
            entity.value.fileObjs = (entity.value.fileObjs ?? []).filter(f => f.path !== this.file.path)
            this.updateEntity(entity, this.file);
        }
    }

    removeProjectTag(tag) {
        this._ui.busy = true;
        let tagName = tag.tagName;

        this.project.value.fileTags = this.project.value.fileTags.filter((ft) => {
            if (ft.fileUuid === tag.fileUuid && ft.tagName === tagName) {
                return false;
            }
            return true;
        });

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

        if (!this.file.uuid) {
            this.FileListingService.getUuid(
                this.section,
                'agave',
                'private',
                this.file.system,
                this.file.path,
                this.file.key
            ).then((file) => {
                this.project.value.fileTags.push({
                    fileUuid: file.uuid,
                    tagName: tagName,
                    path: this.file.path,
                });

                let projectData = {};
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
                this.savePrj(projectData);
                this.selectedFileTag[this.project.uuid] = null;
                this._ui.busy = false;
            });
        } else {
            this.project.value.fileTags.push({
                fileUuid: this.file.uuid,
                tagName: tagName,
                path: this.file.path,
            });
            let projectData = {};
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
            this.savePrj(projectData);
            this.selectedFileTag[this.project.uuid] = null;
            this._ui.busy = false;
        }
    }

    addFileTag(entity) {
        this._ui.busy = true;
        let tagName;
        if (this.selectedFileTag[entity.uuid] === 'other' && typeof this.otherTagName !== 'undefined') {
            tagName = this.otherTagName[entity.uuid];
        } else if (this.selectedFileTag[entity.uuid] === 'Location' && typeof this.locationTag !== 'undefined') {
            tagName = this.locationTag[entity.uuid];
        } else if (this.selectedFileTag[entity.uuid] === 'Lat Long' && typeof this.latLongTag !== 'undefined') {
            tagName = this.latLongTag[entity.uuid];
        } else {
            tagName = this.selectedFileTag[entity.uuid];
        }

        if (!tagName) {
            return;
        }

        if (!this.file.uuid) {
            this.FileListingService.getUuid(
                this.section,
                'agave',
                'private',
                this.file.system,
                this.file.path,
                this.file.key
            ).then((file) => {
                entity.value.fileTags.push({
                    fileUuid: file.uuid,
                    tagName: tagName,
                    path: this.file.path,
                });
                this.updateEntity(entity);
                this.selectedFileTag[entity.uuid] = null;
            });
        } else {
            entity.value.fileTags.push({
                fileUuid: this.file.uuid,
                tagName: tagName,
                path: this.file.path,
            });
            this.updateEntity(entity);
            this.selectedFileTag[entity.uuid] = null;
        }
    }

    removeFileTag(entity, tag) {
        this._ui.busy = true;
        let tagName = tag.tagName;
        entity.value.fileTags = entity.value.fileTags.filter((ft) => {
            if (ft.fileUuid === tag.fileUuid && ft.tagName === tagName) {
                return false;
            }
            return true;
        });
        this.updateEntity(entity);
    }

    fileTagsForEntity(entity) {
        if (this.project.value.projectType === 'experimental') {
            return experimentalFileTags[entity.name];
        } else if (this.project.value.projectType === 'simulation') {
            return simulationFileTags[entity.name];
        } else if (this.project.value.projectType === 'hybrid_simulation') {
            return hybridSimulationFileTags[entity.name];
        } else if (this.project.value.projectType === 'other') {
            return otherFileTags['designsafe.project'];
        } else if (this.project.value.projectType === 'field_recon') {
            return fieldReconFileTags[entity.name];
        }
        return {};
    }

    tagsForFile(tags, path) {
        /*
        Get the file tags for a file.
        If listing files for published projects, compare the filepath
        without the projectId in the root path.
        */
        if (!tags) {
            return;
        }

        if (this.scheme === 'public') {
            return tags.filter((tag) => {
                let substring = `/${this.project.value.projectId}`;
                if (this.version > 0) {
                    substring = substring + `v${this.version}`;
                }
                return tag.path == this.file.path.replace(substring, '');
            });
        }
   
        return tags.filter((tag) => {
            return tag.path == path;
        });
    }
}

export const FileCategoriesComponent = {
    template: FileCategoriesTemplate,
    controller: FileCategoriesCtrl,
    controllerAs: '$ctrl',
    bindings: {
        file: '=',
        showTags: '=',
        editTags: '=',
        section: '<',
    },
};
