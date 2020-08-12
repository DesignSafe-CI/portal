import _ from 'underscore';
import { of, forkJoin } from 'rxjs';
import FileCategorySelectorTemplate from './file-category-selector.template.html';

class FileCategorySelectorCtrl {
    constructor($q, Django, ProjectService, DataBrowserService, FileListingService, ProjectEntitiesService, $scope) {
        'ngInject';
        this.Django = Django;
        this.ProjectService = ProjectService;
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.DataBrowserService = DataBrowserService;
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
        this._ui.busy = true;

        var promises = [];
        var promise;
        /*
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
        */
        const uuidObservables = []
        inputs.forEach(file => {
            if (!file.uuid) {
                uuidObservables.push(this.FileListingService.getUuid(this.section, 'agave', 'private', file.system, file.path, file.key))
            }
            else {
                uuidObservables.push(of(file))
            }
        })

        forkJoin(uuidObservables).subscribe((files) => {
            let entity = this.project.getRelatedByUuid(this.selectedUuid);
            files.forEach((file) => {
                if (entity.associationIds.includes(file.uuid)) {
                    return undefined;
                }
                entity.associationIds.push(file.uuid);
                entity.value.files.push(file.uuid);
            });

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
