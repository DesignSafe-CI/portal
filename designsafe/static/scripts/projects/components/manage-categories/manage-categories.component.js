import ManageCategoriesTemplate from './manage-categories.component.html';
import _ from 'underscore';

class ManageCategoriesCtrl {

    constructor($q, $uibModal, Django, UserService, ProjectEntitiesService, FileListingService, FileOperationService) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.UserService = UserService;
        this.Django = Django;
        this.$q = $q;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this.project = this.resolve.project;
        this.edit = this.resolve.edit;
        this.form = {
            tagSelected: '',
            projectTagToAdd: {
                optional: {},
                refs: new Array (1),
            },
        };
        this.editForm = {};
        this.ui = {
            loading: true,
            tagTypes: [],
            isAnalysis: false,
            experimental: false,
            simulation: false,
            hybridSim: false,
            showEditCategory: false,
        };
        this.fl = {
            showSelect: false,
            showHeader: false,
            showTags: true,
            editTags: false,
        };

        if (this.edit) {
            if (this.edit.constructor.name != 'ProjectEntity') {
                this.ProjectEntitiesService.get({'uuid': this.edit.uuid}).then((entity) => {
                    this.editCategory(entity);
                    this.ui.loading = false;
                })
            } else {
                this.editCategory(this.edit);
                this.ui.loading = false;
            }
        } else {
            let entities = this.project.getAllRelatedObjects();
            this.FileListingService.abstractListing(entities, this.project.uuid).then((_) => {
                this.ui.loading = false;
            });
        }

