(function(window, angular) {
  var app = angular.module('designsafe');
  app.requires.push('django.context');

  app.controller('ProjectRootCtrl', ['$scope', '$state', 'DataBrowserService', function ($scope, $state, DataBrowserService) {

    DataBrowserService.apiParams.fileMgr = 'agave';
    DataBrowserService.apiParams.baseUrl = '/api/agave/files';
    DataBrowserService.apiParams.searchState = undefined;

    // release selected files
    DataBrowserService.deselect(DataBrowserService.state().selected);

    $scope.data = {
      navItems: [],
      projects: []
    };

    $scope.$on('$stateChangeSuccess', function($event, toState, toStateParams) {
      $scope.data.navItems = [{href: $state.href('projects.list'), label: 'Projects'}];

      // Create a function that checks if 'toStateParams.projectTitle' is empty. Replace it if so...
      // this function will compare the project uuid to the state's projectID
      // it will then return the 'title' of the matching project in place of the state's missing 'projectTitle'
      function getTitle(tsp, proj) {
        if (tsp.projectTitle === "") {
          if (proj.length > 0) {
            index = proj.findIndex(x => x.uuid==tsp.projectId);
            return proj[index].value.title;
          }
        } else {
          return tsp.projectTitle;
        }
      }


      if (toStateParams.filePath) {
        if (toStateParams.filePath === '/') {
          $scope.data.navItems.push({
            label: getTitle(toStateParams, $scope.data.projects),
            href: $state.href('projects.view.data', {
              projectId: toStateParams.projectId,
              filePath: '/',
              projectTitle: getTitle(toStateParams, $scope.data.projects)
            })
          });
        } else {
          _.each(toStateParams.filePath.split('/'), function (e, i, l) {
            var filePath = l.slice(0, i + 1).join('/');
            if (filePath === '') {
              filePath = '/';
            }
            $scope.data.navItems.push({
              label: e || getTitle(toStateParams, $scope.data.projects),
              href: $state.href('projects.view.data', {
                projectId: toStateParams.projectId,
                filePath: filePath,
                projectTitle: getTitle(toStateParams, $scope.data.projects)
              })
            });
          });
        }
      } else {
        // when the user is in the base project file's directory 
        // display the project title in the breadcrumbs
        $scope.data.navItems.push({
          label: getTitle(toStateParams, $scope.data.projects),
          href: $state.href('projects.view.data', {
            projectId: toStateParams.projectId,
            filePath: '/',
            projectTitle: getTitle(toStateParams, $scope.data.projects)
          })
        });
      }
    });
    //$state.go('projects.list');
  }]);

  app.controller('ProjectListingCtrl', ['$scope', '$state', 'DataBrowserService', 'Django', 'ProjectService', function ($scope, $state, DataBrowserService, Django, ProjectService) {
    $scope.ui = {};
    $scope.ui.busy = true;
    $scope.data.projects = [];


    // release selected files on load
    DataBrowserService.deselect(DataBrowserService.state().selected);


    ProjectService.list().then(function(projects) {
      $scope.ui.busy = false;
      $scope.data.projects = _.map(projects, function(p) { p.href = $state.href('projects.view', {projectId: p.uuid}); return p; });
    });

    $scope.onBrowse = function onBrowse($event, project) {
      $event.preventDefault();
      $state.go('projects.view.data', {projectId: project.uuid,
                                       filePath: '/',
                                       projectTitle: project.value.title});
    };

    // function for when the row is selected, but the link to the project detail page is not
    $scope.onSelect = function($event, project) {
      var selectedProjects = DataBrowserService.state().selectedProjects;
      // holding ctrl key should toggle selected project but leave other projects unchanged
      if ($event.ctrlKey || $event.metaKey) {
        DataBrowserService.toggleProjects(project);
      }
      // shift key should select all projects between the last clicked project and the current clicked project
      else if ($event.shiftKey && selectedProjects.length > 0) {
        // get
        var lastProject = selectedProjects[selectedProjects.length - 1];
        var lastIndex = $scope.data.projects.indexOf(lastProject);
        var projectIndex = $scope.data.projects.indexOf(project);
        var min = Math.min(lastIndex, projectIndex);
        var max = Math.max(lastIndex, projectIndex);
        DataBrowserService.selectProjects($scope.data.projects.slice(min, max + 1));
      }
      // else no special scenario. we toggle the clicked project and unselect all others.
      else {
        DataBrowserService.toggleProjects(project, true);
      }
    };

  }]);

  app.controller('ProjectViewCtrl', ['$scope', '$state', 'Django', 'ProjectService', 'ProjectEntitiesService', 'DataBrowserService', 'projectId', 'FileListing', '$uibModal', '$q', '$http', '$interval', function ($scope, $state, Django, ProjectService, ProjectEntitiesService, DataBrowserService, projectId, FileListing, $uibModal, $q, $http, $interval) {

    $scope.data = {};
    $scope.state = DataBrowserService.state();
    $scope.ui = {};

    function setEntitiesRel(resp){
      $scope.data.project.setEntitiesRel(resp);
      return resp;
    }

    ProjectService.get({uuid: projectId}).then(function (project) {
      $scope.data.project = project;
      DataBrowserService.state().project = project;
      DataBrowserService.state().loadingEntities = true;
      $scope.data.loadingEntities = true;
      var _related = project._related;
      var tasks = [];
      for (var attrname in _related){
        var name = _related[attrname];
        if (name != 'designsafe.file'){
          tasks.push(ProjectEntitiesService.listEntities(
            {uuid: projectId, name: name})
            .then(setEntitiesRel)
            );
        }
      }
      $q.all(tasks).then(
        function(resp){
          //$scope.data.project.setupAllRels();
          return resp;
        }).then(
        function(resp){
            DataBrowserService.state().loadingEntities = false;
            $scope.data.loadingEntities = false;
        }, function(err){
            DataBrowserService.state().loadingEntities = false;
            $scope.data.loadingEntities = false;
        }).then(function(){
            ProjectService.getCollaborators({uuid:DataBrowserService.state().project.uuid}).then(function(resp){
                DataBrowserService.state().project.value.teamMembers = _.without(resp.data.teamMembers, 'ds_admin');
            });
        }
        );
    })
    .then(function(){
      $http.get('/api/projects/publication/' + $scope.data.project.value.projectId)
        .then(function(resp){
            $scope.data.publication = resp.data;
            $scope.data.publication.experimentsList = $scope.data.publication.experimentsList || [];
            $scope.data.publication.eventsList = $scope.data.publication.eventsList || [];
            $scope.data.publication.analysisList = $scope.data.publication.analysisList || []; 
            $scope.data.publication.reportsList = $scope.data.publication.reportsList || [];
        });
    });


    $scope.showText = function(text){
        $uibModal.open({
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
            controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
                $scope.text = text;
                $scope.close = function(){
                    $uibModalInstance.dismiss('Close');
                };
            }]
        });
    };

    $scope.editProject = function($event) {
      if ($event){
        $event.preventDefault();
      }
      ProjectService.editProject($scope.data.project)
        .then(function (project) {
          $scope.data.project = project;
        });
    };

    $scope.manageCollabs = function($event) {
      if ($event){
        $event.preventDefault();
      }
      ProjectService.manageCollaborators($scope.data.project).then(function (res) {

        // $scope.data.project.pi = res.data.pi;
        // $scope.data.project.coPis = res.data.coPis;
        // $scope.data.project.teamMembers = res.data.teamMembers;
      });
    };

    $scope.manageExperiments = function($event) {
      if ($event){
        $event.preventDefault();
      }
      var experimentsAttr = $scope.data.project.getRelatedAttrName('designsafe.project.experiment');
      var experiments = $scope.data.project[experimentsAttr];
      if (typeof experiments === 'undefined'){
        $scope.data.project[experimentsAttr] = [];
        experiments = $scope.data.project[experimentsAttr];
      }
      ProjectService.manageExperiments({'experiments': experiments,
                                        'project': $scope.data.project}).then(function (experiments) {
        $scope.data.experiments = experiments;
      });
    };

    $scope.manageSimulations = function($event) {
      if ($event){
        $event.preventDefault();
      }
      var simulationAttr = $scope.data.project.getRelatedAttrName('designsafe.project.simulation');
      var simulations = $scope.data.project[simulationAttr];
      if (typeof simulations === 'undefined'){
        $scope.data.project[simulationAttr] = [];
        simulations = $scope.data.project[simulationAttr];
      }
      ProjectService.manageSimulations({'simulations': simulations,
                                        'project': $scope.data.project}).then(function (simulations) {
        $scope.data.simulations = simulations;
      });
    };

    $scope.dateString = function(s){
      var d = Date(s);
      return d;
    };

    $scope.showListing = function(){
      //DataBrowserService.state().showMainListing = true;
      //DataBrowserService.state().showPreviewListing = false;
      DataBrowserService.showListing();
    };

    $scope.showPreview = function(){
      //DataBrowserService.state().showMainListing = false;
      //DataBrowserService.state().showPreviewListing = true;
      $scope.previewHref = undefined;
      DataBrowserService.showPreview();
      FileListing.get({'system': $scope.browser.listing.system,
                       'name': 'projectimage.jpg',
                       'path': '/projectimage.jpg'}).then(function(list){
                        list.preview().then(function(data){
                            $scope.previewHref = data.postit;
                        });
                      });
    };

    function savePublication(){
      var publication = angular.copy($scope.state.publication);
      publication.filesSelected = $scope.state.publication.filesSelected;
      publication.project = $scope.state.project;
      $scope.ui.savingPublication = true;
      $http.post('/api/projects/publication/' +  projectId,
        {publication: publication, status: 'saved'})
        .then(function(resp){
          $scope.ui.savingPublication = false;
        });
    }

    $scope.publishPipeline_start = function(){
      $scope.state.publishPipeline = 'select';
    };

    $scope.publishPipeline_review = function(){
      $scope.state.publishPipeline = 'review';
      if (typeof $scope.saveInterval === 'undefined'){
        $scope.saveInterval = $interval(savePublication, 1000);
      }
    };

    $scope.publishPipeline_meta = function(){
      $scope.state.publishPipeline = 'meta';
    };

    $scope.publishPipeline_exit = function(){
      $scope.state.publishPipeline = undefined;
      $scope.ui.publicationMessages = [];
    };

    $scope.publishPipeline_prev = function(st){
      if (st == 'agreement'){
        $scope.state.publishPipeline = 'meta';
      } else if (st == 'meta'){
        $scope.state.publishPipeline = 'review';
      }
      else if (st == 'review'){
        $scope.state.publishPipeline = 'select';
      }
      else {
        $scope.state.publishPipeline = 'select';
      }
    };

    $scope.publishPipeline_next = function(st){
      if (st == 'select'){
        $scope.state.publishPipeline = 'review';
      }
      else if (st == 'review'){
        var institutions = [];
        _.each($scope.state.publication.experimentsList, function(exp){
            var o = {
                label: exp.getEF($scope.state.project.value.projectType,
                exp.value.experimentalFacility).institution,
                name: exp.value.experimentalFacility,
                };
            institutions.push(o);
        });
        _.each($scope.state.publication.users, function(user){
            institutions.push({ label: user.profile.institution,
                                name: user.username});
        });
        institutions = _.uniq(institutions, function(inst){ return inst.label;});
        _.each(institutions, function(inst, indx){
          inst._ui = {order: indx, deleted: false};
        });
        $scope.state.publication.institutions = _.uniq(institutions, function(inst){ return inst.label;});
        if (typeof $scope.saveInterval === 'undefined'){
          $scope.saveInterval = $interval($scope.publishPipeline_publish('saved'), 1000);
        }
        $scope.state.publishPipeline = 'meta';
      }
      else if (st == 'meta'){
        $scope.state.publishPipeline = 'agreement';
      }else {
        $scope.state.publishPipeline = 'agreement';
      }
    };

    $scope.publishPipeline_publish = function(status){
      if (typeof status !== 'undefined' && status != 'saved'){
          $interval.cancel($scope.saveInterval);
      } else if (typeof status === 'undefined'){
        status = 'published';
      }
      var publication = angular.copy($scope.state.publication);
      publication.filesSelected = $scope.state.publication.filesSelected;
      var experimentsList = [];
      var eventsList = [];
      var analysisList = [];
      var reportsList = [];
      var modelConfigs = [];
      var sensorLists = [];
      var publicationMessages = [];
      
      if ($scope.state.project.value.projectType == 'experimental'){
        if (publication.experimentsList){
          experimentsList = _.map(publication.experimentsList, function(exp){
            exp.value.equipmentType = exp.getET(exp.value.experimentalFacility,
                                                exp.value.equipmentType).label;
            exp.value.experimentalFacility = exp.getEF($scope.state.project
                  .value.projectType,
                  exp.value.experimentalFacility).label;
            exp.events = $scope.state.publication;
            delete exp._ui;
            delete exp.events;
            if (!exp.value.authors.length){
              publicationMessages.push({title: 'Experiment ' + exp.value.title,
                                        message: 'Missing authors'}); 
            }
            return exp;
          });
          delete publication.experimentsList;

        }
        if (publication.eventsList){
          var _eventsList = angular.copy(publication.eventsList);
          delete publication.eventsList;
          var expsUuids = _.map(experimentsList, function(exp){
                                return exp.uuid; });
          eventsList = _.filter(_eventsList,
                     function(evt){
                       return _.intersection(evt.associationIds, expsUuids);
                     });
          var mcfsUuids = [];
          var slsUuids = [];
          _.each(eventsList, function(evt){
              mcfsUuids = mcfsUuids.concat(evt.value.modelConfigs);
              slsUuids = slsUuids.concat(evt.value.sensorLists);
              delete evt.tagsAsOptions;
              evt.fileObjs = _.map($scope.state.listings[evt.uuid], function(f){
                    return {
                        'path': f.path,
                        'type': f.type,
                        'length': f.length,
                        'name': f.name
                    };
              });
              if (!evt.fileObjs.length){
                  publicationMessages.push({title: 'Event ' + evt.value.title,
                                            message: 'Missing files'});
              }
          });
          _.each(mcfsUuids, function(mcf){
            var _mcf = angular.copy($scope.state.project.getRelatedByUuid(mcf));
            delete _mcf.tagsAsOptions;
            _mcf.fileObjs = _.map($scope.state.listings[_mcf.uuid], function(f){
                return {
                    'path': f.path,
                    'type': f.type,
                    'length': f.length,
                    'name': f.name
                };
            });
            if (!_mcf.fileObjs.length){
                publicationMessages.push({title: 'Model Config '+ _mcf.value.title,
                                          message: 'Missing files.'});
            }
            modelConfigs.push(_mcf);
          });
          _.each(slsUuids, function(slt){
            var _slt = angular.copy($scope.state.project.getRelatedByUuid(slt));
            delete _slt.tagsAsOptions;
            _slt.fileObjs = _.map($scope.state.listings[_slt.uuid], function(f){
              return {
                  'path': f.path,
                  'type': f.type,
                  'length': f.length,
                  'name': f.name
              };
            });
            if (!_slt.fileObjs.length){
                publicationMessages.push({title: 'Sensor Info ' + _slt.value.title,
                                          message: 'Missing files.'});
            }
            sensorLists.push(_slt);
          });
        }
        if (publication.analysisList){
          analysisList = _.map(publication.analysisList, function(ana){
            delete ana.tagsAsOptions;
            ana.fileObjs = _.map($scope.state.listings[ana.uuid], function(f){
                return {
                    'path': f.path,
                    'type': f.type,
                    'length': f.length,
                    'name': f.name
                };
            });
            if (!ana.fileObjs.length){
                publicationMessages.push({title: 'Analysis ' + ana.value.title,
                                          message: 'Missing Files'});
            }
            return ana;
          });
          delete publication.analysisList;
        }
        if (publication.reportsList) {
          reportsList = _.map(publication.reportsList, function(rep){
              rep.fileObjs = _.map($scope.state.listings[rep.uuid], function(f){
                  return {
                      'path': f.path,
                      'type': f.type,
                      'length': f.length,
                      'name': f.name
                  };
              });
              return rep;
          });
          delete publication.reportsList;
        }
      }

      var project = angular.copy($scope.state.project);
      delete project._allRelatedObjects;
      _.each(project._related, function(val, key){
        delete project[key];
      });
      if (status == 'published'){
        delete publication.filesSelected;
      } else {
        publication.filesSelected = $scope.state.publication.filesSelected;
      }

      publication.project = project;
      if ($scope.state.project.value.projectType == 'experimental'){
        publication.eventsList = _.uniq(eventsList, function(e){return e.uuid;});
        publication.modelConfigs = _.uniq(modelConfigs, function(e){return e.uuid;});
        publication.sensorLists = _.uniq(sensorLists, function(e){return e.uuid;});
        publication.analysisList = _.uniq(analysisList, function(e){return e.uuid;});
        publication.reportsList = _.uniq(reportsList, function(e){return e.uuid;});
        publication.experimentsList = _.uniq(experimentsList, function(e){return e.uuid;});
        if (publicationMessages.length){
            $scope.ui.publicationMessages = publicationMessages;
            return;
        }
      }

      if (typeof status === 'undefined' || status === null){
        status = 'publishing';
      }

      $http.post('/api/projects/publication/', {publication: publication,
                                                status: status})
        .then(function(resp){
          if (resp.data.response.status == 'published'){
              $scope.state.publicationMsg = resp.data.message;
              DataBrowserService.state().publicationMsg = resp.data.message;
          }
          $scope.state.project.publicationStatus = resp.data.response.status;
          DataBrowserService.state().project.publicationStatus = resp.data.response.status;
        });
    };

  }]);

  app.controller('ProjectDataCtrl', ['$scope', '$state', 'Django', 'ProjectService', 'DataBrowserService', 'projectId', 'filePath', 'projectTitle', 'FileListing', 'UserService', '$uibModal', '$http', '$q', function ($scope, $state, Django, ProjectService, DataBrowserService, projectId, filePath, projectTitle, FileListing, UserService, $uibModal, $http, $q) {
    DataBrowserService.apiParams.fileMgr = 'agave';
    DataBrowserService.apiParams.baseUrl = '/api/agave/files';
    DataBrowserService.apiParams.searchState = undefined;
    $scope.browser = DataBrowserService.state();
    $scope.browser.listings = {};
    $scope.browser.ui = {};
    $scope.browser.publication = {experimentsList: [], eventsList: [],
                                  users: [], analysisList: [], reportsList: [],
                                  filesSelected: {}};
    if (typeof $scope.browser !== 'undefined'){
      $scope.browser.busy = true;
    }

    DataBrowserService.browse({system: 'project-' + projectId, path: filePath})
      .then(function () {
        $scope.browser = DataBrowserService.state();
        $scope.browser.busy = true;
        $scope.browser.busyListing = true;
        $scope.browser.listing.href = $state.href('projects.view.data', {
          projectId: projectId,
          filePath: $scope.browser.listing.path,
          projectTitle: projectTitle
        });
        _.each($scope.browser.listing.children, function (child) {
          child.href = $state.href('projects.view.data', {
            projectId: projectId,
            filePath: child.path,
            projectTitle: projectTitle
          });
        });
        if (typeof $scope.browser.loadingEntities !== 'undefined' &&
            !$scope.browser.loadingEntities){
          var entities = $scope.browser.project.getAllRelatedObjects();
          _.each($scope.browser.listing.children, function(child){
            child.setEntities(DataBrowserService.state().project.uuid, entities);
          });
        } else {
          $scope.$watch('browser.loadingEntities', function(newVal, oldVal){
            if (!newVal){
              var entities = $scope.browser.project.getAllRelatedObjects();
              _.each($scope.browser.listing.children, function(child){
                child.setEntities($scope.browser.project.uuid, entities);
              });
              //var _state = DataBrowserService.state();
              //_state.project.setupAllRels();
              //$scope.browser = _state;
            }
          });
        }
      }).then(function(){
        $http.get('/api/projects/publication/' + $scope.browser.project.value.projectId)
          .then(function(resp){
              if (resp.data.project && resp.data.project.doi){
                  $scope.browser.project.doi = resp.data.project.doi;
                  DataBrowserService.state().project.doi = resp.data.project.doi;
              } 
              if (resp.data.project && resp.data.status){
                $scope.browser.project.publicationStatus = resp.data.status;
                DataBrowserService.state().project.publicationStatus = resp.data.status;
              }
              $scope.browser.busy = false;
              $scope.browser.busyListing = false;
          }, function(){
              $scope.browser.busy = false;
              $scope.browser.busyListing = false;
          });
      });

    var setFilesDetails = function(filePaths){
      filePaths = _.uniq(filePaths);
      var p = $q(function(resolve, reject){
        var results = [];
        var index = 0;
        var size = 5;
        var fileCalls = _.map(filePaths, function(filePath){
          return FileListing.get({system: 'project-' + projectId,
                                  path: filePath},
                                  DataBrowserService.apiParams)
            .then(function(resp){
              var allEntities = $scope.browser.project.getAllRelatedObjects();
              var entities = _.filter(allEntities, function(entity){
                return _.contains(entity._filePaths, resp.path);
              });
              _.each(entities, function(entity){
                $scope.browser.listings[entity.uuid].push(resp);
              });
              return resp;
            });
        });

        function step(){
          var calls = fileCalls.slice(index, index += size);
          if(calls.length){
            $q.all(calls).then(function(res){
              results.concat(res);
              step();
              return res;
            }).catch(reject);
          } else {
            resolve(results);
          }
        }
        step();
      });
      return p.then(function(results){
          return results;
      }, function(err){
        $scope.browser.ui.error = err;
      });
    };

    var setUserDetails = function(usernames){
      $scope.browser.publication.users = [];
      filePaths = _.uniq(usernames);
      var p = $q(function(resolve, reject){
        var results = [];
        var index = 0;
        var size = 5;
        var userIndex = 0;
        var calls = _.map(usernames, function(username){
          return UserService.get(username)
            .then(function(resp){
                resp._ui = {order:userIndex, deleted: false};
                $scope.browser.publication.users.push(resp);
                userIndex += 1;
            });
        });

        function step(){
          var _calls = calls.slice(index, index += size);
          if(_calls.length){
            $q.all(_calls).then(function(res){
              results.concat(res);
              step();
              return res;
            }).catch(reject);
          } else {
            resolve(results);
          }
        }
        step();
      });
      $scope.browser.ui.loadingPreview = true;
      return p.then(function(results){
        $scope.browser.publication.users = _.uniq($scope.browser.publication.users, function(obj){return obj.username;});
        return results;
      }, function(err){
        $scope.browser.ui.error = err;
      });
    };

    $scope.$watch('browser.showPreviewListing', function(newVal, oldVal){
      if (newVal){
        $scope.browser.ui.loadingListings = true;
        $scope.browser.listings = {};
        var entities = $scope.browser.project.getAllRelatedObjects();
        var allFilePaths = [];
        _.each(entities, function(entity){
          $scope.browser.listings[entity.uuid] = [];
          allFilePaths = allFilePaths.concat(entity._filePaths);
        });
        $scope.data.rootPaths = allFilePaths;
        $http.get('/api/projects/publication/' + $scope.browser.project.value.projectId)
          .then(function(resp){
              $scope.browser.publication = resp.data;
              $scope.browser.publication.experimentsList = $scope.browser.publication.experimentsList || [];
              $scope.browser.publication.eventsList = $scope.browser.publication.eventsList || [];
              $scope.browser.publication.analysisList = $scope.browser.publication.analysisList || []; 
              $scope.browser.publication.reportsList = $scope.browser.publication.reportsList || [];
          }, function(err){
            //no publication saved?
          })
        .then(function(){setFilesDetails(allFilePaths);})
        .then(function(){
            users = [$scope.browser.project.value.pi]
                      .concat($scope.browser.project.value.coPis)
                      .concat($scope.browser.project.value.teamMembers);
            return setUserDetails(users);
        }).then(function(){
        });
      }
    });

    $scope.onBrowseData = function onBrowseData($event, file) {
      $event.preventDefault();
      DataBrowserService.showListing();
      if (file.type === 'file') {
        DataBrowserService.preview(file, $scope.browser.listing);
      } else {
        $state.go('projects.view.data', {projectId: projectId,
                                         filePath: file.path,
                                         projectTitle: projectTitle});
      }
    };

    $scope.scrollToTop = function(){
      return;
    };
    $scope.scrollToBottom = function(){
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
      } else if( typeof file._ui !== 'undefined' &&
                 file._ui.selected){
        DataBrowserService.deselect([file]);
      }
        else {
        DataBrowserService.select([file], true);
      }
    };

    $scope.onDetail = function($event, file) {
      $event.stopPropagation();
      DataBrowserService.preview(file, $scope.browser.listing);
    };

    $scope.openPreviewTree = function($event, entityUuid){
      $event.preventDefault();
      $event.stopPropagation();
      DataBrowserService.openPreviewTree(entityUuid);
    };

    function _addToLists(ent, evt){
      if (ent.name === 'designsafe.project.experiment'){
        $scope.browser.publication.experimentsList.push(ent);
        $scope.browser.publication.experimentsList = _.uniq($scope.browser.publication.experimentsList, function(e){return e.uuid;});
        $scope.browser.publication.eventsList.push(evt);
        $scope.browser.publication.eventsList = _.uniq($scope.browser.publication.eventsList, function(e){return e.uuid;});
      } else if (ent.name === 'designsafe.project.analysis'){
        $scope.browser.publication.analysisList.push(ent);
        $scope.browser.publication.analysisList = _.uniq($scope.browser.publication.analysisList, function(e){return e.uuid;});
      } else if (ent.name === 'designsafe.project.report'){
        $scope.browser.publication.reportsList.push(ent);
        $scope.browser.publication.reportsList = _.uniq($scope.browser.publication.reportsList, function(e){return e.uuid;});
      }
    }

    function _removeFromLists(ent, evt){
      if (ent && ent.name == 'designsafe.project.experiment'){
          $scope.browser.publication.experimentsList = _.filter($scope.browser.publication.experimentsList, function(e){ return e.uuid !== ent.uuid;});
      }else if (ent && ent.name == 'designsafe.project.analysis'){
          $scope.browser.publication.analysisList = _.filter($scope.browser.publication.analysisList, function(e){ return e.uuid !== ent.uuid;});
      }else if (ent && ent.name == 'designsafe.project.report'){
          $scope.browser.publication.reportsList = _.filter($scope.browser.publication.reportsList, function(e){ return e.uuid !== ent.uuid;});
      }

      if (evt){
          $scope.browser.publication.eventsList = _.filter($scope.browser.publication.eventsList, function(e){ return evt.uuid !== e.uuid;});
      }
    }

    $scope.editProject = function() {
      ProjectService.editProject($scope.browser.project)
        .then(function (project) {
          $scope.browser.project = project;
        });
    };

    $scope.manageCollabs = function() {
      ProjectService.manageCollaborators($scope.browser.project).then(function (project) {
        $scope.browserproject = project;
      });
    };

    $scope.manageExperiments = function() {
      var experimentsAttr = $scope.browser.project.getRelatedAttrName('designsafe.project.experiment');
      var experiments = $scope.browser.project[experimentsAttr];
      if (typeof experiments === 'undefined'){
        $scope.browser.project[experimentsAttr] = [];
        experiments = $scope.browser.project[experimentsAttr];
      }
      ProjectService.manageExperiments({'experiments': experiments,
                                        'project': $scope.browser.project}).then(function (experiments) {
        $scope.browser.experiments = experiments;
      });
    };

    var _editFieldModal = function(objArr, title, fields, classes){
        modal = $uibModal.open({
          template : '<div class="modal-header">' +
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
         controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
            $scope.ui = {fields: fields,
                         classes: classes,
                         title: title,
                         form: {}};
            $scope.data = {objArr: objArr};

            $scope.close = function(){
                $uibModalInstance.dismiss('Cancel');
            };

            $scope.addDataRecord = function(){
                var nRecord = {};
                fields.forEach(function(field){
                    nRecord[field] = '';
                });
                $scope.data.objArr.push(nRecord);
            };

            $scope.delDataRecord = function(index){
              $scope.data.objArr[index]._ui.deleted = true;
            };

            $scope.undelDataRecord = function(index){
              $scope.data.objArr[index]._ui.deleted = false;
            };

            $scope.save = function(){
                $uibModalInstance.close($scope.data.objArr);
            };
         }]
        });
        return modal;
    };

    var _publicationCtrl = {

      filterUsers: function(usernames, users){
        return _.filter(users, function(usr){
            return _.contains(usernames, usr.username);
        });
      },

      showText : function(text){
          $uibModal.open({
              template: '<div class="modal-header">' +
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
              controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
                  $scope.text = text;
                  $scope.close = function(){
                      $uibModalInstance.dismiss('Close');
                  };
              }]
          });
      },

      moveOrderUp: function($index, ent, list){
        if (typeof ent._ui.order === 'undefined'){
          ent._ui.order = 0;
        } else if (ent._ui.order > 0){
          var order = ent._ui.order;
          var _ent = _.find(list, function(e){
                                        return e._ui.order === order - 1; });
          ent._ui.order -= 1;
          _ent._ui.order += 1;
        }
      },

      moveOrderDown: function($index, ent, list){
        if (typeof ent._ui.order === 'undefined'){
          ent._ui.order = 0;
        } else if (ent._ui.order < list.length - 1){
          var _ent = _.find(list, function(e){
                                        return e._ui.order === ent._ui.order + 1; });
          ent._ui.order += 1;
          _ent._ui.order -= 1;
        }
      },

      openEditProject : function(){
          $scope.editProject();
      },

      openEditExperiments: function(){
        $scope.manageExperiments();
      },

      openEditTeamMembers: function(){
        $scope.manageCollabs();
      },

      openEditCategories: function(){
        DataBrowserService.viewCategories([]);
      },

      selectAllFiles : function(ent, evt){
        var listing = [];
        if (ent.name === 'designsafe.project.experiment'){
          listing = $scope.browser.listings[evt.uuid];
        } else {
          listing = $scope.browser.listings[ent.uuid];
        }
        if (typeof $scope.browser.publication.filesSelected[ent.uuid] === 'undefined'){
          $scope.browser.publication.filesSelected[ent.uuid] = {};
        }
        if (ent.name === 'designsafe.project.experiment'){
          var files = listing;
          $scope.browser.publication.filesSelected[ent.uuid][evt.uuid] = files;
          _addToLists(ent, evt);
        } else {
          $scope.browser.publication.filesSelected[ent.uuid] = listing;
          _addToLists(ent);
        }
      },

      selectFileForPublication : function(ent, evt, file){
        if (typeof $scope.browser.publication.filesSelected[ent.uuid] === 'undefined'){
          if (ent.name == 'designsafe.project.experiment'){
            $scope.browser.publication.filesSelected[ent.uuid] = {};
          } else {
            $scope.browser.publication.filesSelected[ent.uuid] = [];
          }
        }
        var files = [];
        if (ent.name === 'designsafe.project.experiment'){
          files = $scope.browser.publication.filesSelected[ent.uuid][evt.uuid];
        } else {
          files = $scope.browser.publication.filesSelected[ent.uuid];
        }
        if (typeof files == 'undefined' || !_.isArray(files)){
          files = [];
        }
        files.push(file);
        if (ent.name === 'designsafe.project.experiment'){
          $scope.browser.publication.filesSelected[ent.uuid][evt.uuid] = files;
          _addToLists(ent, evt);
        } else {
          $scope.browser.publication.filesSelected[ent.uuid] = files;
          _addToLists(ent);
        }
      },

      deselectAllFiles : function(ent, evt){
        if (ent.name === 'designsafe.project.experiment'){
          $scope.browser.publication.filesSelected[ent.uuid][evt.uuid] = [];
          delete $scope.browser.publication.filesSelected[ent.uuid][evt.uuid];
          if (_.isEmpty($scope.browser.publication.filesSelected[ent.uuid])){
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

      isFileSelectedForPublication : function(ent, evt, file){
        if (typeof $scope.browser.publication.filesSelected[ent.uuid] === 'undefined'){
          if (ent.name === 'designsafe.project.experiment'){
            $scope.browser.publication.filesSelected[ent.uuid] = {};
          } else {
            $scope.browser.publication.filesSelected[ent.uuid] = [];
          }
        }
        var files = [];
        if(ent.name === 'designsafe.project.experiment'){
          files = $scope.browser.publication.filesSelected[ent.uuid][evt.uuid] || [];
          return _.find(files, function(f){ return f.uuid() === file.uuid(); });
        } else {
          files = $scope.browser.publication.filesSelected[ent.uuid] || [];
          return _.find(files, function(f){ return f.uuid() === file.uuid(); });
        }
      },

      deselectFileForPublication : function(ent, evt, file){
        var files = [];
        if (ent.name === 'designsafe.project.experiment'){
          files = $scope.browser.publication.filesSelected[ent.uuid][evt.uuid];
        } else {
          files = $scope.browser.publication.filesSelected[ent.uuid];
        }
        files = _.reject(files, function(f){ return f.uuid() === file.uuid(); });
        if (ent.name === 'designsafe.project.experiment'){
          $scope.browser.publication.filesSelected[ent.uuid][evt.uuid] = files;
          if (!$scope.browser.publication.filesSelected[ent.uuid][evt.uuid].length){
            delete $scope.browser.publication.filesSelected[ent.uuid][evt.uuid];
            if (_.isEmpty($scope.browser.publication.filesSelected[ent.uuid])){
                _removeFromLists(ent, evt);
            }else {
                _removeFromLists(ent, evt);
            }
          }
        } else {
          $scope.browser.publication.filesSelected[ent.uuid] = files;
          if (!$scope.browser.publication.filesSelected[ent.uuid].length){
            delete $scope.browser.publication.filesSelected[ent.uuid];
            if (_.isEmpty($scope.browser.publication.filesSelected[ent.uuid])){
                _removeFromLists(ent);
            }
          }
        }
      },

      filterExperiments : function(experiments){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
            return experiments;
        } else {
            return $scope.browser.publication.experimentsList;
        }
      },

      filterSimulations : function(simulations){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
          return simulations;
        } else {
          return $scope.browser.publication.simulationsList;
        }
      },

      filterEvents : function(events, exp){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
            return events;
        } else {
            return _.filter($scope.browser.publication.eventsList,
                            function(evt){
                              return _.contains(evt.associationIds, exp.uuid);
                            });
        }
      },

      filterSimulationModels : function(models, simulation){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
          return models;
        } else {
          return _.filter($scope.browser.publication.simulationModelsList,
            function(model){
              return _.contains(model.associationIds, simulation.uuid);
            });
        }
      },

      filterSimAnalysis : function(analysis){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
          return _.filter(analysis, function(anl){
            return !anl.value.simOutputs.length;
          });
        } else {
          return _.filter($scope.browser.publication.simulationsList, function(anl){
            return !anl.value.simOutputs.length;
          });
        }
      },

      filterSimReports : function(reports){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
          return _.filter(reports, function(rpt){
            return !rpt.value.simOutputs.length;
          });
        } else {
          return _.filter($scope.browser.publication.reportsList, function(rpt){
            return !rpt.value.simOutputs.length;
          });
        }
      },

      filterFiles : function(parentEnt, ent, listing){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
            return listing;
        } else if (parentEnt && typeof parentEnt.uuid !== 'undefined' && ent) {
            return $scope.browser.publication.filesSelected[parentEnt.uuid][ent.uuid];
        } else {
            return $scope.browser.publication.filesSelected[ent.uuid];
        }
      },

      editUsers : function(){
        fields = [
          {id: 'last_name', name: 'last_name', label: 'Last Name', uniq: 'username', type: 'text'},
          {id: 'first_name', name: 'first_name', label: 'First Name', uniq: 'username', type: 'text'}
        ];
        classes = {
            'first_name': 'col-md-6',
            'last_name': 'col-md-6'
        };
        modal = _editFieldModal($scope.browser.publication.users, 'Edit Users', fields, classes);

        modal.result.then(function(respArr){
          $scope.browser.publication.users = respArr;
        });
      },

      editInsts : function(){
        fields = [{id:'label', name:'label', label:'Institution', uniq: 'name', type:'text'}];
        modal = _editFieldModal($scope.browser.publication.institutions, 'Edit Institutions', fields);

        modal.result.then(function(respArr){
          $scope.browser.publication.institutions = respArr;
        });
      },

      togglePubAgreement : function() {
        $scope.state.publishAgreement = !$scope.state.publishAgreement;
      }
    };

    $scope.publicationCtrl = _publicationCtrl;

  }]);
})(window, angular);
