import _ from 'underscore';
import publishedTemplate from './published.component.html';

export class PublishedDataCtrl {

    constructor(
        $state,
        $filter,
        Django,
        $window,
        FileListingService,
        FileOperationService,
        PublicationService,
        $uibModal,
        $http,
        $stateParams
    ) {
        'ngInject';

        this.$state = $state;
        this.$filter = $filter;
        this.Django = Django;
        this.$window = $window;
        this.PublicationService = PublicationService;
        this.FileListingService = FileListingService;
        this.FileOperationService = FileOperationService;
        this.$uibModal = $uibModal;
        this.$http = $http;
        this.$stateParams = $stateParams;
        this.resolveBreadcrumbHref = this.resolveBreadcrumbHref.bind(this);
        this.viewCollabs = this.viewCollabs.bind(this);
        this.getUserDets = this.getUserDets.bind(this);
        this.onCitation = this.onCitation.bind(this);
        this.getFileObjs = this.getFileObjs.bind(this);
    }

    $onInit() {
        this.browser = {}
        this.browser.publication = this.publication;
        this.project = this.publication.project;
        this.breadcrumbParams = {
            root: {label: this.project.value.projectId, path: this.project.value.projectId}, 
            path: this.project.value.projectId,
            skipRoot: true
        }

        this.filePathComps = _.compact(decodeURIComponent(this.$stateParams.filePath).split('/'));
        this.state = {
            loadingMore: false,
            reachedEnd: false,
            page: 0
        };
        this.ui = { loadingProjectMeta: false };

        if (this.filePathComps.length > 1 || this.$stateParams.query_string || !['experimental', 'simulation', 'hybrid_simulation'].includes(this.project.value.projectType)) {
            this.breadcrumbParams.path = this.$stateParams.filePath
            this.FileListingService.browse({
                section: 'main',
                api: 'agave',
                scheme: 'public',
                system: 'designsafe.storage.published',
                path: this.$stateParams.filePath,
                query_string: this.$stateParams.query_string,
            });
        }
        //var pi = _.find(this.browser.publication.users, (usr) => {
        //    return usr.username === this.project.value.pi;
        //});
        //this.project.piLabel = pi.last_name + ', ' + pi.first_name;
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

        this.version = this.browser.publication.version || 1;
        this.type = this.browser.publication.project.value.projectType;
        this.ui.loadingProjectMeta = false;
                
        
        /*
        if (!this.browser.error) {
            this.browser.listing.href = this.$state.href(
                'publishedData.view', {
                    system: this.FileListingService.listings.main.params.system,
                    filePath: this.FileListingService.listings.main.params.path.replace(/^\/+/, '')
                });
            _.each(this.browser.listing.children, (child) => {
                child.href = this.$state.href(
                    'publishedData.view', {
                        system: child.system,
                        filePath: child.path.replace(/^\/+/, '')
                });
            });

        }
        */
        /*
        this.data = {
            customRoot: {
                name: 'Published',
                href: this.$state.href('publicData', {
                    systemId: 'nees.public',
                    filePath: ''
                }),
                system: 'nees.public',
                filePath: '/'
            }
        };
        */
    }

    getFileObjs(evt) {
       this.FileListingService.publishedListing(this.browser.publication, evt)
    }

    getTitle() {
        this.$window.document.getElementsByName('citation_author_institution')[0].content = 'dingus'
    }

    makeRequest() {
        return this.$http.get('/api/projects/publication');
    }

    resolveBreadcrumbHref(trailItem) {
        return this.$state.href('publicData', { systemId: this.browser.listing.system, filePath: trailItem.path.replace(/^\/+/, '') });
    }

    scrollToTop() {
        return;
    }


    onBrowse(file) {
        if(file.type === 'dir') {
            this.$state.go(this.$state.current.name, {filePath: file.path, query_string: null})
        }
        else {
            this.FileOperationService.openPreviewModal({api: 'agave', scheme: 'public', file})
        }
    }