        if (this.project.value.projectType === 'experimental') {
            this.ui.experimental = true;
            this.ui.tagTypes = [
                {
                    label: 'Model Config',
                    name: 'designsafe.project.model_config',
                    yamzId: 'h1312'
                },
                {
                    label: 'Sensor Info',
                    name: 'designsafe.project.sensor_list',
                    yamzId: 'h1557'
                },
                {
                    label: 'Event',
                    name: 'designsafe.project.event',
                    yamzId: 'h1253'
                },
                {
                    label: 'Analysis',
                    name: 'designsafe.project.analysis',
                    yamzId: 'h1333'
                },
                {
                    label: 'Report',
                    name: 'designsafe.project.report',
                    yamzId: ''
                }
            ];
        } else if (this.project.value.projectType === 'simulation') {
            this.ui.simulation = true;
            this.ui.tagTypes = [
                {
                    label: 'Simulation Model',
                    name: 'designsafe.project.simulation.model',
                    yamzId: ''
                },
                {
                    label: 'Simulation Input',
                    name: 'designsafe.project.simulation.input',
                    yamzId: ''
                },
                {
                    label: 'Simulation Output',
                    name: 'designsafe.project.simulation.output',
                    yamzId: ''
                },
                {
                    label: 'Analysis',
                    name: 'designsafe.project.simulation.analysis',
                    yamzId: 'h1333'
                },
                {
                    label: 'Report',
                    name: 'designsafe.project.simulation.report',
                    yamzId: ''
                },
            ];
        } else if (this.project.value.projectType === 'hybrid_simulation') {
            this.ui.hybridSim = true;
            this.ui.tagTypes = [
                {
                    label: 'Global Model',
                    name: 'designsafe.project.hybrid_simulation.global_model',
                    yamzId: ''
                },
                {
                    label: 'Coordinator',
                    name: 'designsafe.project.hybrid_simulation.coordinator',
                    yamzId: ''
                },
                {
                    label: 'Simulation Substructure',
                    name: 'designsafe.project.hybrid_simulation.sim_substructure',
                    yamzId: ''
                },
                {
                    label: 'Experimental Substructure',
                    name: 'designsafe.project.hybrid_simulation.exp_substructure',
                    yamzId: ''
                },
                {
                    label: 'Coordinator Output',
                    name: 'designsafe.project.hybrid_simulation.coordinator_output',
                    yamzId: ''
                },
                {
                    label: 'Simulation Output',
                    name: 'designsafe.project.hybrid_simulation.sim_output',
                    yamzId: ''
                },
                {
                    label: 'Experiment Output',
                    name: 'designsafe.project.hybrid_simulation.exp_output',
                    yamzId: ''
                },
                {
                    label: 'Analysis',
                    name: 'designsafe.project.hybrid_simulation.analysis',
                    yamzId: 'h1333'
                },
                {
                    label: 'Report',
                    name: 'designsafe.project.hybrid_simulation.report',
                    yamzId: ''
                }
            ];
        }
    }

    dropEntity(group) {
        group.pop();
    }

     addEntity(group) {
        group.push(undefined);
    }

    tagType(ent) {
        this.ui.isAnalysis = false;
        if (!ent) {
            return;
        }
        var entSplit = ent.split('.');
        var entType = entSplit[entSplit.length -1];
        if (entType === 'analysis') {
            this.ui.isAnalysis = true;
        }
    }

    checkEmpty(group) {
        if (group) {
            if (group.length <= 1) {
                return true;
            } else {
                return false;
            }
        }
        return false;
    }

    cancel() {
        this.close();
    }

    addCategory() {
        var entity = this.form.projectTagToAdd;
        entity.description = entity.description || '';
        this.ProjectEntitiesService.create({
            data: {
                uuid: this.project.uuid,
                name: entity.name,
                entity: entity
            }
        })
            .then(
                (resp) => {
                    this.form.projectTagToAdd = { optional: {}, refs: new Array (1) };
                    this.project.addEntity(resp);
                },
                (err) => {
                    this.ui.error = err;
                }
            );
    }

    editCategory(cat) {
        document.getElementById('modal-header').scrollIntoView({ behavior: 'smooth' });
        this.tagType(cat.name);
        let displayName = cat.getDisplayName();
        if (cat.value.refs){
            if (!cat.value.refs.length) {
                cat.value.refs = new Array(1);
            }
        } else {
            cat.value.refs = [{
                reference: cat.value.reference,
                referencedoi: cat.value.referencedoi
            }];
        }
        var catCopy = JSON.parse(JSON.stringify( cat ));
        this.editForm = {
            entity: catCopy,
            // type: catCopy._displayName,
            type: displayName,
            title: catCopy.value.title,
            refs: catCopy.value.refs,
            description: catCopy.value.description
        };
        this.ui.showEditCategory = true;
    }

    updateCategory() {
        var pruneRefs = [];
        var cat = this.editForm.entity;
        cat.value.title = this.editForm.title;
        cat.value.description = this.editForm.description;
        this.editForm.refs.forEach((r) => {
            if (r) {
                if (r.referencedoi && r.referencedoi != '' && 
                    typeof r.reference != 'undefined' && r.reference != '') {
                    pruneRefs.push(r);
                }
            }
        });
        cat.value.refs = pruneRefs;
        this.ProjectEntitiesService.update({
            data: {
                uuid: cat.uuid,
                entity: cat
            }
        }).then((e) => {
            var ent = this.project.getRelatedByUuid(e.uuid);
            ent.update(e);
            this.editForm = {};
            this.ui.showEditCategory = false;
            return e;
        });
    }

    deleteCategory(ent) {
        if (this.editForm.entity) {
            this.editForm = {};
            this.ui.showEditCategory = false;
        }
        let confirmDelete = (msg) => {
            let modalInstance = this.$uibModal.open({
                component: 'confirmMessage',
                resolve: {
                    message: () => msg,
                },
                size: 'sm'
            });

            modalInstance.result.then((res) => {
                if (res) {
                    this.ProjectEntitiesService.delete({
                        data: {
                            uuid: ent.uuid
                        }
                    }).then((entity) => {
                        this.project.removeEntity(entity);
                    });
                }
            });
        };
        confirmDelete("Are you sure you want to delete " + ent.value.title + "?");
    }

    onBrowse(file) {
        if (file.type === 'dir') {
            return;
        } else {
            this.FileOperationService.openPreviewModal({ api: 'agave', scheme: 'private', file });
        }
    }
}

export const ManageCategoriesComponent = {
    template: ManageCategoriesTemplate,
    controller: ManageCategoriesCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
}