import _ from 'underscore';
import publishedTemplate from './published.component.html';

export class PublishedDataCtrl {

    constructor($state, $filter, Django, $window, DataBrowserService, PublishedService, FileListing, $uibModal, $http, $stateParams) {
        'ngInject';

        this.$state = $state;
        this.$filter = $filter;
        this.Django = Django;
        this.$window = $window;
        this.DataBrowserService = DataBrowserService;
        this.PublishedService = PublishedService;
        this.FileListing = FileListing;
        this.$uibModal = $uibModal;
        this.$http = $http;
        this.$stateParams = $stateParams;

        this.resolveBreadcrumbHref = this.resolveBreadcrumbHref.bind(this)
        this.viewCollabs = this.viewCollabs.bind(this);
        this.getUserDets = this.getUserDets.bind(this);
        this.onCitation = this.onCitation.bind(this);
    }

    $onInit() {
        this.filePathComps = _.compact(this.$stateParams.filePath.split('/'));
        this.browser = this.DataBrowserService.state();
        this.state = {
            loadingMore: false,
            reachedEnd: false,
            page: 0
        };
        this.ui = { loadingProjectMeta: false };
        var projId = this.browser.listing.path.split('/')[1];
        if (projId) {
            this.ui.loadingProjectMeta = true;
            this.PublishedService.getPublished(projId)
                .then((resp) => {
                    this.browser.publication = resp.data;
                    this.project = resp.data.project;
                    var pi = _.find(this.browser.publication.users, (usr) => {
                        return usr.username === this.project.value.pi;
                    });
                    this.project.piLabel = pi.last_name + ', ' + pi.first_name;
                    var _apiParams = {
                        fileMgr: 'published',
                        baseUrl: '/api/public/files'
                    };

                    if (this.browser.publication.project.value.projectType === 'experimental') {
                        _.each(this.browser.publication.eventsList, this.getFileObjs);
                        _.each(this.browser.publication.modelConfigs, this.getFileObjs);
                        _.each(this.browser.publication.sensorLists, this.getFileObjs);
                        _.each(this.browser.publication.analysisList, this.getFileObjs);
                        _.each(this.browser.publication.reportsList, this.getFileObjs);
                    } else if (this.browser.publication.project.value.projectType === 'simulation') {
                        _.each(this.browser.publication.analysiss, this.getFileObjs);
                        _.each(this.browser.publication.inputs, this.getFileObjs);
                        _.each(this.browser.publication.models, this.getFileObjs);
                        _.each(this.browser.publication.outputs, this.getFileObjs);
                        _.each(this.browser.publication.reports, this.getFileObjs);
                    } else if (this.browser.publication.project.value.projectType === 'hybrid_simulation') {
                        _.each(this.browser.publication.analysiss, this.getFileObjs);
                        _.each(this.browser.publication.reports, this.getFileObjs);

                        _.each(this.browser.publication.coordinators, this.getFileObjs);
                        _.each(this.browser.publication.coordinator_outputs, this.getFileObjs);
                        _.each(this.browser.publication.exp_substructures, this.getFileObjs);
                        _.each(this.browser.publication.exp_outputs, this.getFileObjs);
                        _.each(this.browser.publication.sim_substructures, this.getFileObjs);
                        _.each(this.browser.publication.sim_outputs, this.getFileObjs);
                        _.each(this.browser.publication.global_models, this.getFileObjs);
                        _.each(this.browser.publication.hybrid_simulations, this.getFileObjs);
                    }

                    //add metadata to header
                    this.PublishedService.updateHeaderMetadata(projId, resp);

                    this.ui.loadingProjectMeta = false;

                });
        }

        this.FileListing.get({
            'system': 'designsafe.storage.published',
            'name': 'projectimage.jpg',
            'path': '/' + projId + '/projectimage.jpg'
        }).then((list) => {
            list.preview().then((data) => {
                this.imageHref = data.postit;
            });
        });
        //this.browser.listing.permissions = 'READ';


        if (!this.browser.error) {
            this.browser.listing.href = this.$state.href('publishedData', {
                system: this.browser.listing.system,
                filePath: this.browser.listing.path
            });
            _.each(this.browser.listing.children, (child) => {
                child.href = this.$state.href('publishedData', { system: child.system, filePath: child.path });
            });
        }

        this.data = {
            customRoot: {
                name: 'Published',
                href: this.$state.href('publicData', {
                    systemId: 'nees.public',
                    filePath: '/'
                }),
                system: 'nees.public',
                filePath: '/'
            }
        };
    }

    getFileObjs(evt) {
        evt.files = _.map(evt.fileObjs, (f) => {
            f.system = 'designsafe.storage.published';
            f.path = this.browser.publication.projectId + f.path;
            f.permissions = 'READ';
            return this.FileListing.init(f, _apiParams);
        });
    }

    getTitle() {
        this.$window.document.getElementsByName('citation_author_institution')[0].content = 'dingus'
    }