    showFullPath(item) {
        if (this.browser.listing.path != '$PUBLIC' &&
            item.parentPath() != this.browser.listing.path &&
            item.parentPath() != '/') {
            return true;
        } else {
            return false;
        }
    }

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
    }

    getRelated(attrib, entity, uuids) {
        if (_.isString(uuids)) {
            uuids = [uuids];
        }
        var ents = [];
        if (this.browser) {
            ents = this.browser.publication[attrib];
        } else {
            ents = this.data.publication[attrib];
        }
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
    }

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
    }

    filterUsers(usernames, users) {
        return _.filter(users, (usr) => {
            return _.contains(usernames, usr.username);
        });
    }

    sortUsers(entity) {
        return (user) => {
            if (typeof user._ui[entity.uuid] !== 'undefined') {
                return user._ui[entity.uuid];
            } else {
                return user._ui.order;
            }
        };
    }

    viewCollabs() {
        this.$uibModal.open({
            template: require('../..//templates/view-collabs.html'), 
            controller: ['$uibModalInstance', 'browser', 'getUserDets', function ($uibModalInstance, browser, getUserDets) {
                var $ctrl = this;
                $ctrl.data = {};
                $ctrl.getUserDets = getUserDets;
                $ctrl.data.project = browser.publication.project;
                
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
    }

    viewProject() {
        this.$uibModal.open({
            templateUrl: '/static/scripts/data-depot/templates/view-project.html',
            controller: ['$uibModalInstance', 'browser', function ($uibModalInstance, browser) {
                var $ctrl = this;
                $ctrl.data = {};

                $ctrl.data.publication = browser.publication;
                
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
    }

    viewExperiments() {
        this.$uibModal.open({
            templateUrl: '/static/scripts/data-depot/templates/view-experiments.html',
            controller: ['$uibModalInstance', 'browser', function ($uibModalInstance, browser) {
                var $ctrl = this;
                $ctrl.data = {};

                $ctrl.data.publication = browser.publication;

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
    }

    viewSimulationRelations(uuid) {
        this.$uibModal.open({
            templateUrl: '/static/scripts/data-depot/templates/view-simulation-relations.html',
            controller: ['$uibModalInstance', 'browser', 'getRelated', function ($uibModalInstance, browser, getRelated) {
                var $ctrl = this;
                $ctrl.data = {};

                $ctrl.data.publication = browser.publication;
                
                $ctrl.getRelated = getRelated;
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
                browser: this.browser,
                getRelated: () => this.getRelated
            },
            size: 'lg'
        });
    }

    viewHybridSimulationRelations(uuid) {
        this.$uibModal.open({
            templateUrl: '/static/scripts/data-depot/templates/view-hybrid-simulation-relations.html',
            controller: ['$uibModalInstance', 'browser', 'getRelated', function ($uibModalInstance, browser, getRelated) {
                var $ctrl = this;
                $ctrl.data = {};

                $ctrl.data.publication = browser.publication;
                
                $ctrl.getRelated = getRelated;
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
                browser: this.browser,
                getRelated: () => this.getRelated
            },
            size: 'lg'
        });
    }

    viewRelations(uuid) {
        this.$uibModal.open({
            templateUrl: '/static/scripts/data-depot/templates/view-relations.html',
            controller: ['$uibModalInstance', 'browser', 'getRelated', function ($uibModalInstance, browser, getRelated) {
                var $ctrl = this;
                $ctrl.data = {};

                $ctrl.data.publication = browser.publication;
                
                $ctrl.getRelated = getRelated;
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
                browser: this.browser,
                getRelated: () => this.getRelated
            },
            size: 'lg'
        });
    }

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
    }

   onCitation(publication, entity) {
    this.$uibModal.open({
        component: 'publishedCitationModal',
        resolve: {
            publication: () => { return publication; },
            entity: () => { return entity; },
            version: () => { return 1 }
        },
        size: 'citation'
    });
    }

    download() {
        this.$uibModal.open({
            component: 'publicationDownloadModal',
            resolve: {
                publication: () => {return this.browser.publication;},
                mediaUrl: () => {return this.browser.listing.mediaUrl();},
            },
            size: 'lg'
        });
    }

}

export const PublishedComponent = {
    controller: PublishedDataCtrl,
    controllerAs: '$ctrl',
    template: publishedTemplate,
    bindings: {
        publication: '<'
    }
};
