import ManageCategoriesTemplate from './manage-categories.component.html';
import _ from 'underscore';

class ManageCategoriesCtrl {

    constructor($q, $uibModal, Django, UserService, ProjectEntitiesService, DataBrowserService, FileListing) {
        'ngInject';
        this.ProjectEntitiesService = ProjectEntitiesService;
        this.FileListing = FileListing;
        this.browser = DataBrowserService.state();
        this.UserService = UserService;
        this.Django = Django;
        this.$q = $q;
        this.$uibModal = $uibModal;
    }

    $onInit() {
        this.browser = this.resolve.browser;
        this.edit = this.resolve.edit;
        this.browser.categories = [];
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
            this.editCategory(this.edit);
            this.ui.loading = false;
        } else {
            let entities = this.browser.project.getAllRelatedObjects();
            var allFilePaths = [];
            this.browser.listings = {};
            var apiParams = {
                fileMgr: 'agave',
                baseUrl: '/api/agave/files',
                searchState: 'projects.view.data',
            };
            entities.forEach((entity) => {
                this.browser.listings[entity.uuid] = {
                    name: this.browser.listing.name,
                    path: this.browser.listing.path,
                    system: this.browser.listing.system,
                    trail: this.browser.listing.trail,
                    children: [],
                };
                allFilePaths = allFilePaths.concat(entity._filePaths);
            });
            this.setFilesDetails = (paths) => {
                let filePaths = [...new Set(paths)];
                var p = this.$q((resolve, reject) => {
                    var results = [];
                    var index = 0;
                    var size = 5;
                    var fileCalls = filePaths.map(filePath => {
                        return this.FileListing.get(
                            { system: 'project-' + this.browser.project.uuid, path: filePath }, apiParams
                        ).then((resp) => {
                            if (!resp) {
                                return;
                            }
                            var allEntities = this.browser.project.getAllRelatedObjects();
                            var entities = allEntities.filter((entity) => {
                                return entity._filePaths.includes(resp.path);
                            });
                            entities.forEach((entity) => {
                                resp._entities.push(entity);
                                this.browser.listings[entity.uuid].children.push(resp);
                            });
                            return resp;
                        });
                    });
    
                    var step = () => {
                        var calls = fileCalls.slice(index, (index += size));
                        if (calls.length) {
                            this.$q.all(calls)
                                .then((res) => {
                                    results.concat(res);
                                    step();
                                    return res;
                                })
                                .catch(reject);
                        } else {
                            resolve(results);
                        }
                    };
                    step();
                });
                return p.then(
                    (results) => {
                        this.ui.loading = false;
                        return results;
                    },
                    (err) => {
                        this.ui.loading = false;
                        this.browser.ui.error = err;
                    });
            };
            this.setFilesDetails(allFilePaths);
        }

        if (this.browser.project.value.projectType === 'experimental') {
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
        } else if (this.browser.project.value.projectType === 'simulation') {
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
        } else if (this.browser.project.value.projectType === 'hybrid_simulation') {
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
                // {
                //     label: 'Outputs',
                //     name: 'designsafe.project.hybrid_simulation.output',
                //     yamzId: ''
                // },
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

        // if (this.edit) {
        //     this.editCategory(this.edit);
        // }
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
        var nameComps = entity.name.split('.');
        var name = nameComps[nameComps.length - 1];
        entity.description = entity.description || '';
        if (typeof this.browser.files !== 'undefined') {
            entity.filePaths = _.map(this.browser.files,
                (file) => {
                    return file.path;
                });
        }
        this.ProjectEntitiesService.create({
            data: {
                uuid: this.browser.project.uuid,
                name: entity.name,
                entity: entity
            }
        })
            .then(
                (resp) => {
                    this.form.projectTagToAdd = { optional: {}, refs: new Array (1) };
                    this.browser.project.addEntity(resp);
                    this.ui.error = false;
                },
                (err) => {
                    this.ui.error = true;
                    this.error = err;
                }
            );
    }

    editCategory(cat) {
        this.tagType(cat.name);
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
            type: catCopy._displayName,
            title: catCopy.value.title,
            refs: catCopy.value.refs,
            description: catCopy.value.description
        };
        this.ui.showEditCategory = true;
        document.getElementById("form-top").scrollIntoView({behavior: "smooth"});
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
            var ent = this.browser.project.getRelatedByUuid(e.uuid);
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
        var confirmDelete = (msg) => {
            var modalInstance = this.$uibModal.open({
                component: 'confirmDelete',
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
                        this.browser.project.removeEntity(entity);
                        this.ui.confirmDel = false;
                    });
                }
            });
        };
        confirmDelete("Are you sure you want to delete " + ent.value.title + "?");
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