    makeRequest() {
        return this.$http.get('/api/projects/publication');
    }

    resolveBreadcrumbHref(trailItem) {
        return this.$state.href('publicData', { systemId: this.browser.listing.system, filePath: trailItem.path });
    };

    scrollToTop() {
        return;
    };
    scrollToBottom() {
        this.DataBrowserService.scrollToBottom();
    };

    onBrowse($event, file) {
        if ($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        var systemId = file.system || file.systemId;
        var filePath;
        if (file.path == '/') {
            filePath = file.path + file.name;
        } else {
            filePath = file.path;
        }
        if (typeof (file.type) !== 'undefined' && file.type !== 'dir' && file.type !== 'folder') {
            this.DataBrowserService.preview(file, this.browser.listing);
        } else {
            if (file.system === 'nees.public') {
                this.$state.go('publicData', { systemId: file.system, filePath: file.path }, { reload: true });
            } else {
                this.$state.go('publishedData', { systemId: file.system, filePath: file.path, listing: true }, { reload: true });
            }
        }
    };

    onSelect($event, file) {
        $event.preventDefault();
        $event.stopPropagation();

        if ($event.ctrlKey || $event.metaKey) {
            var selectedIndex = this.browser.selected.indexOf(file);
            if (selectedIndex > -1) {
                this.DataBrowserService.deselect([file]);
            } else {
                this.DataBrowserService.select([file]);
            }
        } else if ($event.shiftKey && this.browser.selected.length > 0) {
            var lastFile = this.browser.selected[this.browser.selected.length - 1];
            var lastIndex = this.browser.listing.children.indexOf(lastFile);
            var fileIndex = this.browser.listing.children.indexOf(file);
            var min = Math.min(lastIndex, fileIndex);
            var max = Math.max(lastIndex, fileIndex);
            this.DataBrowserService.select(this.browser.listing.children.slice(min, max + 1));
        } else if (typeof file._ui !== 'undefined' &&
            file._ui.selected) {
            this.DataBrowserService.deselect([file]);
        } else {
            this.DataBrowserService.select([file], true);
        }

    };

    showFullPath(item) {
        if (this.browser.listing.path != '$PUBLIC' &&
            item.parentPath() != this.browser.listing.path &&
            item.parentPath() != '/') {
            return true;
        } else {
            return false;
        }
    };

    onDetail($event, file) {
        $event.stopPropagation();
        this.DataBrowserService.preview(file, this.browser.listing);
    };

    renderName(file) {
        if (typeof file.metadata === 'undefined' ||
            file.metadata === null ||
            _.isEmpty(file.metadata)) {
            return file.name;
        }
        var pathComps = file.path.split('/');
        var experiment_re = /^experiment/;
        if (file.path[0] === '/' && pathComps.length === 2) {
            return file.metadata.project.title;
        }
        else if (file.path[0] !== '/' &&
            pathComps.length === 2 &&
            experiment_re.test(file.name.toLowerCase())) {
            return file.metadata.experiments[0].title;
        }
        return file.name;
    };

    getRelated(attrib, entity, uuids) {
        if (_.isString(uuids)) {
            uuids = [uuids];
        }
        var ents = [];
        ents = this.browser.publication[attrib];
        var res = _.filter(ents, (ent) => {
            var inter = _.intersection(uuids, ent.associationIds);
            if (inter && inter.length === uuids.length) {
                return ent;
            }
        });
        if (entity !== false && typeof entity !== 'undefined') {
            var _ents = entity.value[attrib];
            var _res = _.filter(res, (ent) => {
                if (_.contains(_ents, ent.uuid)) {
                    return ent;
                }
            });
            return _res;
        }
        return res;
    };

    getUserDets(username, noEmail) {
        var users;
        users = this.browser.publication.users;
        var user = _.find(users, (usr) => {
            return usr.username === username;
        });
        if (user) {
            if (!noEmail) {
                return user.last_name + ', ' + user.first_name + ' <' + user.email + '>';
            } else {
                return user.last_name + ', ' + user.first_name;
            }
        }
    };

    filterUsers(usernames, users) {
        return _.filter(users, (usr) => {
            return _.contains(usernames, usr.username);
        });
    };

    sortUsers(entity) {
        return (user) => {
            if (typeof user._ui[entity.uuid] !== 'undefined') {
                return user._ui[entity.uuid];
            } else {
                return user._ui.order;
            }
        };
    };

    viewCollabs() {
        this.$uibModal.open({
            templateUrl: '/static/scripts/data-depot/templates/view-collabs.html',
            controller: ['$uibModalInstance', 'browser', 'getUserDets', function ($uibModalInstance, browser, getUserDets) {
                var $ctrl = this;
                $ctrl.data = {};
                $ctrl.getUserDets = getUserDets
                if (browser.listing.project) {
                    $ctrl.data.project = browser.listing.project;
                } else {
                    $ctrl.data.project = browser.publication.project;
                }
                $ctrl.close = function () {
                    $uibModalInstance.dismiss('close');
                };
            }],
            controllerAs: '$ctrl',
            resolve: {
                browser: this.browser,
                getUserDets: () => this.getUserDets
            },
            //scope: this
        });
    };

    viewProject() {
        this.$uibModal.open({
            templateUrl: '/static/scripts/data-depot/templates/view-project.html',
            controller: ['$uibModalInstance', 'browser', function ($uibModalInstance, browser) {
                var $ctrl = this;
                $ctrl.data = {};
                if (browser.listing.project) {
                    $ctrl.data.publication = browser.listing;
                } else {
                    $ctrl.data.publication = browser.publication;
                }
                $ctrl.data.piDets = this.getUserDets($ctrl.data.publication.project.value.pi);
                $ctrl.close = function () {
                    $uibModalInstance.dismiss('close');
                };
            }],
            controllerAs: '$ctrl',
            resolve: {
                browser: this.browser
            },
            size: 'lg'
        });
    };

    viewExperiments() {
        this.$uibModal.open({
            templateUrl: '/static/scripts/data-depot/templates/view-experiments.html',
            controller: ['$uibModalInstance', 'browser', function ($uibModalInstance, browser) {
                var $ctrl = this;
                $ctrl.data = {};
                if (browser.listing.project) {
                    $ctrl.data.publication = browser.listing;
                } else {
                    $ctrl.data.publication = browser.publication;
                }
                $ctrl.close = function () {
                    $uibModalInstance.dismiss('close');
                };
            }],
            controllerAs: '$ctrl',
            resolve: {
                browser: this.browser
            },
            scope: this,
            size: 'lg'
        });
    };

    viewSimulationRelations(uuid) {
        this.$uibModal.open({
            templateUrl: '/static/scripts/data-depot/templates/view-simulation-relations.html',
            controller: ['$uibModalInstance', 'browser', function ($uibModalInstance, browser) {
                var $ctrl = this;
                $ctrl.data = {};
                if (browser.listing.project) {
                    $ctrl.data.publication = browser.listing;
                } else {
                    $ctrl.data.publication = browser.publication;
                }
                $ctrl.data.selectedUuid = uuid;
                $ctrl.isSelected = function (entityUuid) {
                    if (entityUuid === $ctrl.data.selectedUuid) {
                        return true;
                    } else {
                        return false;
                    }
                };
                $ctrl.close = function () {
                    $uibModalInstance.dismiss('close');
                };
            }],
            controllerAs: '$ctrl',
            resolve: {
                browser: this.browser
            },
            scope: this,
            size: 'lg'
        });
    };

    viewHybridSimulationRelations(uuid) {
        this.$uibModal.open({
            templateUrl: '/static/scripts/data-depot/templates/view-hybrid-simulation-relations.html',
            controller: ['$uibModalInstance', 'browser', function ($uibModalInstance, browser) {
                var $ctrl = this;
                $ctrl.data = {};
                if (browser.listing.project) {
                    $ctrl.data.publication = browser.listing;
                } else {
                    $ctrl.data.publication = browser.publication;
                }
                $ctrl.data.selectedUuid = uuid;
                $ctrl.isSelected = function (entityUuid) {
                    if (entityUuid === $ctrl.data.selectedUuid) {
                        return true;
                    } else {
                        return false;
                    }
                };
                $ctrl.close = function () {
                    $uibModalInstance.dismiss('close');
                };
            }],
            controllerAs: '$ctrl',
            resolve: {
                browser: this.browser
            },
            scope: this,
            size: 'lg'
        });
    };

    viewRelations(uuid) {
        this.$uibModal.open({
            templateUrl: '/static/scripts/data-depot/templates/view-relations.html',
            controller: ['$uibModalInstance', 'browser', function ($uibModalInstance, browser) {
                var $ctrl = this;
                $ctrl.data = {};
                if (browser.listing.project) {
                    $ctrl.data.publication = browser.listing;
                } else {
                    $ctrl.data.publication = browser.publication;
                }
                $ctrl.data.selectedUuid = uuid;
                $ctrl.isSelected = function (entityUuid) {
                    if (entityUuid === $ctrl.data.selectedUuid) {
                        return true;
                    } else {
                        return false;
                    }
                };
                $ctrl.close = function () {
                    $uibModalInstance.dismiss('close');
                };
            }],
            controllerAs: '$ctrl',
            resolve: {
                browser: this.browser
            },
            scope: this,
            size: 'lg'
        });
    };

    showText(text) {
        this.$uibModal.open({
            template: '<div class="modal-header">' +
                '<h3>Description</h3>' +
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
            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                $scope.text = text;
                $scope.close = function () {
                    $uibModalInstance.dismiss('Close');
                };
            }]
        });
    };

    onCitation(publication, project) {
        this.DataBrowserService.showCitation(publication, project);
    };

}

export const PublishedComponent = {
    controller: PublishedDataCtrl,
    controllerAs: '$ctrl',
    template: publishedTemplate
}