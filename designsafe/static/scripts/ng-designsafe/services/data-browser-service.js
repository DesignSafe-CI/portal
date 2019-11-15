import _ from 'underscore';
import { Subject } from 'rxjs'

export function nbv($window) { //from http://jameshill.io/articles/angular-third-party-injection-pattern/
  if ($window.nbv) {
    //Delete nbv from window so it's not globally accessible.
    //  We can still get at it through _thirdParty however, more on why later
    $window._thirdParty = $window._thirdParty || {};
    $window._thirdParty.nbv = $window.nbv;
    try { delete $window.nbv; } catch (e) {
    $window.nbv = undefined;
      /*<IE8 doesn't do delete of window vars, make undefined if delete error*/
  }
  }
  var nbv = $window._thirdParty.nbv;
  return nbv;
};

export function DataBrowserService($rootScope, $http, $q, $uibModal,
                  $state, Django, FileListing, Logging,
                  SystemsService, nbv, ProjectEntitiesService) {
  'ngInject';
  var logger = Logging.getLogger('ngDesignSafe.DataBrowserService');

  /**
   * @type {{busy: boolean, listing: FileListing, selected: Array}}
   */
  var currentState = {
    busy: false,
    busyListing: false,
    error: null,
    listing: null,
    selected: [],
    loadingMore: false,
    reachedEnd: false,
    page: 0,
    showMainListing: true,
    showPreviewListing: false,
    ui: {},
    tests: null,
  };

  var projectBreadcrumbSubject = new Subject();

  var apiParams = {
    fileMgr : 'agave',
    baseUrl : '/api/agave/files'
  };

  /**
   * Enumeration of event `DataBrowserService::Event` types
   *
   * @readonly
   * @enum {string}
   */
  var FileEvents = {
    FILE_ADDED: 'FileAdded',
    FILE_COPIED: 'FileCopied',
    FILE_MOVED: 'FileMoved',
    FILE_REMOVED: 'FileRemoved',
    FILE_SELECTION: 'FileSelection',
    FILE_META_UPDATED: 'MetadataUpdated'
  };

  /**
   * Enumeration of event `DataBrowserService::EventMessage` strings
   *
   * @readonly
   * @enum {string}
   */
  var FileEventsMsg = {
    FILE_ADDED: 'Your file was added.',
    FILE_COPIED: 'Your file was copied.',
    FILE_MOVED: 'Your file was moved.',
    FILE_REMOVED: 'Your file was remove.',
    FILE_SELECTION: 'Your file has been selected.',
    FILE_META_UPDATED: 'Metadata object updated.',
  };

  /**
   * Gets the apiParams of the DataBrowserService.
   */
  function apiParameters(){
    return apiParams;
  }

  /**
   * Gets the state of the DataBrowserService.
   *
   * @return {{busy: boolean, listing: FileListing, selected: Array}}
   */
  function state() {
    return currentState;
  }


  /**
   *
   * @param {FileListing[]} files FileListing objects to select
   * @param {boolean} [reset] If true, clears current selection before selecting the passed files.
   */
  function select(files, reset) {
    if (reset) {
      deselect(currentState.selected);
    }
    _.each(files, function(f) {
      f._ui = f._ui || {};
      f._ui.selected = true;
    });
    currentState.selected = _.union(currentState.selected, files);
    currentState.tests = allowedActions(currentState.selected)
  }


  /**
   *
   * @param {FileListing[]} files FileListing objects to de-select
   */
  function deselect(files) {
    _.each(files, function(f) {
      f._ui = f._ui || {};
      f._ui.selected = false;
    });
    currentState.selected = _.difference(currentState.selected, files);
    currentState.tests = allowedActions(currentState.selected)
  }


  /**
    Checks to see if there is a folder in the selected listings. If so, download
    is not available.
    @param {FileListing|FileListing[]} files Files to test
    @return {boolean}
  */
  function containsFolder(files) {
    for (var i=0; i<files.length; i++) {
      if (files[i].format === 'folder') return true;
    }
    return false;
  }


    /**
     * Tests for the DataBrowser actions allowed on the given file(s) from the current listing.
     *
     * @param {FileListing|FileListing[]} files Files to test
     * @return {{canDownload: {boolean}, canPreview: {boolean}, canViewCitation: {boolean}, canViewMetadata: {boolean}, canShare: {boolean}, canCopy: {boolean}, canMove: {boolean}, canRename: {boolean}, canTrash: {boolean}, canDelete: {boolean}}}
     */
    function allowedActions (files) {
      if (! Array.isArray(files)) {
        files = [files];
      }
    var tests = {};
      tests.canDownload = files.length >= 1 && hasPermission('READ', files) && (!(containsFolder(files)));
      tests.canPreview = files.length === 1 && hasPermission('READ', files) && !['publicData'].includes($state.current.name);
      tests.canPreviewImages = files.length >= 1 && hasPermission('READ', files) && !['dropboxData', 'boxData', 'googledriveData', 'publicData', 'neesPublished'].includes($state.current.name);
      tests.canViewMetadata = files.length >= 1 && hasPermission('READ', files) && !['publicData', 'publishedData.view', 'communityData', 'neesPublished'].includes($state.current.name);
      tests.canViewCitation = files.length >= 1 && hasPermission('READ', files);
      tests.canShare = files.length === 1 && $state.current.name === 'myData';
      tests.canCopy = files.length >= 1 && hasPermission('READ', files) && !['publicData'].includes($state.current.name);
      tests.canMove = files.length >= 1 && hasPermission('WRITE', files) && !['dropboxData', 'boxData', 'googledriveData', 'publicData', 'publishedData.view', 'communityData'].includes($state.current.name);
      tests.canRename = files.length === 1 && hasPermission('WRITE', files) && !['dropboxData', 'boxData', 'googledriveData', 'publicData', 'publishedData.view', 'communityData'].includes($state.current.name);
      tests.enablePreview = containsFolder(files) || files.filter(({ path }) => {
        const ext = path.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'tiff', 'gif'].indexOf(ext) !== -1;
      }).length > 0;
      var trashPath = _trashPath();
      tests.canTrash = ($state.current.name === 'myData' || $state.current.name === 'projects.view.data') && files.length >= 1 && currentState.listing.path !== trashPath && ! _.some(files, function(sel) { return isProtected(sel); });
      tests.canDelete = $state.current.name === 'myData' && files.length >= 1 && currentState.listing.path === trashPath;

      return tests;
    }

  function showListing(){
    currentState.showMainListing = true;
    currentState.showPreviewListing = false;
  }

    function showPreview(){
      currentState.showMainListing = false;
      currentState.showPreviewListing = true;
    }

    var req;
    /**
     *
     * @param options
     * @param options.system
     * @param options.path
     */
    function browse (options, params) {
      // resolve any ongoing requests
      if(req){
        req.stopper.resolve();
        req = null;
      }

      currentState.busy = true;
      currentState.busyListing = true;
      currentState.error = null;
      currentState.loadingMore = true;
      currentState.reachedEnd = false;
      currentState.busyListingPage = false;
      currentState.page = 0;

      if (params) {
        req = FileListing.get(options, apiParams, params); // stopper is returned here...
      }
      else {
        req = FileListing.get(options, apiParams); // stopper is returned here... 
      }

      var currentReq = req.then(function (listing) {
        select([], true);
        currentState.busy = false;
        currentState.busyListing = false;
        currentState.loadingMore = false;
        currentState.reachedEnd = false;
        currentState.listing = listing;
        return listing;
      }, function (err) {

        // keep spinning if user navigates from original selection
        // or stop spinning after displaying error message
        if(err.data) {
          currentState.busy = false;
        } else {
          currentState.busy = true;
        }
        currentState.busyListing = false;
        currentState.listing = null;
        currentState.error = err.data;
        currentState.loadingMore = false;
        currentState.reachedEnd = false;
        return $q.reject(err);
      });
      return currentReq;
    }

  /**
   *
   * @param options
   * @param options.system
   * @param options.path
   * @param options.page
   */
  function browsePage (options) {
    currentState.busy = true;
    currentState.busyListingPage = true;
    currentState.error = null;
    var limit = 100;
    var offset = 0;
    if (options.page){
      offset += limit * options.page;
    }
    var params = {limit: limit, offset: offset, query_string: options.queryString, typeFilters: options.typeFilters};
    return FileListing.get(options, apiParams, params).then(function (listing) {
      select([], true);
      currentState.busy = false;
      currentState.busyListingPage = false;
      currentState.listing.children = currentState.listing.children.concat(listing.children);
      return listing;
    }, function (err) {
      currentState.busy = false;
      currentState.busyListingPage = false;
    });
  }


  /**
   *
   * @param {FileListing|FileListing[]} files
   * @return {*}
   */
  function copy (files) {
    if (! Array.isArray(files)) {
      files = [files];
    }

    var modal = $uibModal.open({
      template: require('../html/modals/data-browser-service-copy.html'),
      controller: ['$scope', '$uibModalInstance', 'FileListing', 'data', 'ProjectService', 'UserService',
                    function ($scope, $uibModalInstance, FileListing, data, ProjectService, UserService) {

        $scope.data = data;
        $scope.data.names = {};

        $scope.state = {
          busy: false,
          error: null,
          listingProjects: false
        };

        $scope.options = [
          {label: 'My Projects',
            conf: {system: 'projects', path: ''},
            apiParams: {fileMgr: 'agave', baseUrl: '/api/agave/files'}},
            {label: 'Shared with me',
            conf: {system: 'designsafe.storage.default', path: '$SHARE'},
            apiParams: {fileMgr: 'agave', baseUrl: '/api/agave/files'}},
            {label: 'My Data',
            conf: {system: 'designsafe.storage.default', path: ''},
            apiParams: {fileMgr: 'agave', baseUrl: '/api/agave/files'}},  
          {label: 'Box',
            conf: {path: '/'},
            apiParams: {fileMgr: 'box', baseUrl: '/api/external-resources/files'}},
          {label: 'Dropbox',
            conf: {path: '/'},
            apiParams: {fileMgr: 'dropbox', baseUrl: '/api/external-resources/files'}},
          {label: 'Google Drive',
            conf: {path: '/'},
            apiParams: {fileMgr: 'googledrive', baseUrl: '/api/external-resources/files'}}
        ];

        $scope.currentOption = null;
        $scope.$watch('currentOption', function () {
          $scope.state.busy = true;
          var cOption = $scope.currentOption;
          if (cOption.conf.system != 'projects'){
            $scope.state.listingProjects = false;
            FileListing.get(cOption.conf, cOption.apiParams)
              .then(function (listing) {
                $scope.listing = listing;
                $scope.state.busy = false;
              });
          } else {
            $scope.state.listingProjects = true;
            ProjectService.list()
              .then(function(projects){
                $scope.projects = _.map(projects, function(p) {
                  p.href = $state.href('projects.view', {projectId: p.uuid});
                  return p;});
                $scope.getNames();
                $scope.state.busy = false;
            });
          }

          if ($scope.currentOption.label === 'My Data') {
            $scope.customRoot = null;
          } else {
            $scope.customRoot = {
              name: $scope.currentOption.label,
              href: '#',
              system: $scope.currentOption.conf.system,
              path: $scope.currentOption.conf.path
            };
          }
        });
        $scope.currentOption = $scope.options[0];

        $scope.getNames = function () {
          // get user details in one request
          var piList = [];
          $scope.projects.forEach((proj) => {
            if (!piList.includes(proj.value.pi)) {
              piList.push(proj.value.pi);
            }
          });
          UserService.getPublic(piList).then((resp) => {
            var data = resp.userData;
            data.forEach((user) => {
              $scope.data.names[user.username] = user.fname + ' ' + user.lname;
            });
          });
        };

        $scope.onBrowse = function ($event, fileListing) {
          $event.preventDefault();
          $event.stopPropagation();
          $scope.state.listingProjects = false;
          var system = fileListing.system || fileListing.systemId;
          var path = fileListing.path;
          if (typeof system === 'undefined' && typeof path === 'undefined' && fileListing.value){
              system = 'project-' + fileListing.uuid;
              path = '/';
          }
          if (system === 'designsafe.storage.default' && path === '/') {
            path = path + fileListing.name;
          }

          $scope.state.busy = true;
          FileListing.get({system: system, path: path}, $scope.currentOption.apiParams)
            .then(function (listing) {
              $scope.listing = listing;
              $scope.state.busy = false;
            });
        };

        $scope.validDestination = function (fileListing) {
          return fileListing && ( fileListing.type === 'dir' || fileListing.type === 'folder') && fileListing.permissions && (fileListing.permissions === 'ALL' || fileListing.permissions.indexOf('WRITE') > -1);
        };

        $scope.chooseDestination = function (fileListing) {
          $uibModalInstance.close(fileListing);
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss();
        };

      }],
      resolve: {
        data: {
          files: files
        }
      }
    });

    return modal.result.then(
      function (result) {
        currentState.busy = true;
        var copyPromises = _.map(files, function (f) {
          var system = result.system || f.system;
          return f.copy({system: result.system, path: result.path, resource: result.resource, id: result.id}).then(function (result) {
            //notify(FileEvents.FILE_COPIED, FileEventsMsg.FILE_COPIED, f);
            return result;
          });
        });
        return $q.all(copyPromises).then(function (results) {
          currentState.busy = false;
          return results;
        });
      }
    );
  }


  // /**
  //  *
  //  */
  // function details () {
  //   throw new Error('not implemented')
  // }


  /**
   * Download files. Returns a promise that is resolved when all downloads have been
   * _started_. Resolved with the download URL for each file.
   *
   * @param {FileListing|FileListing[]} files
   * @return {Promise}
   */
  function download (files) {
    if (! Array.isArray(files)) {
      files = [files];
    }
    var download_promises = _.map(files, function(file) {
      return file.download().then(function (downloadUrl) {

        var link = document.createElement('a');
        link.style.display = 'none';
        link.setAttribute('href', downloadUrl.href);
        link.setAttribute('download', "null");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return downloadUrl;
      });
    });
    return $q.all(download_promises);
  }


  /**
   * TODO
   *
   * @returns {*}
   */
  function getFileManagers () {
    return $http.get('/api/files/file-managers/').then(function (resp) {
      return resp.data;
    });
  }


  /**
   *
   * @param {string} permission
   * @param {FileListing|FileListing[]} files
   */
  function hasPermission (permission, files) {
    if (! Array.isArray(files)) {
      files = [files];
    }
    return _.reduce(files, function(memo, file) {
      var pem = file.permissions === 'ALL' || file.permissions.indexOf(permission) > -1;
      if (memo !== null) {
        pem = memo && pem;
      }
      return pem;
    }, null);
  }


  /**
   * This is not a great implementation, need to be more extensible...
   * @param {FileListing} file
   */
  function isProtected (file) {
    if (file.system === 'designsafe.storage.default') {
      if (file.trail.length === 3 && file.name === '.Trash') {
        return true;
      }
    }
    return false;
  }


  /**
   * Create a directory in the current listing directory.
   *
   * @returns {Promise}
   */
  function mkdir () {
    var modal = $uibModal.open({
      template: require('../html/modals/data-browser-service-mkdir.html'),
      controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
        $scope.form = {
          folderName: 'Untitled_folder'
        };

        $scope.doCreateFolder = function($event) {
          $event.preventDefault();
          $uibModalInstance.close($scope.form.folderName);
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
      }]
    });

    return modal.result.then(function(folderName) {
      currentState.busy = true;
      currentState.listing.mkdir({
        name: folderName
      }).then(function(newDir) {
        currentState.busy = false;
        //notify(FileEvents.FILE_ADDED, FileEventsMsg.FILE_ADDED, newDir);
      }, function(err) {
        // TODO better error handling
        logger.error(err);
        currentState.busy = false;
      });
    });
  }


  /**
   *
   * @param {FileListing|FileListing[]} files
   * @param {FileListing} initialDestination
   * @returns {Promise}
   */
  function move (files, initialDestination) {
    if (! Array.isArray(files)) {
      files = [files];
    }
    var modal = $uibModal.open({
      component: 'move',
      resolve: {
        files: () => files,
        initialDestination: () => initialDestination
      }
    })
    /*
    var modal = $uibModal.open({
      template: require('../html/modals/data-browser-service-move.html'),
      controller: ['$scope', '$uibModalInstance', 'FileListing', 'files', 'initialDestination', 'ProjectService', function ($scope, $uibModalInstance, FileListing, files, initialDestination, ProjectService) {

        $scope.data = {
          files: files
        };
        //$scope.data = data;

        $scope.listing = initialDestination;

        $scope.state = {
          busy: false,
          error: null,
          listingProjects: false
        };

        $scope.options = [
          {label: 'My Data',
            conf: {system: 'designsafe.storage.default', path: ''}},
          {label: 'Shared with me',
            conf: {system: 'designsafe.storage.default', path: '$SHARE'}},
          {label: 'My Projects',
            conf: {system: 'projects', path: ''}}
        ];

        $scope.currentOption = null;
        $scope.$watch('currentOption', function () {
          $scope.state.busy = true;
          var conf = $scope.currentOption.conf;
          if (conf.system != 'projects'){
              $scope.state.listingProjects = false;
              FileListing.get(conf)
                .then(function (listing) {
                  $scope.listing = listing;
                  $scope.state.busy = false;
                });
          } else {
            $scope.state.listingProjects = true;
            ProjectService.list()
              .then(function(projects){
                $scope.projects = _.map(projects, function(p) {
                  p.href = $state.href('projects.view', {projectId: p.uuid});
                  return p;});
                $scope.state.busy = false;
            });
          }
          if ($scope.currentOption.label === 'My Data') {
            $scope.customRoot = null;
          } else {
            $scope.customRoot = {
              name: $scope.currentOption.label,
              href: '#',
              system: $scope.currentOption.conf.system,
              path: $scope.currentOption.conf.path
            };
          }
        });
        $scope.currentOption = $scope.options[0];

        $scope.onBrowse = function ($event, fileListing) {
          $event.preventDefault();
          $event.stopPropagation();
          $scope.state.listingProjects = false;
          var system = fileListing.system || fileListing.systemId;
          var path = fileListing.path;
          if (typeof system === 'undefined' && typeof path === 'undefined' && fileListing.value){
              system = 'project-' + fileListing.uuid;
              path = '/';
          }
          if (system === 'designsafe.storage.default' && path === '/') {
            path = path + fileListing.name;
          }

          $scope.state.busy = true;
          $scope.state.error = null;
          FileListing.get({system: system, path: path}).then(
            function (listing) {
              $scope.listing = listing;
              $scope.state.busy = false;
            },
            function (error) {
              $scope.state.busy = false;
              $scope.state.error = error.data.message || error.data;
            }
          );
        };

        $scope.validDestination = function (fileListing) {
          return fileListing && ( fileListing.type === 'dir' || fileListing.type === 'folder') && fileListing.permissions && (fileListing.permissions === 'ALL' || fileListing.permissions.indexOf('WRITE') > -1);
        };

        $scope.chooseDestination = function (fileListing) {
          $uibModalInstance.close(fileListing);
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss();
        };

      }],
      resolve: {
        files: function () { return files; },
        initialDestination: function () { return initialDestination; }
      }
    });
    */
    return modal.result.then(
      function (result) {

        currentState.busy = true;
        //if (result.system !== files[0].system){
        //  return $q.when(files);
        //}

        var movePromises = _.map(files, function (f) {
          return f.move({system: result.system, path: result.path}).then(function (result) {
            deselect([f]);
            //notify(FileEvents.FILE_MOVED, FileEventsMsg.FILE_MOVED, f);
            return result;
          });
        });
        return $q.all(movePromises).then(function (results) {
          currentState.busy = false;
          return results;
        });
      
      } 
    )
  }

  

  /**
   *
   * @param {FileListing} file
   * @return {Promise}
   */

  function preview (file, listing) {
    var modal = $uibModal.open({
      component: 'preview',
      resolve: {
        file: () => file,
        listing: () => listing
      },
      size: 'lg'
    })
  }

    /*
  function preview (file, listing) {
    var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/data-browser-service-preview.html',
      controller: ['$scope', '$uibModalInstance', '$sce', 'file', function ($scope, $uibModalInstance, $sce, file) {
        $scope.file = file;
        if (typeof listing !== 'undefined' &&
            typeof listing.metadata !== 'undefined' &&
            !_.isEmpty(listing.metadata.project)){
          var _listing = angular.copy(listing);
          $scope.file.metadata = _listing.metadata;
        }
        $scope.busy = true;

        file.preview().then(
          function (data) {
            $scope.previewHref = $sce.trustAs('resourceUrl', data.href);
            $scope.busy = false;
          },
          function (err) {
            var fileExt = file.name.split('.').pop();
            var videoExt = ['webm', 'ogg', 'mp4'];

            //check if preview is video
            if (videoExt.includes(fileExt) ) {
              $scope.prevVideo = true;
              file.download().then(
                function(data){
                  var postit = data.href;
                  var oReq = new XMLHttpRequest();
                  oReq.open("GET", postit, true);
                  oReq.responseType = 'blob';

                  oReq.onload = function() {
                    if (this.status === 200) {
                      var videoBlob = this.response;
                      var vid = URL.createObjectURL(videoBlob);

                      // set video source and mimetype
                      document.getElementById("videoPlayer").src=vid;
                      document.getElementById("videoPlayer").setAttribute('type', `video/${fileExt}`);
                      }
                  };
                  oReq.onerror = function() {
                    $scope.previewError = err.data;
                    $scope.busy = false;
                  };
                  oReq.send();
                  $scope.busy = false;
                },
                function (err) {
                  $scope.previewError = err.data;
                  $scope.busy = false;
                });
            // if filetype is not video or ipynb
            } else if (fileExt != 'ipynb') {
              $scope.previewError = err.data;
              $scope.busy = false;
            // if filetype is ipynb
            } else {
                file.download().then(
                  function(data){
                    var postit = data.href;
                    var oReq = new XMLHttpRequest();

                    oReq.open("GET", postit, true);

                    oReq.onload = function(oEvent) {
                      var blob = new Blob([oReq.response], {type: "application/json"});
                      var reader = new FileReader();

                        reader.onload = function(e){
                          var content = JSON.parse(e.target.result);
                          var target = $('.nbv-preview')[0];
                          nbv.render(content, target);
                    };

                        reader.readAsText(blob);
                    };

                    oReq.send();
                  },
                  function (err) {
                    $scope.previewError = err.data;
                    $scope.busy = false;
                  });
            }
          }
        );

        $scope.tests = allowedActions([file]);

        $scope.download = function() {
          download(file);
        };
        $scope.share = function() {
          share(file);
        };
        $scope.copy = function() {
          copy(file);
        };
        $scope.move = function() {
          move(file, currentState.listing);
        };
        $scope.rename = function() {
          rename(file);
        };
        $scope.viewMetadata = function() {
          $scope.close();
          viewMetadata([file]);
        };
        $scope.trash = function() {
          trash(file);
        };
        $scope.rm = function() {
          rm(file);
        };

        $scope.close = function () {
          $uibModalInstance.dismiss();
        };

      }],
      size: 'lg',
      resolve: {
        file: function() { return file; }
      }
    });

    // modal.rendered.then(
    //   function(){
    //     if (file.name.split('.').pop() == 'ipynb'){
    //       file.download().then(
    //         function(data){
    //           var postit = data.href;
    //           var oReq = new XMLHttpRequest();

    //           oReq.open("GET", postit, true);

    //           oReq.onload = function(oEvent) {
    //             var blob = new Blob([oReq.response], {type: "application/json"});
    //             var reader = new FileReader();

    //             reader.onload = function(e){
    //               var content = JSON.parse(e.target.result)
    //               var target = $('.nbv-preview')[0];
    //               nbv.render(content, target);
    //             }

    //             reader.readAsText(blob)
    //           };

    //           oReq.send();
    //         },
    //         function (err) {
    //           $scope.previewError = err.data;
    //           $scope.busy = false;
    //         }
    //       );
    // }})

    return modal.result;
  }
  */
  /**
   *
   * @param {FileListing} images
   * @return {Promise}
   */

  function previewImages(images) {
    return $uibModal.open({
      component: 'ddimagepreview',
      resolve: {
        images: () => images
      },
      size: 'lg'
    })
  }

  // function previewImages (folder) {
  //   var modal = $uibModal.open({
  //     windowClass: 'modal-full',
  //     template: require('../html/modals/data-browser-service-preview-images.html'),
  //     controller: ['$scope', '$uibModalInstance', '$sce', 'folder','UserService', function ($scope, $uibModalInstance, $sce, folder) {
  //       $scope.folder = folder;
  //       var img_extensions = ['jpg', 'jpeg', 'png', 'tiff', 'gif'];
  //       $scope.busy = true;
  //       $scope.images = [];
  //       $scope.hrefs = [];
  //       $scope.carouselSettings = {
  //         dots: true,
  //         arrows: true,
  //         lazyLoad: true,
  //         event: {
  //           beforeChange: function (ev, slick, currentSlide, nextSlide) {
  //             $scope.images[nextSlide].href = $scope.hrefs[nextSlide].href;
  //           }
  //         }

  //       };
  //       $scope.folder.children.forEach(function (file) {
  //         var ext = file.path.split('.').pop().toLowerCase();
  //         if (img_extensions.indexOf(ext) !== -1) {
  //             $scope.hrefs.push({href: file.agaveUrl(), file:file});
  //             $scope.images.push({file:file});
  //         }
  //       });
  //       $scope.images[0] = $scope.hrefs[0];

  //       if ($scope.images.length > 10) {
  //         $scope.carouselSettings.dots = false;
  //       }

  //       $scope.close = function () {
  //         $uibModalInstance.dismiss();
  //       };

  //     }],
  //     size: 'lg',
  //     resolve: {
  //       folder: function() { return folder; }
  //     }
  //   });

  //   return modal.result;
  // }

  /**
   *
   * @param {FileListing} file
   * @return {Promise}
   */
  function rename (file) {
    var modal = $uibModal.open({
      template: require('../html/modals/data-browser-service-rename.html'),
      controller: ['$scope', '$uibModalInstance', 'file', function ($scope, $uibModalInstance, file) {
        $scope.form = {
          targetName: file.name
        };

        $scope.file = file;

        $scope.doRenameFile = function($event) {
          $event.preventDefault();
          $uibModalInstance.close({file: file, renameTo: $scope.form.targetName});
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
      }],
      resolve: {
        file: file
      }
    });

    return modal.result.then(function (result) {
      currentState.busy = true;
      return result.file.rename({name: result.renameTo})
        .then(
          function (res) {
            currentState.busy = false;
          },
          function (err) {
            logger.error(err);
            currentState.busy = false;
          });
    });
  }


  /**
   *
   * @param {FileListing|FileListing[]} files
   * @return {Promise}
   */
  function rm (files) {
    if (! Array.isArray(files)) {
      files = [files];
    }

    var modal = $uibModal.open({
      template: require('../html/modals/data-browser-service-rm.html'),
      controller: ['$scope', '$uibModalInstance', 'files', function ($scope, $uibModalInstance, files) {
        $scope.files = files;

        $scope.confirm = function() {
          $uibModalInstance.close(files);
        };

        $scope.cancel = function() {
          $uibModalInstance.dismiss();
        };
      }],
      resolve: {
        files: function() { return files; }
      }
    });

    return modal.result.then(
      function (files) {
        currentState.busy = true;
        var deletePromises = _.map(files, function (file) {
          return file.rm().then(function (result) {
            deselect([file]);
            //notify(FileEvents.FILE_REMOVED, FileEventsMsg.FILE_REMOVED, file);
            return result;
          });
        });
        return $q.all(deletePromises).then(
          function (result) {
            currentState.busy = false;
            return result;
          },
          function (err) {
            logger.error(err);
            currentState.busy = false;
          }
        );
      }
    );
  }


  /**
   * TODO
   *
   * @param options
   */
  function search (options) {
    currentState.busy = true;
    currentState.busyListing = true;
    currentState.error = null;
    return FileListing.search(options, apiParams).then(function (listing) {
      select([], true);
      currentState.busy = false;
      currentState.busyListing = false;
      currentState.listing = listing;
      return listing;
    }, function (err) {
      currentState.busy = false;
      currentState.busyListing = false;
      currentState.listing = null;
      currentState.error = err.data;
    });
  }


  /**
   * Update sharing permissions on a file.
   *
   * @param {FileListing} file
   * @return {*}
   */
  function share (file) {
    var modal = $uibModal.open({
      template: require('../html/modals/data-browser-service-share.html'),
      controller: ['$scope', '$uibModalInstance', 'Django', 'UserService', 'file', function ($scope, $uibModalInstance, Django, UserService, file) {
        $scope.data = {
          busy: true,
          file: file,
          currentUser: Django.user,
          permissionOptions: [
            {permission: 'READ', label: 'Read Only'},
            {permission: 'READ_WRITE', label: 'Read/Write'},
            {permission: 'ALL', label: 'All'},
            {permission: 'NONE', label: 'None (Revoke Permission)'}
          ]
        };

        $scope.form = {
          currentPermissions: [],
          addPermissions: [{
            username: null,
            permission: $scope.data.permissionOptions[0]
          }]
        };

        file.listPermissions().then(
          function (result) {
            $scope.form.currentPermissions = _.chain(result)
              .reject(function (pem) { return pem.username === 'ds_admin' || pem.username === Django.user; })
              .map(
                function (pem) {
                  if (pem.permission.read) {
                    if (pem.permission.write) {
                      if (pem.permission.execute) {
                        pem.permission = $scope.data.permissionOptions[2];
                      } else {
                        pem.permission = $scope.data.permissionOptions[1];
                      }
                    } else {
                      pem.permission = $scope.data.permissionOptions[0];
                    }
                  } else {
                    pem.permission = $scope.data.permissionOptions[3];
                  }
                  return pem;
                }
              ).value();
            $scope.form.initialPermissions = angular.copy($scope.form.currentPermissions);
            $scope.data.busy = false;
          },
          function (errResp) {
            $scope.data.busy = false;
            $scope.data.errorMessage = errResp.data;
          }
        );

        $scope.searchUsers = function(q) {
          return UserService.search({q: q});
        };

        $scope.formatSelection = function() {
          if (this.pem.username) {
            return this.pem.username.first_name +
              ' ' + this.pem.username.last_name +
              ' (' + this.pem.username.username + ')';
          }
        };

        $scope.addNewPermission = function() {
          $scope.form.addPermissions.push({username: null, permission: $scope.data.permissionOptions[0]});
        };

        $scope.doShareFiles = function($event) {
          $event.preventDefault();

          var pemsToSave = [];

          // Only save existing permissions if the permission changed
          _.each($scope.form.currentPermissions, function (pem) {
            var prev = _.findWhere($scope.form.initialPermissions, {username: pem.username});
            if (prev.permission.permission !== pem.permission.permission) {
              pemsToSave.push({username: pem.username, permission: pem.permission.permission});
            }
          });

          // Format new permissions
          var addPems = _.filter($scope.form.addPermissions, function (pem) {
            return pem.username;
          });
          Array.prototype.push.apply(pemsToSave, _.map(addPems, function (pem) {
            return {
              username: pem.username.username,
              permission: pem.permission.permission
            };
          }));

          // Resolve modal with pems that need to be saved
          $uibModalInstance.close(pemsToSave);
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };

      }],
      size: 'lg',
      resolve: {
        file: function () { return file; }
      }
    });

    return modal.result.then(function (pemsToSave) {
      currentState.busy = true;
      var sharePromises = _.map(pemsToSave, function (pem) {
        return file.share(pem);
      });
      return $q.all(sharePromises).then(function (results) {
        currentState.busy = false;
        return results;
      });
    });
  }


  /**
   *
   * @param {FileListing|FileListing[]} files The files to move to Trash
   * @return {Promise} A promise that is resolved with the trashed files when _all_ files have been
   * successfully Trashed.
   */
  function trash (files) {
    if (! Array.isArray(files)) {
      files = [files];
    }

    currentState.busy = true;
    var trashPromises = _.map(files, function(file) {
      return file.trash().then(function(trashed) {
        //notify(FileEvents.FILE_MOVED, FileEventsMsg.FILE_MOVED, trashed);
        return trashed;
      });
    });
    return $q.all(trashPromises).then(function(val) {
      currentState.busy = false;
      browse(currentState.listing, apiParams);
      return val;
    }, function(err) {
      logger.error(err);
      currentState.busy = false;
    });
  }


  function _trashPath() {
    if (currentState.listing && currentState.listing.system) {
      switch (currentState.listing.system) {
        case 'designsafe.storage.default':
          return ['', Django.user, '.Trash'].join('/');
        case 'designsafe.storage.projects':
          var projectDir = currentState.listing.path.split('/')[1];
          return ['', projectDir, '.Trash'].join('/');
        default:
          return undefined;
      }
    }
    return undefined;
  }


  /**
   * Upload files or folders to the currently listed destination
   *
   * @param {boolean} directoryUpload
   * @param {FileList} [files] Initial selected file(s) to upload
   */
  function upload(directoryUpload, files) {
    var modal = $uibModal.open({
      template: require('../html/modals/data-browser-service-upload.html'),
      controller: function ($scope, $q, $uibModalInstance, Modernizr, directoryUpload, destination, files) {

        $scope.data = {
          destination: destination,
          selectedFiles: files || [],
          uploads: []
        };

        $scope.state = {
          uploading: false,
          retry: false,
          directoryUpload: directoryUpload,
          directoryUploadSupported: Modernizr.fileinputdirectory,
          ui: {tagFiles: false}
        };

        $scope.$watch('data.selectedFiles', function(newValue) {
          _.each(newValue, function(val) {
            $scope.data.uploads.push({
              file: val,
              state: 'pending',
              promise: null
            });
          });

          // reset file control since we want to allow multiple selection events
          $('#id-choose-files').val(null);
        });

        $scope.tagFiles = function(){
          $uibModalInstance.close();
          var files = _.filter(currentState.listing.children, function(child){
            if(_.find($scope.data.uploads, function(upload){
              return upload.file.name === child.name;
            })){
                return true;
            }else{
                return false;
            }
          });
          if (files.length){
            // viewCategories(files);
          } else {
            // viewCategories();
          }
        };

        $scope.upload = function() {
          $scope.state.uploading = true;
          var tasks = _.map($scope.data.uploads, function(upload) {
            upload.state = 'uploading';

            var formData = new window.FormData();
            formData.append('file', upload.file);
            if (upload.file.webkitRelativePath) {
              formData.append('relative_path', upload.file.webkitRelativePath);
            }
            return currentState.listing.upload(formData).then(
              function (resp) {
                upload.state = 'success';
                return {status: 'success', response: resp};
              },
              function (err) {
                upload.state = 'error';
                upload.error = err.data;
                return {status: 'error', response: err.data};
              }
            );
          });

          $q.all(tasks).then(function (results) {
            $scope.state.uploading = false;

            currentState.busy = true;
            currentState.listing.fetch().then(function () {
              currentState.busy = false;
              if(currentState.project){
                currentState.ui.tagFiles = true;
                $scope.state.ui.tagFiles = true;
              }
            });

            var errors = _.filter(results, function (result) {
              return result.status === 'error';
            });

            if (errors.length > 0) {
              // oh noes...give the user another chance with any errors
              $scope.state.retry = true;
            } else {
              // it's all good; close the modal
              if (!currentState.project){
                $uibModalInstance.close();
              }
            }
          });
        };

        $scope.retry = function() {
          $scope.data.uploads = _.where($scope.data.uploads, {state: 'error'});
          $scope.upload();
          $scope.state.retry = false;
        };

        /**
         * Remove an upload from the list of staged uploads.
         *
         * @param index
         */
        $scope.removeUpload = function (index) {
          $scope.data.uploads.splice(index, 1);
        };

        /**
         * Clear all staged uploads.
         */
        $scope.reset = function () {
          // reset models
          $scope.data.selectedFiles = [];
          $scope.data.uploads = [];
        };

        /**
         * Cancel and close upload dialog.
         */
        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
      },
      size: 'lg',
      resolve: {
        directoryUpload: function() { return directoryUpload; },
        destination: function() { return currentState.listing; },
        files: function() { return files; }
      }
    });
  }

  /**
   * Open Preview Tree
   */
  function openPreviewTree(entityUuid, type){
    var template = require('../html/modals/data-browser-preview-tree.html');
    if (type !== 'experimental'){
        template = require('../html/modals/data-browser-preview-simulation-tree.html');
    }
    var modal = $uibModal.open({
      template: template,
      controller:['$uibModalInstance', '$scope',
                  function($uibModalInstance, $scope){
        $scope.data = {};
        $scope.data.entityUuid = entityUuid;
        $scope.data.project = currentState.project;

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
                  }
      ],
      size: 'lg'
    });
  }

  /**
   * TODO
   *
   * @param {FileListing} file The file to view metadata for
   * @return {HttpPromise}
   */
  function viewMetadata (files, listing) {
    var template = require('../html/modals/data-browser-service-custom-tags.html');
    var file = null;
    if (typeof files !== 'undefined'){
      file = files[0];
    }
    if (typeof listing !== 'undefined' &&
        typeof listing.metadata !== 'undefined' &&
        typeof listing.metadata.project !== 'undefined' &&
        !_.isEmpty(listing.metadata.project) &&
        (typeof file.metadata == 'undefined' || 
          typeof file.metadata.project == 'undefined' ||
          _.isEmpty(file.metadata.project))){
      file.metadata = listing.metadata;
    }
    if (typeof file !== 'undefined' &&
        typeof file.metadata !== 'undefined' &&
        file.metadata.project !== 'undefined'){
      template = require('../html/modals/data-browser-service-published-metadata.html');
    }
    var modal = $uibModal.open({
      template: template,
      controller: ['$uibModalInstance', '$scope', 'file', 'ProjectEntitiesService',
                    function ($uibModalInstance, $scope, file, ProjectEntitiesService) {
        $scope.data = {file: file,
            form: {metadataTags: '',
                              tagsToDelete: []},
                        files: files,
                        error:'',
                        fileUuids: [],
                        project: currentState.project,
                        fileProjectTags: [],
                        newFileProjectTags: [],
                        projectTagsToUnrelate: [],
                        fileSubTags: {}};

        $scope.ui = {error: false};
        $scope.ui.analysisData = [
          {name: 'graph', label: 'Graph'},
          {name: 'visualization', label: 'Visualization'},
          {name: 'table', label: 'Table'},
          {name: 'other', label: 'Other'}
        ];
        $scope.ui.analysisApplication = [
          {name: 'matlab', label: 'Matlab'},
          {name: 'r', label: 'R'},
          {name: 'jupyter', label: 'Jupyter'},
          {name: 'other', label: 'Other'}
        ];
        $scope.ui.labels = {};
        $scope.ui.labels['designsafe.project.model_config'] = [
          {name: 'modelDrawing', label: 'Model Drawing'}
        ];
        $scope.ui.labels['designsafe.project.event'] = [
          {name: 'load', label: 'Load'}
        ];
        $scope.ui.labels['designsafe.project.sensor_list'] = [
          {name: 'sensorDrawing', label: 'Sensor Drawing'}
        ];
        $scope.ui.labels['designsafe.project.analysis'] = [
          {name: 'script', label: 'Script'}
        ];
        if (typeof listing !== 'undefined' &&
            typeof listing.metadata !== 'undefined' &&
            !_.isEmpty(listing.metadata.project)){
          var _listing = angular.copy(listing);
          $scope.data.file.metadata = _listing.metadata;
        }else if (files.length == 1){
          $scope.ui.busy = true;
          file.getMeta().then(function(file){
            $scope.ui.busy = false;
            $scope.data.fileUuids = [file.uuid()];
          }, function(err){
            $scope.ui.busy = false;
            $scope.ui.error = err;
          });
        } else if (files.length > 0){
          $scope.ui.busy = true;
          var tasks = _.map(files, function(f){
            if (f.uuid().length === 0){
              return f.getMeta();
            }
          });
        }
        var _setFileEntities = function(){
          var entities = currentState.project.getAllRelatedObjects();
          _.each($scope.data.files, function(child){
            child.setEntities(currentState.project.uuid, entities);
          });
        };
        var _setEntities = function(){
          _.each($scope.data.files, function(file){
            if ($scope.data.fileProjectTags.length === 0){
              $scope.data.fileProjectTags = file._entities;
            }
            var diff = _.difference($scope.data.fileProjectTags, file._entities);
            if (diff.length > 0){
              $scope.data.fileProjectTags = [];
            }
          });
        };

        $scope.isFileTagged = function(file, entity){
            var tags = entity.value.tags;
            var tag;
            var predicate = function(v){ return v === file.uuid();};
            for (var t in tags){
                for(var st in tags[t]){
                    if (_.findIndex(tags[t][st].file, predicate) > -1){
                        tag = st;
                        break;
                    }
                }
            }
            return tag;
        };

        $scope.getFileSubTag = function(file, entity){
          if (entity.name === 'designsafe.project.event'){
            return 'Load';
          }else if(entity.name === 'designsafe.project.model_config'){
            return 'Model Drawing';
          }else if(entity.anem === 'designsafe.project.sensor_list'){
            return 'Sensor Drawing';
          }else if(entity.name === 'designsafe.project.analysis'){
            return 'Script';
          }
          return '-';
        };

        $scope.saveFileTags = function(){
          var sttasks = [];
          for (var euuid in $scope.data.fileSubTags){
            var sts = $scope.data.fileSubTags[euuid] || [];
            var entity = currentState.project.getRelatedByUuid(euuid);
            for (var fuuid in sts){
              if (sts[fuuid] == 'none'){
                continue;
              }
              if (typeof entity[sts[fuuid]] === 'undefined' ||
                  !_.isArray(entity[sts[fuuid]])){
                entity.value[sts[fuuid]] = [];
              }
              entity.value[sts[fuuid]].push(fuuid);
              sttasks.push(ProjectEntitiesService.update(
                      {data: {uuid: entity.uuid, entity:entity}}));
              }
            }
          $scope.ui.busy = true;
          $q.all(sttasks).then(function(resps){
            $scope.data.fileSubTags = [];
            _setFileEntities();
            _setEntities();
            $scope.ui.parentEntities = currentState.project.getParentEntity($scope.data.files);
            $scope.ui.busy = false;
          });
          };

    $scope.doSaveMetadata = function($event) {
    $event.preventDefault();
    $uibModalInstance.close($scope.data);
    };

    $scope.isMarkedDeleted = function(tag){
    return $scope.data.form.tagsToDelete.indexOf(tag) > -1;
    };

            $scope.toggleTag = function(tag){
            var id = $scope.data.form.tagsToDelete.indexOf(tag);
            if (id > -1){
              $scope.data.form.tagsToDelete.splice(id, 1);
            } else {
              $scope.data.form.tagsToDelete.push(tag);
            }
            };

          /**
           * Cancel and close upload dialog.
           */
          $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
          };

          $scope.ui.addingTag = false;
          $scope.ui.tagTypes = [
              {label: 'Model Config',
               name: 'designsafe.project.model_config'},
              {label: 'Sensor Info',
               name: 'designsafe.project.sensor_list'},
              {label: 'Event',
               name: 'designsafe.project.event'},
              {label: 'Analysis',
               name: 'designsafe.project.analysis'}
              ];
          $scope.data.form.projectTagToAdd = {optional:{}};

          $scope.isProjectTagSel = function(entity){
            if (typeof entity === 'undefined'){
                return;
            }
            if (_.findWhere($scope.data.newFileProjectTags, {uuid: entity.uuid})){
              return true;
            } else if (_.findWhere($scope.data.projectTagsToUnrelate, {uuid: entity.uuid})){
              return false;
            } else if ( _.findWhere($scope.data.fileProjectTags, {uuid: entity.uuid})){
              return true;
            }
            return false;
          };

          $scope.toggleProjectTag = function(entity){
            if (_.findWhere($scope.data.newFileProjectTags, {uuid: entity.uuid})){
              $scope.data.newFileProjectTags = _.reject($scope.data.newFileProjectTags,
                                                        function(e){
                                                          if (e.uuid === entity.uuid){
                                                            return true;
                                                          } else {
                                                            return false;
                                                          }
                                                        });
            } else if (_.findWhere($scope.data.fileProjectTags, {uuid: entity.uuid})){
                if(_.findWhere($scope.data.projectTagsToUnrelate, {uuid: entity.uuid})){
                  $scope.data.projectTagsToUnrelate = _.reject(
                        $scope.data.projectTagsToUnrelate, function(e){
                          if(e.uuid === entity.uuid){ return true; }
                          else { return false; }
                        });
                } else {
                  $scope.data.projectTagsToUnrelate.push(entity);
                }
            } else {
              $scope.data.newFileProjectTags = [entity];
            }
          };

          $scope.saveRelations = function(){
            var tasks = [];
            _.each($scope.data.projectTagsToUnrelate, function(entity){
              entity.associationIds = _.difference(entity.associationIds, $scope.data.fileUuids);
              entity.value.files = _.difference(entity.value.files, $scope.data.fileUuids);
              tasks.push(ProjectEntitiesService.update({data: {
                                                            uuid: entity.uuid,
                                                            entity: entity}
                                                      }).then(function(e){
                                                      var ent = $scope.data.project.getRelatedByUuid(e.uuid);
                                                      ent.update(e);
                                                      return e;
                                                      }));

            });
           _.each($scope.data.newFileProjectTags, function(entity){
              entity.associationIds = entity.associationIds.concat($scope.data.fileUuids);
              entity.value.files = entity.value.files.concat($scope.data.fileUuids);
              tasks.push(ProjectEntitiesService.update({data:{
                                                          uuid: entity.uuid,
                                                          entity: entity}
                                                      }).then(function(e){
                                                      var ent = $scope.data.project.getRelatedByUuid(e.uuid);
                                                      ent.update(e);
                                                      return e;
                                                      }));
           });
           $scope.ui.busy = true;
           $q.all(tasks).then(
             function(e){
               $scope.data.newFileProjectTags = [];
               $scope.data.projectTagsToUnrelate = [];
               _setFileEntities();
               _setEntities();
               $scope.ui.parentEntities = currentState.project.getParentEntity($scope.data.files);
               $scope.ui.busy = false;
             }, function(er){
               $scope.ui.busy = false;
               $scope.ui.error = er;
             }
           );
          };

          $scope.addProjectTag = function(){
            var newTag = $scope.data.form.projectTagToAdd;
            var nameComps = newTag.tagType.split('.');
            var name = nameComps[nameComps.length-1];
            var entity = {};
            entity.name = newTag.tagType;
            if (name === 'event'){
              entity.eventType = newTag.tagAttribute;
            } else if (name === 'analysis'){
              entity.analysisType = newTag.tagAttribute;
            } else if (name === 'sensor_list'){
              entity.sensorListType = newTag.tagAttibute;
            } else if (name === 'model_config'){
              entity.coverage = newTag.tagAttribute;
            }
            for (var attr in $scope.data.form.projectTagToAdd.optional){
              entity[attr] = $scope.data.form.projectTagToAdd.optional[attr];
            }
            $scope.ui.addingTag = true;
            entity.title = newTag.tagTitle;
            entity.description = newTag.tagDescription || '';
            if (typeof $scope.data.files !== 'undefined'){
              entity.filePaths = _.map($scope.data.files,
                                     function(file){
                                      return file.path;
                                     });
            }
            $scope.ui.addingTag = true;
            ProjectEntitiesService.create({data: {
                uuid: currentState.project.uuid,
                name: newTag.tagType,
                entity: entity
            }})
            .then(
               function(resp){
                 $scope.data.form.projectTagToAdd = {optional:{}};
                 currentState.project.addEntity(resp);
                 _setFileEntities();
                 _setEntities();
                 $scope.ui.parentEntities = currentState.project.getParentEntity($scope.data.files);
                 $scope.ui.error = false;
                 $scope.ui.addingTag = false;
               },
               function(err){
                 $scope.ui.error = true;
                 $scope.error = err;
               }
           );
          };
        }],
        size: 'lg',
        resolve: {
          'file': function() { return file; },
          'form': function() { return {metadataTags: ''}; },
        }
      });

      return modal.result.then(function(data){
        var file = data.file;
        var form = data.form;
        var metaObj = {
          keywords: file.keywords || []
        };
        if (form.metadataTags) {
          metaObj.keywords = metaObj.keywords.concat(form.metadataTags.split(','));
        }
        if (form.tagsToDelete.length){
          metaObj.keywords = metaObj.keywords.filter(function(value){
            return form.tagsToDelete.indexOf(value) < 0;
          });
        }
        currentState.busy = true;
        file.updateMeta({'metadata': metaObj}).then(function(file_resp){
          //notify(FileEvents.FILE_META_UPDATED, FileEventsMsg.FILE_META_UPDATED, file_resp);
          currentState.busy = false;
        });
      });
    }


    var showCitation = function (ent, pub) {
      $uibModal.open({
        templateUrl: '/static/scripts/data-depot/templates/view-citations.html',
        controller: ['$sce', '$window', '$uibModalInstance', function ($sce, $window, $uibModalInstance) {

          var browser = currentState;
          var $ctrl = this;
          $ctrl.data = {};
          $ctrl.ui = {};
          $ctrl.ui.style = 'BibTeX';
          $ctrl.ui.styles = ['BibTeX', 'Endnote'];
          var authors = '';
          var ieeeAuthors = '';
          var citationDate = '';
                    
          if (pub.doi){
            try { citationDate = ent.created.split('T')[0]; }
            catch(err) {
              citationDate = '[publication date]';
            }
          } else {
            try { citationDate = ent[0].meta.dateOfPublication.split('T')[0]; }
            catch(err) {
              citationDate = '[publication date]';
            }
          }

          var neesCitation = function (prj) {
            $http.get('/api/projects/publication/' + prj[0].meta.projectId)
            .then(function (resp) {
              
              prj = resp.data.project;
              $ctrl.data.prj = prj;
              $ctrl.data.publication = resp.data;

              var publishers = _.filter($ctrl.data.publication.users, function (usr) {
                if (prj.name === 'designsafe.project' || prj.name === 'designsafe.project.analysis') {
                  return _.contains($ctrl.data.publication.project.value.coPis, usr.username) ||
                    usr.username === $ctrl.data.publication.project.value.pi;
                } else {
                  return _.contains(prj.value.authors, usr.username);
                }
              });
              if (typeof prj.value.projectType !== 'undefined' && prj.value.projectType === 'other') {
                publishers = $ctrl.data.publication.users;
              }
              publishers = _.sortBy(publishers, function (p) {
                if (typeof p._ui[prj.uuid] !== 'undefined') {
                  return p._ui[prj.uuid];
                } else {
                  return p._ui.order;
                }
              });
              _.each(publishers, function (usr, index, list) {
                var str = usr.last_name + ', ' + usr.first_name;
                if (index < list.length - 1) {
                  authors += str + ' and ';
                  ieeeAuthors += str + '; ';
                } else {
                  authors += str;
                  ieeeAuthors += str;
                }
              });
              $ctrl.getCitation = function () {
                if ($ctrl.ui.style === 'BibTeX') {
                  $ctrl.data.citation =
                    '@misc{dataset, \n' +
                    ' author = {' + authors + '} \n' +
                    ' title = {' + prj.value.title + '} \n' +
                    ' publisher = {DesignSafe-CI} \n' +
                    ' year = {' + citationDate + '} \n' +
                    ' note = {' + prj.value.description + '} \n' +
                    '}';
                } else if ($ctrl.ui.style === 'Endnote') {
                  $ctrl.data.citation =
                    '%0 Generic \n' +
                    '%A ' + authors + '\n' +
                    '%T ' + prj.value.title + '\n' +
                    '%I DesignSafe-CI\n' +
                    '%D ' + citationDate + '\n';
                }
              };
              $ctrl.close = function () {
                $uibModalInstance.dismiss('Close');
              };
              $ctrl.downloadCitation = function () {
                var doicit = "https://data.datacite.org/application/vnd.datacite.datacite+xml/" + $ctrl.doicit;
                $window.open(doicit);
              };
              
              // display everything...
              $ctrl.ui.ieeeCitation = $sce.trustAsHtml(ieeeAuthors + ', (' + citationDate + '), "' + prj.value.title + '" , DesignSafe-CI [publisher], Dataset, ' + prj.doi);
              $ctrl.doiurl = "https://doi.org/" + $ctrl.data.prj.doi.slice(4);
              $ctrl.doicit = $ctrl.data.prj.doi.slice(4);
            });
          };



          if (browser.listing.system === 'nees.public') {
            neesCitation(ent);
          } else {
            $ctrl.data.ent = ent;

            if (browser.listing.project) {
              $ctrl.data.publication = browser.listing;
            } else {
              $ctrl.data.publication = browser.publication;
            }
            var publishers = _.filter($ctrl.data.publication.users, function (usr) {
              if (pub.name === 'designsafe.project' || pub.name === 'designsafe.project.analysis' || pub[0]) {
                return _.contains($ctrl.data.publication.project.value.coPis, usr.username) ||
                  usr.username === $ctrl.data.publication.project.value.pi;
              } else {
                return _.contains(pub.value.authors, usr.username);
              }
            });
            if (typeof pub.value.projectType !== 'undefined' && pub.value.projectType === 'other') {
              publishers = $ctrl.data.publication.users;
            }
            publishers = _.sortBy(publishers, function (p) {
              if (typeof p._ui[ent.uuid] !== 'undefined') {
                return p._ui[ent.uuid];
              } else {
                return p._ui.order;
              }
            });
            _.each(publishers, function (usr, index, list) {
              var str = usr.last_name + ', ' + usr.first_name;
              if (index < list.length - 1) {
                authors += str + ' and ';
                ieeeAuthors += str + '; ';
              } else {
                authors += str;
                ieeeAuthors += str;
              }
            });

            $ctrl.getCitation = function () {
              if ($ctrl.ui.style === 'BibTeX') {
                $ctrl.data.citation =
                  '@misc{dataset, \n' +
                  ' author = {' + authors + '} \n' +
                  ' title = {' + pub.value.title + '} \n' +
                  ' publisher = {DesignSafe-CI} \n' +
                  ' year = {' + citationDate + '} \n' +
                  ' note = {' + pub.value.description + '} \n' +
                  '}';
              } else if ($ctrl.ui.style === 'Endnote') {
                $ctrl.data.citation =
                  '%0 Generic \n' +
                  '%A ' + authors + '\n' +
                  '%T ' + pub.value.title + '\n' +
                  '%I DesignSafe-CI\n' +
                  '%D ' + citationDate + '\n';
              }
            };
            $ctrl.close = function () {
              $uibModalInstance.dismiss('Close');
            };
            $ctrl.downloadCitation = function () {
              var doicit = "https://data.datacite.org/application/vnd.datacite.datacite+xml/" + $ctrl.doicit;
              $window.open(doicit);
            };

            // display everything...
            $ctrl.ui.ieeeCitation = $sce.trustAsHtml(ieeeAuthors + ', (' + citationDate + '), "' + pub.value.title + '" , DesignSafe-CI [publisher], Dataset, ' + pub.doi);
            $ctrl.doiurl = "https://doi.org/" + pub.doi.slice(4);
            $ctrl.doicit = pub.doi.slice(4);
          }


        }],
        size: 'md',
        controllerAs: '$ctrl',
        resolve: {
          browser: currentState
        },
      });
    };


    /**
     * @callback subscribeCallback
     * @param {object} $event
     * @param {object} eventData
     * @param {FileEvents} eventData.type
     * @param {object} eventData.context
     */
    /**
     *
     * @param {object} scope
     * @param {subscribeCallback} callback
     */
    function subscribe(scope, callback) {
      var handler = $rootScope.$on('DataBrowserService::Event', callback);
      scope.$on('$destroy', handler);
    }

  /**
   *
   * @param {FileEvents} eventType The event
   * @param {object} eventContext The object/context of the event. The value of this parameter depends on the `eventType`
   */
  function notify(eventType, eventMsg, eventContext) {
    $rootScope.$emit('DataBrowserService::Event', {
      type: eventType,
      context: eventContext,
      msg: eventMsg
    });
  }

  function scrollToTop(){
    return;
  }

  function scrollToBottom(params){
    if (currentState.loadingMore || currentState.reachedEnd){
      return;
    }
    currentState.loadingMore = true;
    if (currentState.listing && currentState.listing.children &&
        currentState.listing.children.length < 95){
      currentState.reachedEnd = true;
      return;
    }
    currentState.page += 1;
    currentState.loadingMore = true;
    return browsePage({system: currentState.listing.system,
                path: currentState.listing.path,
                page: currentState.page,
                queryString: (params || {}).queryString,
                typeFilters: (params || {}).typeFilters
                })
    .then(function(listing){
        currentState.loadingMore = false;
        if (listing.children.length < 95) {
          currentState.reachedEnd = true;
        }
      }, function (err){
            currentState.loadingMore = false;
            currentState.reachedEnd = true;
      });
  }


