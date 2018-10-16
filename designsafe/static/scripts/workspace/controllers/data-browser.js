function DataBrowserCtrl($scope, $controller, $rootScope, Systems, logger, DataBrowserService) {
    if ($(window).width() < 992) {
        $scope.panel.collapsed = true;
    }

    $scope.data = {
        loading: false,
        wants: null,
        systemList: [],
        filesListing: null,
        system: null,
        dirPath: [],
        filePath: '',
        loadingMore: false,
        reachedEnd: false,
        page: 0,
    };

    $scope.dataSourceUpdated = function dataSourceUpdated() {
        $scope.data.filesListing = null;
        $scope.data.loading = true;
        $scope.data.filePath = '';
        $scope.data.dirPath = [];

        /* initialize the browser */

        DataBrowserService.apiParams.fileMgr = $scope.data.system.fileMgr;
        DataBrowserService.apiParams.baseUrl = $scope.data.system.baseUrl;
        DataBrowserService.browse({system: $scope.data.system.id, path: $scope.data.filePath})
            .then(function(listing) {
                $scope.data.filesListing = listing;

                if ($scope.data.filesListing.children.length > 0) {
                    if (listing.system === 'designsafe.storage.published' || listing.system === 'nees.public') {
                        $scope.data.filePath = 'Published';
                        $scope.data.dirPath = ['', 'Published'];
                    } else {
                        $scope.data.filePath = $scope.data.filesListing.path;
                        $scope.data.dirPath = $scope.data.filePath.split('/');
                    }
                }
                $scope.data.loading = false;
            }, function(err) {
                logger.log(err);
                $scope.data.error = 'Unable to list the selected data source: ' + err.statusText;
                $scope.data.loading = false;
            });
    };

    // $scope.getFileIcon = Files.icon;

    $scope.scrollToTop = function() {
        return;
    };

    $scope.browser = DataBrowserService.state();

    $scope.scrollToBottom = function() {
        if ($scope.data.loadingMore || $scope.data.reachedEnd) {
            return;
        }
        $scope.data.loadingMore = true;
        if ($scope.data.filesListing && $scope.data.filesListing.children &&
            $scope.data.filesListing.children.length < 95) {
            $scope.data.reachedEnd = true;
            return;
        }
        $scope.data.page += 1;
        $scope.data.loadingMore = true;
        DataBrowserService.browsePage(
            {
                system: $scope.data.filesListing.system,
                path: $scope.data.filesListing.path,
                page: $scope.data.page,
            })
            .then(function(listing) {
                $scope.data.filesListing = listing;
                $scope.data.filePath = $scope.data.filesListing.path;
                $scope.data.dirPath = $scope.data.filePath.split('/');
                $scope.data.loadingMore = false;
                if (listing.children.length < 95) {
                    $scope.data.reachedEnd = true;
                }
                $scope.data.loading = false;
            }, function(err) {
                $scope.data.loadingMore = false;
                $scope.data.reachedEnd = true;
                $scope.data.loading = false;
            });
    };

    $scope.browseTrail = function($event, index) {
        $event.stopPropagation();
        $event.preventDefault();
        if ($scope.data.dirPath.length <= index + 1) {
            return;
        }
        if (($scope.data.filesListing.system === 'designsafe.storage.published' ||
            $scope.data.filesListing.system === 'nees.public') &&
            $scope.data.dirPath.length === 1) {
            $scope.data.dirPath = ['Published'];

            // Switch back to designsafe.storage.projects system when calling main projects listing
        } else if ($scope.data.filesListing.system.startsWith('project-') && index == 0) {
            $scope.data.filesListing.system = 'designsafe.storage.projects';
        }
        $scope.browseFile({
            type: 'dir',
            system: $scope.data.filesListing.system,
            resource: $scope.data.filesListing.resource,
            path: $scope.data.dirPath.slice(0, index + 1).join('/'),
        });
    };

    $scope.browseFile = function(file) {
        if (file.type !== 'folder' && file.type !== 'dir') {
            return;
        }
        $scope.data.filesListing = null;
        $scope.data.loading = true;

        // Fixes file object when created through 'browseTrail' for project dirs
        if (file.system.startsWith('project-')) {
            file.path = file.path.replace(/^(Projects\/([^/]+)[/]*)/, '');
        }
        if ($scope.data.system.id === 'designsafe.storage.published' || $scope.data.system.id === 'nees.public') {
            if (file.path.split('/').length == 1) {
                file.system = $scope.data.system.id;
                file.path = '/';
            } else if (file.system.includes('public') || file.system.includes('published')) {
                file.path = file.path.replace('Published', '');
            }
        }

        DataBrowserService.browse(file)
            .then(function(listing) {
                listing.path = listing.path.replace(/^\/*/, '');
                $scope.data.filesListing = listing;
                $scope.data.filePath = $scope.data.filesListing.path;

                // Set dirPath trail for projects and publications
                if (file.system.startsWith('project-')) {
                    if ($scope.data.dirPath.length == 1) {
                        $scope.data.dirPath = $scope.data.dirPath.concat([(file.name ? file.name : file.uuid)]);
                    } else {
                        $scope.data.dirPath = $scope.data.dirPath.slice(0, 2).concat($scope.data.filePath.split('/'));
                    }
                } else if ($scope.data.system.id === 'designsafe.storage.published' || $scope.data.system.id === 'nees.public') {
                    if (file.system.includes('public') || file.system.includes('published')) {
                        $scope.data.dirPath = $scope.data.dirPath.slice(0, 2).concat($scope.data.filePath.split('/'));
                    } else {
                        $scope.data.dirPath = (file.name ? $scope.data.dirPath.concat(file.name) : $scope.data.filePath.split('/'));
                    }
                } else {
                    $scope.data.dirPath = $scope.data.filePath.split('/');
                }
                $scope.browser.listing = $scope.data.filesListing;
                $scope.data.loading = false;
            }, function(error) {
                logger.log(error);
                $scope.data.error = 'Unable to list the selected data source: ' + error.statusText;
                $scope.data.loading = false;
            });
    };

    $scope.displayName = function displayName(file) {
        if (file.systemId === 'nees.public') {
            if (file.name === '.') {
                return '..';
            }
            return file.projecTitle || file.name;
        }
        if (file.name === '.') {
            return '..';
        }
        return file.name;
    };

    $scope.renderName = function(file) {
        if (typeof file.metadata === 'undefined' ||
            file.metadata === null ||
            _.isEmpty(file.metadata)) {
            return file.name;
        }
        let pathComps = file.path.split('/');
        let experimentRe = /^experiment/;
        if (file.path[0] === '/' && pathComps.length === 2) {
            return file.metadata.project.title;
        } else if (file.path[0] !== '/' &&
            pathComps.length === 2 &&
            experimentRe.test(file.name.toLowerCase())) {
            return file.metadata.experiments[0].title;
        }
        return file.name;
    };

    $scope.chooseFile = function(file) {
        if ($scope.data.wants) {
            $rootScope.$broadcast('provides-file', {requestKey: $scope.data.wants.requestKey, file: file});
        }
    };

    $rootScope.$on('wants-file', function($event, wantArgs) {
        $scope.data.wants = wantArgs;
        if ($scope.panel.collapsed) {
            $scope.data.wants.wasCollapsed = true;
            $scope.panel.collapsed = false;
        }
    });

    $rootScope.$on('cancel-wants-file', function($event, args) {
        if ($scope.data.wants && $scope.data.wants.requestKey === args.requestKey) {
            if ($scope.data.wants.wasCollapsed) {
                $scope.panel.collapsed = true;
            }
            $scope.data.wants = null;
        }
    });

    /* Initialize... */
    Systems.list().then(function(systemList) {
        $scope.data.systemList = systemList;
        $scope.data.system = systemList[0];
        $scope.dataSourceUpdated();
    });
}
export default DataBrowserCtrl;
