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
    

    $scope.stateReload = function() { 
      $state.reload();
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
            label: DataBrowserService.state().project.value.title,
            href: $state.href('projects.view.data', {
              projectId: toStateParams.projectId,
              filePath: '/',
              projectTitle: DataBrowserService.state().project.value.title
            })
          });
        } else {
          _.each(toStateParams.filePath.split('/'), function (e, i, l) {
            var filePath = l.slice(0, i + 1).join('/');
            if (filePath === '') {
              filePath = '/';
            }
            $scope.data.navItems.push({
              label: e || DataBrowserService.state().project.value.title,
              href: $state.href('projects.view.data', {
                projectId: toStateParams.projectId,
                filePath: filePath,
                projectTitle: DataBrowserService.state().project.value.title
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
                                       projectTitle: project.value.title}, {reload: true});
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
      $scope.data.project.appendEntitiesRel(resp);
      return resp;
    }

    ProjectService.get({uuid: projectId}).then(function (project) {
      $scope.data.project = project;
      DataBrowserService.state().project = project;
      DataBrowserService.state().loadingEntities = true;
      $scope.data.loadingEntities = true;
      var _related = project._related;
      ProjectEntitiesService.listEntities(
        {uuid: projectId, name: 'all'})
      .then(setEntitiesRel)
      .then(
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

    function checkMetadata(){
      var projData = $scope.data.project.value;
      // experimental
      var experimentsList = $scope.state.publication.experimentsList;
      var analysisList = $scope.state.publication.analysisList;
      var reportsList = $scope.state.publication.reportsList;
      // simulation
      var simSimulations = $scope.state.publication.simulations;
      var simAnalysis = $scope.state.publication.analysiss;
      var simReports = $scope.state.publication.reports;

      var publicationMessages = [];
      var checklist = {
        project: {},
      };

      // object containing required* fields that will be checked on metadata page
      var requirements = {
        "projectReq": ['title', 'projectType', 'description', 'awardNumber', 'keywords'],
        "experimentReq": ['title', 'experimentType', 'experimentalFacility', 'description', 'authors'],
        "simulationReq": ['title', 'authors', 'description', 'simulationType'], // add referenced data section..
        "otherReq": [],
        "reportReq": ['title'],
        "analysisReq": ['title', 'description'],
      };

      //check project requirements
      function projectRequirements(){
        checklist.project.name = projData.title;
        checklist.project.category = "project";
        requirements.projectReq.forEach(function(req) {
          if (projData[req] == '' || projData[req] == []) {
            checklist.project[req] = false;
          } else {
            checklist.project[req] = true;
          }
        });
        return;
      }
      
      //check experiment requirements
      function experimentRequirements(){
        var i = 0;
        //TODO: check for descriptions within models/sensors/events
        var models = $scope.data.project.modelconfig_set;
        var sensors = $scope.data.project.sensorlist_set;
        var events = $scope.data.project.event_set;

        experimentsList.forEach(function (exp) {
          var title = experimentsList[i].value.title;

          checklist['experiment'+i] = {};
          checklist['experiment'+i].name = title;
          checklist['experiment'+i].category = 'experiment';

          
          //model configs
          checklist['experiment'+i].model = false;
          models.forEach(function(mod){
            mod.value.experiments.forEach(function(mid) {
              if (exp.uuid == mid) {
                checklist['experiment'+i].model = true;
              }
            });
          });
          
          //sensor data
          checklist['experiment'+i].sensor = false;
          sensors.forEach(function(sen) {
            sen.value.experiments.forEach(function(sid) {
              if (exp.uuid == sid) {
                checklist['experiment'+i].sensor = true;
              }
            });
          });

          //event data
          checklist['experiment'+i].event = false;
          events.forEach(function(evt) {
            evt.value.experiments.forEach(function(eid) {
              if (exp.uuid == eid) {
                checklist['experiment'+i].event = true;
              }
            });
          });

          requirements.experimentReq.forEach(function (req) {
            if (exp.value[req] == '' || exp.value[req] == []) {
              checklist['experiment'+i][req] = false;
            } else {
              checklist['experiment'+i][req] = true;
            }
          });
          i++;
        });
        return;
      }

      //check simulation requirements
      function simulationRequirements(){
        var i = 0;
        //TODO: add check to definition for models/inputs/outputs
        var models = $scope.state.publication.models;
        var inputs = $scope.state.publication.inputs;
        var outputs = $scope.state.publication.outputs;


        if (simSimulations === undefined || simSimulations == '') {
          return;
        } else {
          simSimulations.forEach(function (sim) {
            var title = simSimulations[i].value.title;

            checklist['simulation'+i] = {};
            checklist['simulation'+i].name = title;
            checklist['simulation'+i].category = 'simulation';
            
            //models
            if (models === undefined) {
              checklist['simulation'+i].model = false;
            } else {
              checklist['simulation'+i].model = false;
              models.forEach(function(mod){
                mod.value.simulations.forEach(function(mid) {
                  if (sim.uuid == mid) {
                    checklist['simulation'+i].model = true;
                  }
                });
              });
            }

            //inputs
            if (inputs === undefined) {
              checklist['simulation'+i].input = false;
            } else {
              checklist['simulation'+i].input = false;
              inputs.forEach(function(ipt) {
                ipt.value.simulations.forEach(function(iid) {
                  if (sim.uuid == iid) {
                    checklist['simulation'+i].input = true;
                  }
                });
              });
            }

            //outputs
            if (outputs === undefined) {
              checklist['simulation'+i].output = false;  
            } else {
              checklist['simulation'+i].output = false;
              outputs.forEach(function(opt) {
                opt.value.simulations.forEach(function(oid) {
                  if (sim.uuid == oid) {
                    checklist['simulation'+i].output = true;
                  }
                });
              });
            }

            requirements.simulationReq.forEach(function (req) {
              if (sim.value[req] == '' || sim.value[req] == []) {
                checklist['simulation'+i][req] = false;
              } else {
                checklist['simulation'+i][req] = true;
              }
            });
            i++;
          });
        }
        return;
      }

      //check analysis requirements
      function analysisRequirements(){
        var i = 0;
        if (projData.projectType == "experimental" && analysisList !== undefined && analysisList !== '') {
          analysisList.forEach(function (exp) {
            var title = analysisList[i].value.title;
  
            checklist['analysis'+i] = {};
            checklist['analysis'+i].name = title;
            checklist['analysis'+i].category = 'analysis';
            requirements.analysisReq.forEach(function (req) {
              if (exp.value[req] == '' || exp.value[req] == []) {
                checklist['analysis'+i][req] = false;
              } else {
                checklist['analysis'+i][req] = true;
              }
            });
            i++;
          });
        }
        else if (projData.projectType == "simulation" && simAnalysis !== undefined && simAnalysis !== '') {
          simAnalysis.forEach(function (exp) {
            var title = simAnalysis[i].value.title;
  
            checklist['analysis'+i] = {};
            checklist['analysis'+i].name = title;
            checklist['analysis'+i].category = 'analysis';
            requirements.analysisReq.forEach(function (req) {
              if (exp.value[req] == '' || exp.value[req] == []) {
                checklist['analysis'+i][req] = false;
              } else {
                checklist['analysis'+i][req] = true;
              }
            });
            i++;
          });
        }
        return;
      }

      //check report requirements
      function reportRequirements(){
        var i = 0;

        if (projData.projectType == "experimental" && reportsList !== undefined && reportsList !== '') {
          reportsList.forEach(function (exp) {
            var title = reportsList[i].value.title;

            checklist['report'+i] = {};
            checklist['report'+i].name = title;
            checklist['report'+i].category = 'report';
            requirements.reportReq.forEach(function (req) {
              if (exp.value[req] == '' || exp.value[req] == []) {
                checklist['report'+i][req] = false;
              } else {
                checklist['report'+i][req] = true;
              }
            });
            i++;
          });
        } else if (projData.projectType == "simulation" && simReports !== undefined && simReports !== '') {
          simReports.forEach(function (exp) {
            var title = simReports[i].value.title;

            checklist['report'+i] = {};
            checklist['report'+i].name = title;
            checklist['report'+i].category = 'report';
            requirements.reportReq.forEach(function (req) {
              if (exp.value[req] == '' || exp.value[req] == []) {
                checklist['report'+i][req] = false;
              } else {
                checklist['report'+i][req] = true;
              }
            });
            i++;
          });
        }
        return;
      }

      
      projectRequirements();
      experimentRequirements();
      simulationRequirements();
      analysisRequirements();
      reportRequirements();

      //check for missing metadata blocks
      var allow = true;
      if (projData.projectType == "experimental") {
        if (Object.keys(checklist).includes('experiment0') !== true) {
          publicationMessages.push({title: "Project", message: "Your project must include an experiment."});
          allow = false;
        }
        if (Object.keys(checklist).includes('analysis0') !== true) {
          publicationMessages.push({title: "Project", message: "Your project must include an analysis."});
          allow = false;
        }
      } else if (projData.projectType == "simulation") {
        if (Object.keys(checklist).includes('simulation0') !== true) {
          publicationMessages.push({title: "Project", message: "Your project must include a simulation."});
          allow = false;
        }
      }

      // return messages for missing fields
      i = 0;
      Object.values(checklist).forEach(function(exp) {
        Object.entries(exp).forEach(function(res) {
          // res[0] == keys
          // res[1] == values
          if (res[1] === false) {
            if (res[0] == 'title') {
              //if 'title' is missing push data category type
              publicationMessages.push({title: exp.category, message: "You are missing: " + res[0]});
              allow = false;
            } else {
              //if anything else push the data name
              publicationMessages.push({title: exp.name, message: "You are missing: " + res[0]});
              allow = false;
            }
          }
        });
        i++;
      });

      if (allow) {
        $scope.state.publishPipeline = 'agreement';
      } else {
        $scope.ui.publicationMessages = publicationMessages;
        return;
      }
    }

    $scope.publishPipeline_start = function(){
      $scope.state.publishPipeline = 'select';
    };

    $scope.publishPipeline_review = function(){
      $scope.state.publishPipeline = 'review';
      //if (typeof $scope.saveInterval === 'undefined'){
      //  $scope.saveInterval = $interval(savePublication, 1000);
      //}
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
        $scope.ui.publicationMessages = [];
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
        //if (typeof $scope.saveInterval === 'undefined'){
        //  $scope.saveInterval = $interval($scope.publishPipeline_publish('saved'), 1000);
        //}
        $scope.state.publishPipeline = 'meta';
      }
      else if (st == 'meta'){
        checkMetadata();
      }else {
        $scope.state.publishPipeline = 'agreement';
      }
    };

    $scope.publishPipeline_publish = function(status){
      //if (typeof status !== 'undefined' && status != 'saved'){
      //    $interval.cancel($scope.saveInterval);
      //} else if (typeof status === 'undefined'){
      //  status = 'published';
      //}
      if (typeof status === 'undefined'){
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

      // TODO:  A series of checks and notification flags were created here 
      //        but they are not being displayed in the metadata section.
      //        Suggest going over these since some will be redundant. See
      //        above "checkMetadata"
      
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
      } else if ($scope.state.project.value.projectType == 'simulation'){
        delete publication.eventsList;
        delete publication.modelConfigs;
        delete publication.sensorLists;
        delete publication.analysisList;
        delete publication.reportsList;
        delete publication.experimentsList;
        publication.analysiss = _.uniq(publication.analysiss, function(e){ return e.uuid; });
        publication.inputs = _.uniq(publication.inputs, function(e){ return e.uuid; });
        publication.models = _.uniq(publication.models, function(e){ return e.uuid; });
        publication.outputs = _.uniq(publication.outputs, function(e){ return e.uuid; });
        publication.reports = _.uniq(publication.reports, function(e){ return e.uuid; });
        publication.simulations = _.uniq(publication.simulations, function(e){ return e.uuid; });
        function getFileObjs(ent){
          var selectedFiles = $scope.state.publication.filesSelected[ent.uuid];
          var files = _.map(selectedFiles, function(file){
                  return {
                      'path': file.path,
                      'type': file.type,
                      'length': file.length,
                      'name': file.name
                  };
          });
          ent.fileObjs = files;
        }
        _.each(publication.analysiss, getFileObjs);
        _.each(publication.inputs, getFileObjs);
        _.each(publication.models, getFileObjs);
        _.each(publication.outputs, getFileObjs);
        _.each(publication.reports, getFileObjs);
        _.each(publication.simulations, getFileObjs);
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
              //$scope.browser.publication = _.extend($scope.browser.publication, resp.data);
              //$scope.browser.publication.experimentsList = $scope.browser.publication.experimentsList || [];
              //$scope.browser.publication.eventsList = $scope.browser.publication.eventsList || [];
              //$scope.browser.publication.analysisList = $scope.browser.publication.analysisList || []; 
              //$scope.browser.publication.reportsList = $scope.browser.publication.reportsList || [];
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
      if (typeof(file.type) !== 'undefined' && file.type !== 'dir' && file.type !== 'folder') {
        DataBrowserService.preview(file, $scope.browser.listing);
      } else {
        $state.go('projects.view.data', {projectId: projectId,
                                         filePath: file.path,
                                         projectTitle: projectTitle}, {reload: true});
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
      var type=$scope.browser.project.value.projectType;
      if (typeof type === 'undefined' || _.isEmpty(type)){
        type = 'experimental';
      }
      $event.preventDefault();
      $event.stopPropagation();
      DataBrowserService.openPreviewTree(entityUuid, type);
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
      } else if (ent.name === 'designsafe.project.simulation'){
        if (typeof $scope.browser.publication.simulations === 'undefined'){
          $scope.browser.publication.simulations = [];
        }
        $scope.browser.publication.simulations.push(ent);
      }
    }

    function _addToSimLists(ent){
      var nameComps = ent.name.split('.');
      var name = nameComps[nameComps.length - 1];
      var attrName = name + 's';
      if (typeof $scope.browser.publication[attrName] === 'undefined'){
        $scope.browser.publication[attrName] = [];
      }
      $scope.browser.publication[attrName].push(ent);
      $scope.browser.publication[attrName] = _.uniq($scope.browser.publication[attrName], function(e){return e.uuid});
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

    function _removeFromSimLists(ent){
      var nameComps = ent.name.split('.');
      var name = nameComps[nameComps.length - 1];
      var attrName = name + 's';
      $scope.browser.publication[attrName] = _.filter($scope.browser.publication[attrName], function(e){ return e.uuid !== ent.uuid });
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

    $scope.manageSimulations = function() {
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

      openEditSimulations: function(){
        $scope.manageSimulations();
      },

      openEditTeamMembers: function(){
        $scope.manageCollabs();
      },

      openEditCategories: function(){
        DataBrowserService.viewCategories([]);
      },

      isMissing: function(ent){
        if (typeof(ent) == 'object') {
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

      selectAllSimFiles : function(ent){
        var listing = [];
        try {
            listing = $scope.browser.listings[ent.uuid];
        } catch(e){
            _addToSimLists(ent);
            return;
        }
        $scope.browser.publication.filesSelected[ent.uuid] = listing;
        _addToSimLists(ent);
      },

      selectFileForSimPublication : function(ent, file){
        if (typeof $scope.browser.publication.filesSelected[ent.uuid] === 'undefined'){
          $scope.browser.publication.filesSelected[ent.uuid] = [];
        }
        $scope.browser.publication.filesSelected[ent.uuid].push(file)
        _addToSimLists(ent);
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

      deselectAllSimFiles : function(ent){
        if ($scope.browser.publication.filesSelected[ent.uuid] !== 'undefined'){
          delete $scope.browser.publication.filesSelected[ent.uuid];
        }
        _removeFromSimLists(ent)
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

      isFileSelectedForSimPublication : function(ent, file){
        return _.find($scope.browser.publication.filesSelected[ent.uuid],
            function(f){ return f.uuid() === file.uuid(); });
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

      deselectFileForSimPublication : function(ent, file){
        _.reject($scope.browser.publication.filesSelected[ent.uuid],
            function(f){ return f.uuid() === file.uuid()});
        if (!$scope.browser.publication.filesSelected[ent.uuid].length){
          _removeFromSimLists(ent);
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
          return $scope.browser.publication.simulations;
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
          return _.filter($scope.browser.publication.models,
            function(model){
              return _.contains(model.associationIds, simulation.uuid);
            });
        }
      },

      filterSimulationInputs : function(models, simulation){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
          return models;
        } else {
          return _.filter($scope.browser.publication.inputs,
            function(input){
              return _.contains(input.associationIds, simulation.uuid);
            });
        }
      },

      filterSimulationOutputs : function(models, simulation){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
          return models;
        } else {
          return _.filter($scope.browser.publication.outputs,
            function(output){
              return _.contains(output.associationIds, simulation.uuid);
            });
        }
      },

      filterSimAnalysis : function(analysis){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
          return _.filter(analysis, function(anl){
            return !anl.value.simOutputs.length;
          });
        } else {
          return _.filter($scope.browser.publication.analysiss, function(anl){
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
          return _.filter($scope.browser.publication.reports, function(rpt){
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
