import _ from 'underscore';
import { of, forkJoin } from 'rxjs';
import FileCategorySelectorTemplate from './file-category-selector.template.html';

class FileCategorySelectorCtrl {
    constructor($q, Django, ProjectService, FileListingService, ProjectEntitiesService, $scope) {
        'ngInject';
        this.Django = Django;
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.FileListingService = FileListingService;
        this.$q = $q;
        this.$scope = $scope;
    }

    $onInit() {
        this._ui = { busy: false, error: false };
        this.project = this.ProjectService.current;
    }

    selectMultiple() {
        // hides dropdowns for additionally selected files
        const selected = this.FileListingService.listings[this.section].selectedFiles;
        if (selected.length > 1) {
            if (this.file.key === selected[0].key) {
                return true;
            } else if (this.file.selected) {
                return false;
            }
            return true;
        } else {
            return true;
        }
    }

    saveSelection() {
        if (this.FileListingService.listings[this.section].selectedFiles.length> 1) {
            this.categorizeFiles(this.FileListingService.listings[this.section].selectedFiles);
        } else {
            this.categorizeFiles([this.file]);
        }
    }

    categorizeFiles(inputs) {
        /* TODO:
        We created new bulk metadata operations that are accessible in agavepy. These
        types of categorization calls could be handled much more effeciently on the back
        end by creating or updating these service methods to use agavepyclient.meta.bulkUpdate().
        (Unless Tapis v3 is already available)
        */
        this._ui.busy = true;
        const uuidPromises = []
        inputs.forEach(file => {
            if (!file.uuid) {
                uuidPromises.push(this.FileListingService.getUuid(this.section, 'agave', 'private', file.system, file.path, file.key))
            }
            else {
                let defer = this.$q.defer();
                defer.resolve(file);
                const promise = defer.promise;
                uuidPromises.push(promise)
            }
        })

        this.$q.all(uuidPromises).then((files) => {
            let entity = this.project.getRelatedByUuid(this.selectedUuid);
            files.forEach((file) => {
                if (entity.associationIds.includes(file.uuid)) {
                    return undefined;
                }
                entity.associationIds.push(file.uuid);
                entity.value.files.push(file.uuid);
            });
            entity.value.fileObjs = [...(entity.value.fileObjs ?? []), 
                                     ...files.map(f => ({path: f.path, 
                                                         system: f.system, 
                                                         type: f.type, 
                                                         name: f.name, 
                                                         length: f.length,
                                                         uuid: f.uuid,
                                                         lastModified: f.lastModified}))]
            if (!entity) {
                return undefined;
            }
            this.ProjectEntitiesService.update({
                data: {
                    uuid: entity.uuid,
                    entity,
                },
            })
                .then((ret) => {
                    if (!ret) {
                        return inputs;
                    }
                    let entity = this.project.getRelatedByUuid(ret.uuid);
                    entity.update(ret);
                    this.FileListingService.setEntities(this.section, this.project.getAllRelatedObjects())
                    return inputs;
                })
                .finally(() => {
                    this._ui.busy = false;
                    this.selectedUuid = '';
                });
        });
    }
}

export const FileCategorySelectorComponent = {
    template: FileCategorySelectorTemplate,
    controller: FileCategorySelectorCtrl,
    controllerAs: '$ctrl',
    bindings: {
        section: '<',
        file: '=',
    },
};
