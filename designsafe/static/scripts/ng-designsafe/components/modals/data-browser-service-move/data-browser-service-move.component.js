import DataBrowserServiceMoveTemplate from './data-browser-service-move.component.html';
import _ from 'underscore';


class DataBrowserServiceMoveCtrl {

    constructor($scope, $state, FileListing, ProjectService) {
        'ngInject';
        this.$scope = $scope
        this.$state = $state
        this.FileListing = FileListing
        this.ProjectService = ProjectService
    }

    $onInit() {
        this.files = this.resolve.files
        this.initialDestination = this.resolve.initialDestination
    
        this.data = {
            files: this.files
        };
        //$scope.data = data;

        this.listing = this.initialDestination;

        this.state = {
            busy: false,
            error: null,
            listingProjects: false
        };

        this.options = [
            {
                label: 'My Projects',
                conf: { system: 'projects', path: '' }
            },
            {
                label: 'Shared with me',
                conf: { system: 'designsafe.storage.default', path: '$SHARE' }
            },
            {
                label: 'My Data',
                conf: { system: 'designsafe.storage.default', path: ''  }
            }
        ];

        this.$scope.currentOption = null;


        this.$scope.$watch('currentOption', () => {
            this.state.busy = true;
            var conf = this.$scope.currentOption.conf;
            if (conf.system != 'projects') {
                this.state.listingProjects = false;
                this.FileListing.get(conf)
                    .then(listing => {
                        console.log(listing)
                        this.listing = listing;
                        this.state.busy = false;
                    });
            } else {
                this.state.listingProjects = true;
                this.ProjectService.list()
                    .then(projects => {
                        this.projects = _.map(projects, (p) => {
                            p.href = this.$state.href('projects.view', { projectId: p.uuid });
                            console.log(p)
                            return p;
                        });
                        this.state.busy = false;
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

        this.$scope.currentOption = this.options[0];

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
    };

    validDestination(fileListing) {
        return fileListing && (fileListing.type === 'dir' || fileListing.type === 'folder') && fileListing.permissions && (fileListing.permissions === 'ALL' || fileListing.permissions.indexOf('WRITE') > -1);
    };

    chooseDestination(fileListing) {
        //$uibModalInstance.close(fileListing);
        console.log(fileListing)
        this.close({$value: fileListing})
    };

    cancel() {
        this.dismiss();
    };

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
}



