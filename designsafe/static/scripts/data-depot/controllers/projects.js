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

  app.controller('ProjectViewCtrl', ['$scope', '$state', 'Django', 'ProjectService', 'ProjectEntitiesService', 'DataBrowserService', 'projectId', 'FileListing', '$uibModal', '$q', '$http', function ($scope, $state, Django, ProjectService, ProjectEntitiesService, DataBrowserService, projectId, FileListing, $uibModal, $q, $http) {

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
      ProjectService.manageCollaborators($scope.data.project).then(function (res) {
        console.log(res)
        $scope.data.project.pi = res.data.pi;
        $scope.data.project.coPis = res.data.coPis;
        $scope.data.project.teamMembers = res.data.teamMembers;
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

    $scope.publishPipeline_publish = function(){
      var publication = angular.copy($scope.state.publication);
      var experimentsList = [];
      var eventsList = [];
      var analysisList = [];
      var reportsList = [];
      var modelConfigs = [];
      var sensorLists = [];
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
      var project = angular.copy($scope.state.project);
      delete project._allRelatedObjects;
      _.each(project._related, function(val, key){
        delete project[key];
      });
      delete publication.filesSelected;
      publication.project = project;
      publication.eventsList = eventsList;
      publication.modelConfigs = modelConfigs;
      publication.sensorLists = sensorLists;
      publication.analysisList = analysisList;
      publication.reportsList = reportsList;
      publication.experimentsList = experimentsList;
      $http.post('/api/projects/publication/', {publication: publication})
        .then(function(resp){
          $scope.state.publicationMsg = resp.data.message;
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
                                  users: [], analysisList: [],
                                  filesSelected: []};
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
              $scope.browser.project.doi = resp.data.project.doi;
              DataBrowserService.state().project.doi = resp.data.project.doi;
              $scope.browser.project.publicationStatus = resp.data.status;
              DataBrowserService.state().project.publicationStatus = resp.data.status;
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
                       '</div>' +
                     '</div>' +
                     '<div class="modal-footer">' +
                       '<button class="btn btn-default" ng-click="close()">Close</button>' +
                       '<button class="btn btn-info" ng-click="save()">Save</button>' +
                     '</div>',
         controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
            $scope.ui = {fields: fields,
                         classes: classes,
                         title: title,
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
        DataBrowserService.viewCategories();
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
          $scope.browser.publication.filesSelected[ent.uuid] = {};
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

      selectFileForPublication : function(ent, evt, file){
        if (typeof $scope.browser.publication[ent.uuid] === 'undefined'){
          $scope.browser.publication[ent.uuid] = {};
        }
        var files = [];
        if (ent.name === 'designsafe.project.experiment'){
          files = $scope.browser.publication[ent.uuid][evt.uuid];
        } else {
          files = $scope.browser.publication[ent.uuid];
        }
        if (typeof files == 'undefined'){
          files = [];
        }
        files.push(file);
        if (ent.name === 'designsafe.project.experiment'){
          $scope.browser.publication[ent.uuid][evt.uuid] = files;
        } else {
          $scope.browser.publication[ent.uuid] = files;
        }
        _addToLists(ent, evt);
      },

      filterExperiments : function(experiments){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
            return experiments;
        } else {
            return $scope.browser.publication.experimentsList;
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

      filterFiles : function(ent, evt, listing){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
            return listing;
        } else if (ent.name === 'designsafe.project.experiment') {
            return $scope.browser.publication.filesSelected[ent.uuid][evt.uuid];
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
