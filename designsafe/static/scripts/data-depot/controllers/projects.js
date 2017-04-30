(function(window, angular) {
  var app = angular.module('designsafe');
  app.requires.push('django.context');

  app.controller('ProjectRootCtrl', ['$scope', '$state', 'DataBrowserService', function ($scope, $state, DataBrowserService) {

    DataBrowserService.apiParams.fileMgr = 'agave';
    DataBrowserService.apiParams.baseUrl = '/api/agave/files';
    DataBrowserService.apiParams.searchState = undefined;

    $scope.data = {
      navItems: [],
      projects: []
    };

    $scope.$on('$stateChangeSuccess', function($event, toState, toStateParams) {
      $scope.data.navItems = [{href: $state.href('projects.list'), label: 'Projects'}];

      if (toStateParams.filePath) {
        if (toStateParams.filePath === '/') {
          $scope.data.navItems.push({
            label: toStateParams.projectTitle,
            href: $state.href('projects.view.data', {
              projectId: toStateParams.projectId,
              filePath: '/',
              projectTitle: toStateParams.projectTitle
            })
          });
        } else {
          _.each(toStateParams.filePath.split('/'), function (e, i, l) {
            var filePath = l.slice(0, i + 1).join('/');
            if (filePath === '') {
              filePath = '/';
            }
            $scope.data.navItems.push({
              label: e || toStateParams.projectTitle,
              href: $state.href('projects.view.data', {
                projectId: toStateParams.projectId,
                filePath: filePath,
                projectTitle: toStateParams.projectTitle
              })
            });
          });
        }
      }

      if ($state.current.name === 'projects') {
        $state.go('projects.list');
      }
    });
  }]);

  app.controller('ProjectListingCtrl', ['$scope', '$state', 'Django', 'ProjectService', function ($scope, $state, Django, ProjectService) {
    $scope.ui = {};
    $scope.ui.busy = true;
    $scope.data.projects = [];
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

  }]);

  app.controller('ProjectViewCtrl', ['$scope', '$state', 'Django', 'ProjectService', 'ProjectEntitiesService', 'DataBrowserService', 'projectId', '$uibModal', '$q', function ($scope, $state, Django, ProjectService, ProjectEntitiesService, DataBrowserService, projectId, $uibModal, $q) {

    $scope.data = {};
    $scope.state = DataBrowserService.state();

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
      ProjectService.manageCollaborators($scope.data.project).then(function (project) {
        $scope.data.project = project;
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
      DataBrowserService.showPreview();
    };

    $scope.publishPipeline_start = function(){
      $scope.state.publishPipeline = 'select';
    };

    $scope.publishPipeline_review = function(){
      $scope.state.publishPipeline = 'review';
    };

    $scope.publishPipeline_meta = function(){
      $scope.state.publishPipeline = 'meta';
    };

    $scope.publishPipeline_exit = function(){
      $scope.state.publishPipeline = undefined;
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
                name: exp.value.experimentalFacility
                };
            institutions.push(o);
        });
        _.each($scope.state.publication.users, function(user){
            institutions.push({ label: user.profile.institution,
                                name: user.username});
        });
        $scope.state.publication.institutions = _.uniq(institutions, function(inst){ return inst.label;});
        $scope.state.publishPipeline = 'meta';
      }
      else if (st == 'meta'){
        $scope.state.publishPipeline = 'agreement';
      }else {
        $scope.state.publishPipeline = 'agreement';
      }
    };

  }]);

  app.controller('ProjectDataCtrl', ['$scope', '$state', 'Django', 'ProjectService', 'DataBrowserService', 'projectId', 'filePath', 'projectTitle', 'FileListing', 'UserService', '$uibModal', '$q', function ($scope, $state, Django, ProjectService, DataBrowserService, projectId, filePath, projectTitle, FileListing, UserService, $uibModal, $q) {
    DataBrowserService.apiParams.fileMgr = 'agave';
    DataBrowserService.apiParams.baseUrl = '/api/agave/files';
    DataBrowserService.apiParams.searchState = undefined;
    $scope.browser = DataBrowserService.state();
    $scope.browser.listings = {};
    $scope.browser.ui = {};
    $scope.browser.publication = {experimentsList: [], eventsList: [], users: []};
    if (typeof $scope.browser !== 'undefined'){
      $scope.browser.busy = true;
    }

    DataBrowserService.browse({system: 'project-' + projectId, path: filePath})
      .then(function () {
        $scope.browser = DataBrowserService.state();
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
      filePaths = _.uniq(usernames);
      var p = $q(function(resolve, reject){
        var results = [];
        var index = 0;
        var size = 5;
        var userIndex = 0;
        var calls = _.map(usernames, function(username){
          return UserService.get(username)
            .then(function(resp){
                resp._ui = {order:userIndex};
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
        setFilesDetails(allFilePaths)
        .then(function(){
            return setUserDetails($scope.browser.project.value.teamMembers);
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

    function _addToLists(exp, evt){
      $scope.browser.publication.experimentsList.push(exp);
      $scope.browser.publication.experimentsList = _.uniq($scope.browser.publication.experimentsList, function(e){return e.uuid;});
      $scope.browser.publication.eventsList.push(evt);
      $scope.browser.publication.eventsList = _.uniq($scope.browser.publication.eventsList, function(e){return e.uuid;});
    }
    function _removeFromLists(exp, evt){
      if (exp){
          $scope.browser.publication.experimentsList = _.filter($scope.browser.publication.experimentsList, function(e){ return e.uuid !== exp.uuid;});
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

    var _editFieldModal = function(objArr, fields){
        modal = $uibModal.open({
          template : '<div class="modal-body">' + 
                       '<div class="form-group" ' + 
                             'ng-repeat="obj in data.objArr">' + 
                         '<div ng-repeat="field in ui.fields">' +
                           '<label for="{{field.id}}-{{obj[field.uniq]}}">{{field.label}}</label>' + 
                           '<input type="{{field.type}}" class="form-control" name="{{field.name}}-{{obj[field.uniq]}}"' + 
                                   'id="{{field.id}}-{{obj[field.uniq]}}" ng-model="obj[field.name]"/>' +
                         '</div>' +
                       '</div>' +
                     '</div>' + 
                     '<div class="modal-footer">' +
                       '<button class="btn btn-default" ng-click="close()">Close</button>' + 
                       '<button class="btn btn-info" ng-click="save()">Save</button>' + 
                     '</div>',
         controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
            $scope.ui = {fields: fields,
                         form: {}};
            $scope.data = {objArr: angular.copy(objArr)};

            $scope.close = function(){
                $uibModalInstance.dismiss('Cancel');
            };

            $scope.save = function(){
                $uibModalInstance.close($scope.data.objArr);
            };
         }]
        });
        return modal;
    };

    var _publicationCtrl = {

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

      moveOrderUp: function(ent, total){
        if (typeof ent._ui.order === 'undefined'){
          ent._ui.order = 0;
        } else if (ent._ui.order > 0){
          ent._ui.order -= 1;
        }
      },

      moveOrderDown: function(ent, total){
        total = parseInt(total);
        if (typeof ent._ui.order === 'undefined'){
          ent._ui.order = 0;
        } else if (ent._ui.order < total - 1){
          ent._ui.order += 1;
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
        DataBrowserService.viewCategories();
      },

      selectAllFiles : function(exp, evt){
        var listing = $scope.browser.listings[evt.uuid];
        var files = listing;
        if (typeof $scope.browser.publication[exp.uuid] === 'undefined'){
          $scope.browser.publication[exp.uuid] = {};
        }
        $scope.browser.publication[exp.uuid][evt.uuid] = files;
        _addToLists(exp, evt);
      },

      deselectAllFiles : function(exp, evt){
        $scope.browser.publication[exp.uuid][evt.uuid] = [];
        delete $scope.browser.publication[exp.uuid][evt.uuid];
        if (_.isEmpty($scope.browser.publication[exp.uuid])){
          delete $scope.browser.publication[exp.uuid];
          _removeFromLists(exp, evt);
        } else {
          _removeFromLists(undefined, evt);
        }
      },

      isFileSelectedForPublication : function(exp, evt, file){
        if (typeof $scope.browser.publication[exp.uuid] === 'undefined'){
          $scope.browser.publication[exp.uuid] = {};
        }
        var files = $scope.browser.publication[exp.uuid][evt.uuid] || [];
        return _.find(files, function(f){ return f.uuid() === file.uuid(); });
      },

      deselectFileForPublication : function(exp, evt, file){
        var files = $scope.browser.publication[exp.uuid][evt.uuid];
        files = _.reject(files, function(f){ return f.uuid() === file.uuid(); });
        $scope.browser.publication[exp.uuid][evt.uuid] = files;
        if (!$scope.browser.publication[exp.uuid][evt.uuid].length){
          delete $scope.browser.publication[exp.uuid][evt.uuid];
          if (_.isEmpty($scope.browser.publication[exp.uuid])){
              _removeFromLists(exp, evt);
          }else {
              _removeFromLists(undefined, evt);
          }
        }
      },

      selectFileForPublication : function(exp, evt, file){
        if (typeof $scope.browser.publication[exp.uuid] === 'undefined'){
          $scope.browser.publication[exp.uuid] = {};
        }
        var files = $scope.browser.publication[exp.uuid][evt.uuid];
        if (typeof files == 'undefined'){
          files = [];
        }
        files.push(file);
        $scope.browser.publication[exp.uuid][evt.uuid] = files;
        _addToLists(exp, evt);
      },
      
      filterExperiments : function(experiments){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
            return experiments;
        } else {
            return $scope.browser.publication.experimentsList;
        }
      },
      
      filterEvents : function(events){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
            return events;
        } else {
            return $scope.browser.publication.eventsList;
        }
      },

      filterFiles : function(exp, evt, listing){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
            return listing;
        } else {
            return $scope.browser.publication[exp.uuid][evt.uuid];
        }
      },

      editUsers : function(fields){
        modal = _editFieldModal($scope.browser.publication.users, fields);

        modal.result.then(function(respArr){
          $scope.browser.publication.users = respArr;
        });
      },

      editInsts : function(fields){
        modal = _editFieldModal($scope.browser.publication.institutions, fields);

        modal.result.then(function(respArr){
          $scope.browser.publication.institutions = respArr;
        });
      }
    };

    $scope.publicationCtrl = _publicationCtrl;

  }]);
})(window, angular);
