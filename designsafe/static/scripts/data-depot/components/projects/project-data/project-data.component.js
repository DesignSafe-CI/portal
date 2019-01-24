import _ from 'underscore';
import ProjectDataTemplate from './project-data.component.html';

function ProjectDataCtrl(
    $scope,
    $state,
    Django,
    ProjectService,
    DataBrowserService,
    FileListing,
    UserService,
    $uibModal,
    $http,
    $q
) {
    'ngInject';

    var projectId = ProjectService.resolveParams.projectId;
    var filePath = ProjectService.resolveParams.filePath;
    var projectTitle = ProjectService.resolveParams.projectTitle;

    DataBrowserService.apiParams.fileMgr = 'agave';
    DataBrowserService.apiParams.baseUrl = '/api/agave/files';
    DataBrowserService.apiParams.searchState = 'projects.view.data';
    $scope.data = ProjectService.data;
    $scope.browser = DataBrowserService.state();
    $scope.browser.listings = {};
    $scope.browser.ui = {};
    $scope.browser.publication = {
        experimentsList: [],
        eventsList: [],
        users: [],
        analysisList: [],
        reportsList: [],
        filesSelected: {},
    };
    if (typeof $scope.browser !== 'undefined') {
        $scope.browser.busy = true;
    }

    $scope.browser.projectServicePromise.then(function() {
        DataBrowserService.browse(
            { system: 'project-' + projectId, path: filePath },
            { query_string: $state.params.query_string }
        )
            .then(function() {
                $scope.browser = DataBrowserService.state();
                DataBrowserService.projectBreadcrumbSubject.next();
                $scope.browser.busy = true;
                $scope.browser.busyListing = true;
                $scope.browser.listing.href = $state.href('projects.view.data', {
                    projectId: projectId,
                    filePath: $scope.browser.listing.path,
                    projectTitle: projectTitle,
                });
                _.each($scope.browser.listing.children, function(child) {
                    child.href = $state.href('projects.view.data', {
                        projectId: projectId,
                        filePath: child.path,
                        projectTitle: projectTitle,
                    });
                });
                if (typeof $scope.browser.loadingEntities !== 'undefined' && !$scope.browser.loadingEntities) {
                    var entities = $scope.browser.project.getAllRelatedObjects();
                    _.each($scope.browser.listing.children, function(child) {
                        child.setEntities(DataBrowserService.state().project.uuid, entities);
                    });
                } else {
                    $scope.$watch('browser.loadingEntities', function(newVal, oldVal) {
                        if (!newVal) {
                            var entities = $scope.browser.project.getAllRelatedObjects();
                            _.each($scope.browser.listing.children, function(child) {
                                child.setEntities($scope.browser.project.uuid, entities);
                            });
                        }
                    });
                }
            })
            .then(function() {
                $http.get('/api/projects/publication/' + $scope.browser.project.value.projectId).then(
                    function(resp) {
                        if (resp.data.project && resp.data.project.doi) {
                            $scope.browser.project.doi = resp.data.project.doi;
                            DataBrowserService.state().project.doi = resp.data.project.doi;
                        }
                        if (resp.data.project && resp.data.status) {
                            $scope.browser.project.publicationStatus = resp.data.status;
                            DataBrowserService.state().project.publicationStatus = resp.data.status;
                        }
                        $scope.browser.busy = false;
                        $scope.browser.busyListing = false;
                    },
                    function() {
                        $scope.browser.busy = false;
                        $scope.browser.busyListing = false;
                    }
                );
            });
    });

    var setFilesDetails = function(filePaths) {
        filePaths = _.uniq(filePaths);
        var p = $q(function(resolve, reject) {
            var results = [];
            var index = 0;
            var size = 5;
            var fileCalls = _.map(filePaths, function(filePath) {
                return FileListing.get(
                    { system: 'project-' + projectId, path: filePath },
                    DataBrowserService.apiParams
                ).then(function(resp) {
                    var allEntities = $scope.browser.project.getAllRelatedObjects();
                    var entities = _.filter(allEntities, function(entity) {
                        return _.contains(entity._filePaths, resp.path);
                    });
                    _.each(entities, function(entity) {
                        $scope.browser.listings[entity.uuid].push(resp);
                    });
                    return resp;
                });
            });

            function step() {
                var calls = fileCalls.slice(index, (index += size));
                if (calls.length) {
                    $q.all(calls)
                        .then(function(res) {
                            results.concat(res);
                            step();
                            return res;
                        })
                        .catch(reject);
                } else {
                    resolve(results);
                }
            }
            step();
        });
        return p.then(
            function(results) {
                return results;
            },
            function(err) {
                $scope.browser.ui.error = err;
            }
        );
    };

    var setUserDetails = function(usernames) {
        $scope.browser.publication.users = [];
        filePaths = _.uniq(usernames);
        var p = $q(function(resolve, reject) {
            var results = [];
            var index = 0;
            var size = 5;
            var userIndex = 0;
            var calls = _.map(usernames, function(username) {
                return UserService.get(username).then(function(resp) {
                    resp._ui = { order: userIndex, deleted: false };
                    $scope.browser.publication.users.push(resp);
                    userIndex += 1;
                });
            });

            function step() {
                var _calls = calls.slice(index, (index += size));
                if (_calls.length) {
                    $q.all(_calls)
                        .then(function(res) {
                            results.concat(res);
                            step();
                            return res;
                        })
                        .catch(reject);
                } else {
                    resolve(results);
                }
            }
            step();
        });
        $scope.browser.ui.loadingPreview = true;
        return p.then(
            function(results) {
                $scope.browser.publication.users = _.uniq($scope.browser.publication.users, function(obj) {
                    return obj.username;
                });
                return results;
            },
            function(err) {
                $scope.browser.ui.error = err;
            }
        );
    };

    $scope.$watch('browser.showPreviewListing', function(newVal, oldVal) {
        if (newVal) {
            $scope.browser.ui.loadingListings = true;
            $scope.browser.listings = {};
            var entities = $scope.browser.project.getAllRelatedObjects();
            var allFilePaths = [];
            _.each(entities, function(entity) {
                $scope.browser.listings[entity.uuid] = [];
                allFilePaths = allFilePaths.concat(entity._filePaths);
            });
            $scope.data.rootPaths = allFilePaths;
            $http
                .get('/api/projects/publication/' + $scope.browser.project.value.projectId)
                .then(
                    function(resp) {
                        //$scope.browser.publication = _.extend($scope.browser.publication, resp.data);
                        //$scope.browser.publication.experimentsList = $scope.browser.publication.experimentsList || [];
                        //$scope.browser.publication.eventsList = $scope.browser.publication.eventsList || [];
                        //$scope.browser.publication.analysisList = $scope.browser.publication.analysisList || [];
                        //$scope.browser.publication.reportsList = $scope.browser.publication.reportsList || [];
                    },
                    function(err) {
                        //no publication saved?
                    }
                )
                .then(function() {
                    setFilesDetails(allFilePaths);
                })
                .then(function() {
                    users = [$scope.browser.project.value.pi]
                        .concat($scope.browser.project.value.coPis)
                        .concat($scope.browser.project.value.teamMembers);
                    return setUserDetails(users);
                })
                .then(function() {});
        }
    });

    $scope.onBrowseData = function onBrowseData($event, file) {
        $event.preventDefault();
        DataBrowserService.showListing();
        if (typeof file.type !== 'undefined' && file.type !== 'dir' && file.type !== 'folder') {
            DataBrowserService.preview(file, $scope.browser.listing);
        } else {
            $state.go(
                'projects.view.data',
                { projectId: projectId, filePath: file.path, projectTitle: projectTitle },
                { reload: true }
            );
        }
    };

    $scope.scrollToTop = function() {
        return;
    };
    $scope.scrollToBottom = function() {
        DataBrowserService.scrollToBottom();
    };

    $scope.onSelectData = function onSelectData($event, file) {
        $event.stopPropagation();

        if ($event.ctrlKey || $event.metaKey) {
            var selectedIndex = $scope.browser.selected.indexOf(file);
            if (selectedIndex > -1) {
                DataBrowserService.deselect([file]);
            } else {
                DataBrowserService.select([file]);
            }
        } else if ($event.shiftKey && $scope.browser.selected.length > 0) {
            var lastFile = $scope.browser.selected[$scope.browser.selected.length - 1];
            var lastIndex = $scope.browser.listing.children.indexOf(lastFile);
            var fileIndex = $scope.browser.listing.children.indexOf(file);
            var min = Math.min(lastIndex, fileIndex);
            var max = Math.max(lastIndex, fileIndex);
            DataBrowserService.select($scope.browser.listing.children.slice(min, max + 1));
        } else if (typeof file._ui !== 'undefined' && file._ui.selected) {
            DataBrowserService.deselect([file]);
        } else {
            DataBrowserService.select([file], true);
        }
    };

    $scope.onDetail = function($event, file) {
        $event.stopPropagation();
        DataBrowserService.preview(file, $scope.browser.listing);
    };

    $scope.openPreviewTree = function($event, entityUuid) {
        var type = $scope.browser.project.value.projectType;
        if (typeof type === 'undefined' || _.isEmpty(type)) {
            type = 'experimental';
        }
        $event.preventDefault();
        $event.stopPropagation();
        DataBrowserService.openPreviewTree(entityUuid, type);
    };

    function _addToLists(ent, evt) {
        if (ent.name === 'designsafe.project.experiment') {
            $scope.browser.publication.experimentsList.push(ent);
            $scope.browser.publication.experimentsList = _.uniq($scope.browser.publication.experimentsList, function(
                e
            ) {
                return e.uuid;
            });
            $scope.browser.publication.eventsList.push(evt);
            $scope.browser.publication.eventsList = _.uniq($scope.browser.publication.eventsList, function(e) {
                return e.uuid;
            });
        } else if (ent.name === 'designsafe.project.analysis') {
            $scope.browser.publication.analysisList.push(ent);
            $scope.browser.publication.analysisList = _.uniq($scope.browser.publication.analysisList, function(e) {
                return e.uuid;
            });
        } else if (ent.name === 'designsafe.project.report') {
            $scope.browser.publication.reportsList.push(ent);
            $scope.browser.publication.reportsList = _.uniq($scope.browser.publication.reportsList, function(e) {
                return e.uuid;
            });
        } else if (ent.name === 'designsafe.project.simulation') {
            if (typeof $scope.browser.publication.simulations === 'undefined') {
                $scope.browser.publication.simulations = [];
            }
            $scope.browser.publication.simulations.push(ent);
        }
    }

    function _addToSimLists(ent) {
        var nameComps = ent.name.split('.');
        var name = nameComps[nameComps.length - 1];
        var attrName = name + 's';
        if (typeof $scope.browser.publication[attrName] === 'undefined') {
            $scope.browser.publication[attrName] = [];
        }
        $scope.browser.publication[attrName].push(ent);
        $scope.browser.publication[attrName] = _.uniq($scope.browser.publication[attrName], function(e) {
            return e.uuid;
        });
    }

    function _removeFromLists(ent, evt) {
        if (ent && ent.name == 'designsafe.project.experiment') {
            $scope.browser.publication.experimentsList = _.filter($scope.browser.publication.experimentsList, function(
                e
            ) {
                return e.uuid !== ent.uuid;
            });
        } else if (ent && ent.name == 'designsafe.project.analysis') {
            $scope.browser.publication.analysisList = _.filter($scope.browser.publication.analysisList, function(e) {
                return e.uuid !== ent.uuid;
            });
        } else if (ent && ent.name == 'designsafe.project.report') {
            $scope.browser.publication.reportsList = _.filter($scope.browser.publication.reportsList, function(e) {
                return e.uuid !== ent.uuid;
            });
        }

        if (evt) {
            $scope.browser.publication.eventsList = _.filter($scope.browser.publication.eventsList, function(e) {
                return evt.uuid !== e.uuid;
            });
        }
    }

    function _removeFromSimLists(ent) {
        var nameComps = ent.name.split('.');
        var name = nameComps[nameComps.length - 1];
        var attrName = name + 's';
        $scope.browser.publication[attrName] = _.filter($scope.browser.publication[attrName], function(e) {
            return e.uuid !== ent.uuid;
        });
    }

    $scope.editProject = function() {
        ProjectService.editProject($scope.browser.project).then(function(project) {
            $scope.browser.project = project;
        });
    };

    $scope.manageCollabs = function() {
        ProjectService.manageCollaborators($scope.browser.project).then(function(project) {
            $scope.browserproject = project;
        });
    };

    $scope.manageExperiments = function() {
        var experimentsAttr = $scope.browser.project.getRelatedAttrName('designsafe.project.experiment');
        var experiments = $scope.browser.project[experimentsAttr];
        if (typeof experiments === 'undefined') {
            $scope.browser.project[experimentsAttr] = [];
            experiments = $scope.browser.project[experimentsAttr];
        }
        ProjectService.manageExperiments({ experiments: experiments, project: $scope.browser.project }).then(function(
            experiments
        ) {
            $scope.browser.experiments = experiments;
        });
    };

    $scope.manageSimulations = function() {
        var simulationAttr = $scope.data.project.getRelatedAttrName('designsafe.project.simulation');
        var simulations = $scope.data.project[simulationAttr];
        if (typeof simulations === 'undefined') {
            $scope.data.project[simulationAttr] = [];
            simulations = $scope.data.project[simulationAttr];
        }
        ProjectService.manageSimulations({ simulations: simulations, project: $scope.data.project }).then(function(
            simulations
        ) {
            $scope.data.simulations = simulations;
        });
    };

    var _editFieldModal = function(objArr, title, fields, classes) {
        modal = $uibModal.open({
            template:
                '<div class="modal-header">' +
                '<h3>{{ui.title}}</h3>' +
                '</div>' +
                '<div class="modal-body">' +
                '<div class="form-group" ' +
                'ng-repeat="obj in data.objArr" style="overflow:auto;">' +
                '<div ng-repeat="field in ui.fields">' +
                '<div class="{{ui.classes[field.name]}}">' +
                '<label for="{{field.id}}-{{obj[field.uniq]}}">{{field.label}}</label>' +
                '<input type="{{field.type}}" class="form-control" name="{{field.name}}-{{obj[field.uniq]}}"' +
                'id="{{field.id}}-{{obj[field.uniq]}}" ng-model="obj[field.name]"/>' +
                '</div>' +
                '</div>' +
                '<div clss="del-btn" ng-if="!obj._ui.deleted">' +
                '<button class="btn btn-sm btn-danger" ng-click="delDataRecord($index)"><i class="fa fa-remove"></i> Delete </button>' +
                '</div>' +
                '<div clss="del-btn" ng-if="obj._ui.deleted">' +
                '<button class="btn btn-sm btn-warning" ng-click="undelDataRecord($index)"><i class="fa fa-remove"></i> Undelete </button>' +
                '</div>' +
                '</div>' +
                //'<div class="add-btn">' +
                //'<button class="btn btn-sm btn-info" ng-click="addDataRecord()"><i class="fa fa-plus"></i> Add</button>' +
                //'</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                '<button class="btn btn-default" ng-click="close()">Close</button>' +
                '</div>',
            controller: [
                '$scope',
                '$uibModalInstance',
                function($scope, $uibModalInstance) {
                    $scope.ui = { fields: fields, classes: classes, title: title, form: {} };
                    $scope.data = { objArr: objArr };

                    $scope.close = function() {
                        $uibModalInstance.dismiss('Cancel');
                    };

                    $scope.addDataRecord = function() {
                        var nRecord = {};
                        fields.forEach(function(field) {
                            nRecord[field] = '';
                        });
                        $scope.data.objArr.push(nRecord);
                    };

                    $scope.delDataRecord = function(index) {
                        $scope.data.objArr[index]._ui.deleted = true;
                    };

                    $scope.undelDataRecord = function(index) {
                        $scope.data.objArr[index]._ui.deleted = false;
                    };

                    $scope.save = function() {
                        $uibModalInstance.close($scope.data.objArr);
                    };
                },
            ],
        });
        return modal;
    };

    var _publicationCtrl = {
        filterUsers: function(usernames, users) {
            return _.filter(users, function(usr) {
                return _.contains(usernames, usr.username);
            });
        },

        showText: function(text) {
            $uibModal.open({
                template:
                    '<div class="modal-header">' +
                    '<h3> Description </h3>' +
                    '</div>' +
                    '<div class="modal-body">' +
                    '<div style="border: 1px solid black;"' +
                    '"padding:5px;">' +
                    '{{text}}' +
                    '</div>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                    '<button class="btn btn-default" ng-click="close()">' +
                    'Close' +
                    '</button>' +
                    '</div>',
                controller: [
                    '$scope',
                    '$uibModalInstance',
                    function($scope, $uibModalInstance) {
                        $scope.text = text;
                        $scope.close = function() {
                            $uibModalInstance.dismiss('Close');
                        };
                    },
                ],
            });
        },

        moveOrderUp: function($index, ent, list) {
            if (typeof ent._ui.order === 'undefined') {
                ent._ui.order = 0;
            } else if (ent._ui.order > 0) {
                var order = ent._ui.order;
                var _ent = _.find(list, function(e) {
                    return e._ui.order === order - 1;
                });
                ent._ui.order -= 1;
                _ent._ui.order += 1;
            }
        },

        moveOrderDown: function($index, ent, list) {
            if (typeof ent._ui.order === 'undefined') {
                ent._ui.order = 0;
            } else if (ent._ui.order < list.length - 1) {
                var _ent = _.find(list, function(e) {
                    return e._ui.order === ent._ui.order + 1;
                });
                ent._ui.order += 1;
                _ent._ui.order -= 1;
            }
        },

        openEditProject: function() {
            $scope.editProject();
        },

        openEditExperiments: function() {
            $scope.manageExperiments();
        },

        openEditSimulations: function() {
            $scope.manageSimulations();
        },

        openEditTeamMembers: function() {
            $scope.manageCollabs();
        },

        openEditCategories: function() {
            DataBrowserService.viewCategories([]);
        },

        isMissing: function(ent) {
            if (ent instanceof Array) {
                if (ent.length < 1) {
                    return true;
                } else {
                    return false;
                }
            }
            if (ent instanceof Object) {
                if (Object.keys(ent).length < 1) {
                    return true;
                } else {
                    return false;
                }
            }
            if (ent === '' || ent === undefined) {
                return true;
            } else {
                return false;
            }
        },

        selectAllFiles: function(ent, evt) {
            var listing = [];
            if (ent.name === 'designsafe.project.experiment') {
                listing = $scope.browser.listings[evt.uuid];
            } else {
                listing = $scope.browser.listings[ent.uuid];
            }
            if (typeof $scope.browser.publication.filesSelected[ent.uuid] === 'undefined') {
                $scope.browser.publication.filesSelected[ent.uuid] = {};
            }
            if (ent.name === 'designsafe.project.experiment') {
                var files = listing;
                $scope.browser.publication.filesSelected[ent.uuid][evt.uuid] = files;
                _addToLists(ent, evt);
            } else {
                $scope.browser.publication.filesSelected[ent.uuid] = listing;
                _addToLists(ent);
            }
        },

        selectAllHybridSimFiles: function(ent) {
            var listing = {};

            // show inputs selected
            _.each($scope.browser.project.coordinator_set, function(set) {
                if (set.associationIds.includes(ent.uuid)) {
                    listing[set.uuid] = $scope.browser.listings[set.uuid];
                    // add inputs
                    _addToSimLists(set);
                }
            });
            // show substructure selected
            _.each($scope.browser.project.simsubstructure_set, function(set) {
                if (set.associationIds.includes(ent.uuid)) {
                    listing[set.uuid] = $scope.browser.listings[set.uuid];
                    // add outputs
                    _addToSimLists(set);
                }
            });
            // show substructure selected
            _.each($scope.browser.project.expsubstructure_set, function(set) {
                if (set.associationIds.includes(ent.uuid)) {
                    listing[set.uuid] = $scope.browser.listings[set.uuid];
                    // add outputs
                    _addToSimLists(set);
                }
            });
            // show outputs selected
            _.each($scope.browser.project.output_set, function(set) {
                if (set.associationIds.includes(ent.uuid)) {
                    listing[set.uuid] = $scope.browser.listings[set.uuid];
                    // add outputs
                    _addToSimLists(set);
                }
            });

            // show global_model selected
            _.each($scope.browser.project.globalmodel_set, function(set) {
                if (set.associationIds.includes(ent.uuid)) {
                    listing[set.uuid] = $scope.browser.listings[set.uuid];
                    // add outputs
                    _addToSimLists(set);
                }
            });

            // add model
            _addToSimLists(ent);

            // show model/report/analysis selected
            if (ent._displayName == 'Report' || ent._displayName == 'Analysis') {
                listing[ent.uuid] = $scope.browser.listings[ent.uuid];
            }

            // if there are already selected files do not deselect them when selecting more
            if (Object.keys($scope.browser.publication.filesSelected).length === 0) {
                $scope.browser.publication.filesSelected = listing;
            } else {
                _.map(listing, function(i) {
                    Object.assign($scope.browser.publication.filesSelected, listing);
                });
            }
        },

        selectAllSimFiles: function(ent) {
            var listing = {};

            // show inputs selected
            _.each($scope.browser.project.input_set, function(set) {
                if (set.value.modelConfigs.includes(ent.uuid)) {
                    listing[set.uuid] = $scope.browser.listings[set.uuid];
                    // add inputs
                    _addToSimLists(set);
                }
            });
            // show outputs selected
            _.each($scope.browser.project.output_set, function(set) {
                if (set.value.modelConfigs.includes(ent.uuid)) {
                    listing[set.uuid] = $scope.browser.listings[set.uuid];
                    // add outputs
                    _addToSimLists(set);
                }
            });

            // add model
            _addToSimLists(ent);

            // show model/report/analysis selected
            if (ent._displayName == 'Model' || ent._displayName == 'Report' || ent._displayName == 'Analysis') {
                listing[ent.uuid] = $scope.browser.listings[ent.uuid];
            }

            // if there are already selected files do not deselect them when selecting more
            if (Object.keys($scope.browser.publication.filesSelected).length === 0) {
                $scope.browser.publication.filesSelected = listing;
            } else {
                _.map(listing, function(i) {
                    Object.assign($scope.browser.publication.filesSelected, listing);
                });
            }
        },

        selectFileForHybridSimPublication: function(ent, file, sim) {
            if (typeof $scope.browser.publication.filesSelected[ent.uuid] === 'undefined') {
                $scope.browser.publication.filesSelected[ent.uuid] = [];
            }
            // include simulation when adding a file associated with a model
            if (ent._displayName == 'Global Model') {
                _addToSimLists(sim);
            }
            // show file as selected
            $scope.browser.publication.filesSelected[ent.uuid].push(file);
            _addToSimLists(ent);
        },

        selectFileForSimPublication: function(ent, file, sim) {
            if (typeof $scope.browser.publication.filesSelected[ent.uuid] === 'undefined') {
                $scope.browser.publication.filesSelected[ent.uuid] = [];
            }
            // include simulation when adding a file associated with a model
            if (ent._displayName == 'Model') {
                _addToSimLists(sim);
            }
            // show file as selected
            $scope.browser.publication.filesSelected[ent.uuid].push(file);
            _addToSimLists(ent);
        },

        selectFileForPublication: function(ent, evt, file) {
            if (typeof $scope.browser.publication.filesSelected[ent.uuid] === 'undefined') {
                if (ent.name == 'designsafe.project.experiment') {
                    $scope.browser.publication.filesSelected[ent.uuid] = {};
                } else {
                    $scope.browser.publication.filesSelected[ent.uuid] = [];
                }
            }
            var files = [];
            if (ent.name === 'designsafe.project.experiment') {
                files = $scope.browser.publication.filesSelected[ent.uuid][evt.uuid];
            } else {
                files = $scope.browser.publication.filesSelected[ent.uuid];
            }
            if (typeof files == 'undefined' || !_.isArray(files)) {
                files = [];
            }
            files.push(file);
            if (ent.name === 'designsafe.project.experiment') {
                $scope.browser.publication.filesSelected[ent.uuid][evt.uuid] = files;
                _addToLists(ent, evt);
            } else {
                $scope.browser.publication.filesSelected[ent.uuid] = files;
                _addToLists(ent);
            }
        },

        deselectAllSimFiles: function(ent) {
            if ($scope.browser.publication.filesSelected[ent.uuid] !== 'undefined') {
                _.each($scope.browser.project.input_set, function(set) {
                    if (set.value.modelConfigs.includes(ent.uuid)) {
                        delete $scope.browser.publication.filesSelected[set.uuid];
                        _removeFromSimLists(set);
                    }
                });
                _.each($scope.browser.project.output_set, function(set) {
                    if (set.value.modelConfigs.includes(ent.uuid)) {
                        delete $scope.browser.publication.filesSelected[set.uuid];
                        _removeFromSimLists(set);
                    }
                });
                delete $scope.browser.publication.filesSelected[ent.uuid];
            }
            _removeFromSimLists(ent);
        },

        deselectAllHybridSimFiles: function(ent) {
            if ($scope.browser.publication.filesSelected[ent.uuid] !== 'undefined') {
                _.each($scope.browser.project.coordinator_set, function(set) {
                    if (set.associationIds.includes(ent.uuid)) {
                        delete $scope.browser.publication.filesSelected[set.uuid];
                        _removeFromSimLists(set);
                    }
                });
                _.each($scope.browser.project.simsubstructure_set, function(set) {
                    if (set.associationIds.includes(ent.uuid)) {
                        delete $scope.browser.publication.filesSelected[set.uuid];
                        _removeFromSimLists(set);
                    }
                });
                _.each($scope.browser.project.expsubstructure_set, function(set) {
                    if (set.associationIds.includes(ent.uuid)) {
                        delete $scope.browser.publication.filesSelected[set.uuid];
                        _removeFromSimLists(set);
                    }
                });
                _.each($scope.browser.project.output_set, function(set) {
                    if (set.associationIds.includes(ent.uuid)) {
                        delete $scope.browser.publication.filesSelected[set.uuid];
                        _removeFromSimLists(set);
                    }
                });
                delete $scope.browser.publication.filesSelected[ent.uuid];
            }
            _removeFromSimLists(ent);
        },

        deselectAllFiles: function(ent, evt) {
            if (ent.name === 'designsafe.project.experiment') {
                $scope.browser.publication.filesSelected[ent.uuid][evt.uuid] = [];
                delete $scope.browser.publication.filesSelected[ent.uuid][evt.uuid];
                if (_.isEmpty($scope.browser.publication.filesSelected[ent.uuid])) {
                    delete $scope.browser.publication.filesSelected[ent.uuid];
                    _removeFromLists(ent, evt);
                } else {
                    _removeFromLists(ent, evt);
                }
            } else {
                $scope.browser.publication.filesSelected[ent.uuid] = [];
                delete $scope.browser.publication.filesSelected[ent.uuid];
                _removeFromLists(ent);
            }
        },

        isFileSelectedForSimPublication: function(ent, file) {
            return _.find($scope.browser.publication.filesSelected[ent.uuid], function(f) {
                return f.uuid() === file.uuid();
            });
        },

        isFileSelectedForPublication: function(ent, evt, file) {
            if (typeof $scope.browser.publication.filesSelected[ent.uuid] === 'undefined') {
                if (ent.name === 'designsafe.project.experiment') {
                    $scope.browser.publication.filesSelected[ent.uuid] = {};
                } else {
                    $scope.browser.publication.filesSelected[ent.uuid] = [];
                }
            }
            var files = [];
            if (ent.name === 'designsafe.project.experiment') {
                files = $scope.browser.publication.filesSelected[ent.uuid][evt.uuid] || [];
                return _.find(files, function(f) {
                    return f.uuid() === file.uuid();
                });
            } else {
                files = $scope.browser.publication.filesSelected[ent.uuid] || [];
                return _.find(files, function(f) {
                    return f.uuid() === file.uuid();
                });
            }
        },

        deselectFileForPublication: function(ent, evt, file) {
            var files = [];
            if (ent.name === 'designsafe.project.experiment') {
                files = $scope.browser.publication.filesSelected[ent.uuid][evt.uuid];
            } else {
                files = $scope.browser.publication.filesSelected[ent.uuid];
            }
            files = _.reject(files, function(f) {
                return f.uuid() === file.uuid();
            });
            if (ent.name === 'designsafe.project.experiment') {
                $scope.browser.publication.filesSelected[ent.uuid][evt.uuid] = files;
                if (!$scope.browser.publication.filesSelected[ent.uuid][evt.uuid].length) {
                    delete $scope.browser.publication.filesSelected[ent.uuid][evt.uuid];
                    if (_.isEmpty($scope.browser.publication.filesSelected[ent.uuid])) {
                        _removeFromLists(ent, evt);
                    } else {
                        _removeFromLists(ent, evt);
                    }
                }
            } else {
                $scope.browser.publication.filesSelected[ent.uuid] = files;
                if (!$scope.browser.publication.filesSelected[ent.uuid].length) {
                    delete $scope.browser.publication.filesSelected[ent.uuid];
                    if (_.isEmpty($scope.browser.publication.filesSelected[ent.uuid])) {
                        _removeFromLists(ent);
                    }
                }
            }
        },

        deselectFileForSimPublication: function(ent, file, sim) {
            if (ent._displayName == 'Model') {
                _removeFromSimLists(sim);
            }
            delete $scope.browser.publication.filesSelected[ent.uuid];
            _removeFromSimLists(ent);
        },

        filterExperiments: function(experiments) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return experiments;
            } else {
                return $scope.browser.publication.experimentsList;
            }
        },

        filterSimulations: function(simulations) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return simulations;
            } else {
                return $scope.browser.publication.simulations;
            }
        },

        filterHybridSimulations: function(simulations) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return simulations;
            } else {
                return $scope.browser.publication.hybrid_simulations;
            }
        },

        filterEvents: function(events, exp) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return events;
            } else {
                return _.filter($scope.browser.publication.eventsList, function(evt) {
                    return _.contains(evt.associationIds, exp.uuid);
                });
            }
        },

        filterSimulationModels: function(models, simulation) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return models;
            } else {
                return _.filter($scope.browser.publication.models, function(model) {
                    return _.contains(model.associationIds, simulation.uuid);
                });
            }
        },

        filterGlobalModels: function(models, simulation) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return models;
            } else {
                return _.filter($scope.browser.publication.global_models, function(model) {
                    return _.contains(model.associationIds, simulation.uuid);
                });
            }
        },

        filterSimulationInputs: function(models, simulation) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return models;
            } else {
                return _.filter($scope.browser.publication.inputs, function(input) {
                    return _.contains(input.associationIds, simulation.uuid);
                });
            }
        },

        filterSimulationOutputs: function(models, simulation) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return models;
            } else {
                return _.filter($scope.browser.publication.outputs, function(output) {
                    return _.contains(output.associationIds, simulation.uuid);
                });
            }
        },

        filterSimAnalysis: function(analysis) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return _.filter(analysis, function(anl) {
                    return !anl.value.simOutputs.length;
                });
            } else {
                return _.filter($scope.browser.publication.analysiss, function(anl) {
                    return !anl.value.simOutputs.length;
                });
            }
        },

        filterHybridSimAnalysis: function(analysis) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return _.filter(analysis, function(anl) {
                    return !anl.value.hybridSimulations.length;
                });
            } else {
                return _.filter($scope.browser.publication.analysiss, function(anl) {
                    return !anl.value.hybridSimulations.length;
                });
            }
        },

        filterSimReports: function(reports) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return _.filter(reports, function(rpt) {
                    return !rpt.value.simOutputs.length;
                });
            } else {
                return _.filter($scope.browser.publication.reports, function(rpt) {
                    return !rpt.value.simOutputs.length;
                });
            }
        },

        filterHybridSimReports: function(reports) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return _.filter(reports, function(rpt) {
                    return !rpt.value.hybridSimulations.length;
                });
            } else {
                return _.filter($scope.browser.publication.reports, function(rpt) {
                    return !rpt.value.hybridSimulations.length;
                });
            }
        },

        filterFiles: function(parentEnt, ent, listing) {
            if (!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select') {
                return listing;
            } else if (parentEnt && typeof parentEnt.uuid !== 'undefined' && ent) {
                return $scope.browser.publication.filesSelected[parentEnt.uuid][ent.uuid];
            } else {
                return $scope.browser.publication.filesSelected[ent.uuid];
            }
        },

        editUsers: function() {
            fields = [
                { id: 'last_name', name: 'last_name', label: 'Last Name', uniq: 'username', type: 'text' },
                { id: 'first_name', name: 'first_name', label: 'First Name', uniq: 'username', type: 'text' },
            ];
            classes = {
                first_name: 'col-md-6',
                last_name: 'col-md-6',
            };
            modal = _editFieldModal($scope.browser.publication.users, 'Edit Users', fields, classes);

            modal.result.then(function(respArr) {
                $scope.browser.publication.users = respArr;
            });
        },

        editInsts: function() {
            fields = [{ id: 'label', name: 'label', label: 'Institution', uniq: 'name', type: 'text' }];
            modal = _editFieldModal($scope.browser.publication.institutions, 'Edit Institutions', fields);

            modal.result.then(function(respArr) {
                $scope.browser.publication.institutions = respArr;
            });
        },

        togglePubAgreement: function() {
            $scope.state.publishAgreement = !$scope.state.publishAgreement;
        },
    };

    $scope.publicationCtrl = _publicationCtrl;
}

export const ProjectDataComponent = {
    controller: ProjectDataCtrl,
    controllerAs: '$ctrl',
    template: ProjectDataTemplate,
};
