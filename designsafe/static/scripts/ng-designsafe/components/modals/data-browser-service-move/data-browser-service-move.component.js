import DataBrowserServiceMoveTemplate from './data-browser-service-move.component.html';
import _ from 'underscore';

class DataBrowserServiceMoveCtrl {

    constructor($scope, $state, FileListing, ProjectService, DataBrowserService, UserService) {
        'ngInject';
        this.$scope = $scope;
        this.$state = $state;
        this.FileListing = FileListing;
        this.ProjectService = ProjectService;
        this.DataBrowserService = DataBrowserService;
        this.UserService = UserService;
    }

    $onInit() {
        this.files = this.resolve.files;
        this.initialDestination = this.resolve.initialDestination;
        this.data = {
            files: this.files,
            names: {},
        };

        this.listing = this.initialDestination;

        this.state = {
            busy: false,
            error: null,
            listingProjects: false,
            loadingMore: false,
            reachedEnd: false,
        };
        this.offset = 0;
        this.limit=100;

        this.options = [
            {
                label: 'My Data',
                conf: { system: 'designsafe.storage.default', path: '' }
            },
            {
                label: 'My Projects',
                conf: { system: 'projects', path: '' }
            },
            {
                label: 'Shared with me',
                conf: { system: 'designsafe.storage.default', path: '$SHARE' }
            }
        ];

        let dbState = this.DataBrowserService.currentState;
        if (dbState.listing.system == 'designsafe.storage.default') { 
            this.$scope.currentOption = this.options.find((opt) => opt.label === 'My Data');
        } else if (dbState.listing.system.startsWith('project-')) {
            this.$scope.currentOption = this.options.find((opt) => opt.label === 'My Projects');
        } else if (dbState.listing.path == '$Share') {
            this.$scope.currentOption = this.options.find((opt) => opt.label === 'Shared with me');
        } else {
            this.$scope.currentOption = this.options[0];
        }

        this.$scope.$watch('currentOption', (opt) => {
            let conf = opt.conf;
            let params = opt.apiParams;
            this.state.reachedEnd = false;
            this.state.busy = true;
            this.offset = 0;

            if (conf.system != 'projects') {
                this.state.listingProjects = false;
                this.FileListing.get(conf, params, {offset: this.offset, limit: this.limit})
                    .then((listing) => {
                        this.listing = listing;
                        this.state.busy = false;
                        this.state.reachedEnd = listing.children.length < (this.limit - 1);
                    });
            } else {
                this.state.listingProjects = true;
                this.ProjectService.list({offset: this.offset, limit: this.limit})
                    .then((projects) => {
                        this.projects = _.map(projects, (p) => {
                            p.href = this.$state.href('projects.view', { projectId: p.uuid });
                            return p;
                        });
                        this.getNames();
                        this.state.busy = false;
                        this.state.reachedEnd = projects.length < $scope.limit;
                    });
            }
            if (this.$scope.currentOption.label === 'My Data') {
                this.customRoot = null;
            } else {
                this.customRoot = {
                    name: this.$scope.currentOption.label,
                    href: '#',
                    system: this.$scope.currentOption.conf.system,
                    path: this.$scope.currentOption.conf.path
                };
            }
        });


    }

    scrollToBottom() {
        this.offset += this.limit;
        this.state.loadingMore = true;
        var cOption = this.$scope.currentOption;
        if (cOption.conf.system != 'projects'){
          this.state.listingProjects = false;
          this.FileListing.get(cOption.conf, cOption.apiParams, {offset: this.offset, limit: this.limit})
            .then( listing =>  {
                this.listing.children = this.listing.children.concat(listing.children)
                this.state.reachedEnd = listing.children.length < (this.limit - 1)
                this.state.loadingMore = false;
            });
        } else {
          this.state.listingProjects = true;
          this.ProjectService.list({offset: this.offset, limit: this.limit})
            .then( projects => {
                const mappedProjects = _.map(projects, p => {
                    p.href = this.$state.href('projects.view', {projectId: p.uuid});
                        return p;});
                this.projects = this.projects.concat(mappedProjects);
                this.getNames();
                this.state.reachedEnd = projects.length < this.limit;
                this.state.loadingMore = false;
          });
        }
    };

    getNames () {
        // get user details in one request
        var piList = [];
        this.projects.forEach((proj) => {
            if (!piList.includes(proj.value.pi)) {
                piList.push(proj.value.pi);
            }
        });
        this.UserService.getPublic(piList).then((resp) => {
            var data = resp.userData;
            data.forEach((user) => {
                this.data.names[user.username] = user.fname + ' ' + user.lname;
            });
        });
    }

    onBrowse($event, fileListing) {
        $event.preventDefault();
        $event.stopPropagation();
        this.state.listingProjects = false;
        var system = fileListing.system || fileListing.systemId;
        var path = fileListing.path;
        if (typeof system === 'undefined' && typeof path === 'undefined' && fileListing.value) {
            system = 'project-' + fileListing.uuid;
            path = '/';
        }
        if (system === 'designsafe.storage.default' && path === '/') {
            path = path + fileListing.name;
        }

        this.state.busy = true;
        this.state.error = null;
        this.FileListing.get({ system: system, path: path }).then(
            (listing) => {
                this.listing = listing;
                this.state.busy = false;
            },
            (error) => {
                this.state.busy = false;
                this.state.error = error.data.message || error.data;
            }
        );
    }

    validDestination(fileListing) {
        return fileListing && (fileListing.type === 'dir' || fileListing.type === 'folder') && fileListing.permissions && (fileListing.permissions === 'ALL' || fileListing.permissions.indexOf('WRITE') > -1);
    }

    chooseDestination(fileListing) {
        this.close({ $value: fileListing });
    }

    cancel() {
        this.dismiss();
    }

}

export const DataBrowserServiceMoveComponent = {
    template: DataBrowserServiceMoveTemplate,
    controller: DataBrowserServiceMoveCtrl,
    controllerAs: '$ctrl',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
};