/**
 *
 * @param {Array} projects Array of project objects that will be set as selected
 */

function selectProjects(projects, reset) {
  deselect(currentState.selected);
  if (!Array.isArray(projects)) {
    projects = [projects];
  }
  if (reset) {
    deselectProjects(currentState.selectedProjects || [], false);
  }
  _.each(projects, function(project) {
    project.selected = true;
  });
  currentState.selectedProjects = _.union(currentState.selectedProjects || [], projects);
}

/**
 *
 * @param {Array} projects Array of project objects that will be removed from selected list
 */
function deselectProjects(projects, reset) {
  if (!Array.isArray(projects)) {
    projects = [projects];
  }
  if (reset) {
    deselectProjects(currentState.selectedProjects || [], false);
  }
  _.each(projects, function(project) {
    project.selected = false;
  });
  currentState.selectedProjects = _.difference(currentState.selectedProjects || [], projects);
}

/**
 *
 * @param {Array} projects Array of project objects that will have their selected status toggled
 */
function toggleProjects(projects, reset) {
  if (!Array.isArray(projects)) {
    projects = [projects];
  }
  _.each(projects, function(project) {
    if (project.selected) {
      deselectProjects(project, reset);
    }
    else {
      selectProjects(project, reset);
    }
  });
}

  return {
    /* properties */
    FileEvents: FileEvents,
    state: state,
    apiParameters: apiParameters,
    currentState: currentState,
    projectBreadcrumbSubject: projectBreadcrumbSubject,

    /* data/files functions */
    allowedActions: allowedActions,
    browse: browse,
    browsePage: browsePage,
    scrollToTop: scrollToTop,
    scrollToBottom: scrollToBottom,
    copy: copy,
    deselect: deselect,
    // details: details,
    download: download,
    getFileManagers: getFileManagers,
    hasPermission: hasPermission,
    isProtected: isProtected,
    mkdir: mkdir,
    move: move,
    preview: preview,
    previewImages: previewImages,
    rename: rename,
    rm: rm,
    search: search,
    select: select,
    share: share,
    trash: trash,
    upload: upload,
    viewMetadata: viewMetadata,
    showCitation: showCitation,

    /* events */
    apiParams: apiParams,
    showListing: showListing,
    showPreview: showPreview,
    openPreviewTree: openPreviewTree,

    /* projects */
    selectProjects: selectProjects,
    deselectProjects: deselectProjects,
    toggleProjects: toggleProjects,
  };

};

