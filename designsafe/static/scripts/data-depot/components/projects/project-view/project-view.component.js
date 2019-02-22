import _ from 'underscore';
import ProjectViewTemplate from './project-view.component.html';

export function ProjectViewCtrl($scope, $state, Django, ProjectService, ProjectEntitiesService, DataBrowserService, FileListing, $uibModal, $q, $http, $interval) {
    'ngInject';
    var projectId = ProjectService.resolveParams.projectId;
    $scope.data = ProjectService.data;
    $scope.state = DataBrowserService.state();
    $scope.browser = DataBrowserService.state();
    $scope.ui = {};

    function setEntitiesRel(resp){
      $scope.data.project.appendEntitiesRel(resp);
      return resp;
    }

    function checkState () {
      $scope.workingDir = false;
      var broken = $state.current.name.split('.');
      var last = broken.pop();
      if (last == 'data') {
        $scope.workingDir = true;
      }
      // Object.keys($scope.curState).forEach(s => $scope.curState[s] = false);
      // $scope.curState[last] = true;
    }

    $scope.browser.projectServicePromise = ProjectService.get({uuid: projectId}).then(function (project) {
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
    }).then(function(){
      checkState();
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
      ProjectService.editProject($scope.data.project);
    };

    $scope.isSingle = function(val) {
      // we will have older projects with a single award number as a string
      return typeof val === 'string';
    };

    $scope.manageCollabs = function($event) {
      if ($event){
        $event.preventDefault();
      }
      ProjectService.manageCollaborators($scope.data.project).then(function (res) {
      });
    };

    // $scope.manageCategories = function($event) {
    //   if ($event){
    //     $event.preventDefault();
    //   }
    //   ProjectService.manageCategories({'project': $scope.data.project});
    // };

    // $scope.relateData = function($event) {
    //   $uibModal.open({
    //     component: 'projectTree',
    //     resolve: {
    //         project: () => {return $scope.browser.project; },
    //     },
    //     size: 'lg'
    //   });
    // };

    // $scope.manageExperiments = function($event) {
    //   if ($event){
    //     $event.preventDefault();
    //   }
    //   var experimentsAttr = $scope.data.project.getRelatedAttrName('designsafe.project.experiment');
    //   var experiments = $scope.data.project[experimentsAttr];
    //   if (typeof experiments === 'undefined'){
    //     $scope.data.project[experimentsAttr] = [];
    //     experiments = $scope.data.project[experimentsAttr];
    //   }
    //   ProjectService.manageExperiments({'experiments': experiments, 'project': $scope.data.project});
    // };

    $scope.workingDirectory = function() {
      $state.go('projects.view.data', {projectId: projectId}).then(function() {
        // checkState();
      });
    };

    $scope.curationDirectory = function() {
      /*
      need to set project type as undefined when creating
      a new project. At that point we can check if the project
      type is undefined before showing this popup.
      */
      if ($scope.browser.project.value.projectType === 'None') {
        $scope.manageProjectType();
      } else {
        $state.go('projects.curation', {projectId: projectId}, {reload: true});
      }
    };

    $scope.publicationPreview = function() {
      if ($scope.browser.project.value.projectType === 'experimental') {
        $state.go('projects.preview', {projectId: $scope.browser.project.uuid}).then(function() {
          checkState();
        });
      } else if ($scope.browser.project.value.projectType === 'simulation') {
        $state.go('projects.previewSim', {projectId: $scope.browser.project.uuid}).then(function() {
          checkState();
        });
      } else if ($scope.browser.project.value.projectType === 'hybrid_simulation') {
        $state.go('projects.previewHybSim', {projectId: $scope.browser.project.uuid}).then(function() {
          checkState();
        });
      } else if ($scope.browser.project.value.projectType === 'other') {
        $state.go('projects.previewOther', {projectId: $scope.browser.project.uuid}).then(function() {
          checkState();
        });
      }
    };

    $scope.pipelineSelect = function() {
      $state.go('projects.pipelineSelect', {projectId: projectId}).then(function() {
        // checkState();
      });
    };

    $scope.pipelineProject = function() {
      $state.go('projects.pipelineProject', {projectId: projectId}).then(function() {
        // checkState();
      });
    };

    $scope.manageProjectType = function($event) {
      if ($event){
        $event.preventDefault();
      }
      ProjectService.manageProjectType({'project': $scope.data.project, 'warning': false});
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
      ProjectService.manageSimulations({'simulations': simulations, 'project': $scope.data.project});
    };

    $scope.manageHybridSimulations = function($event) {
      if ($event){
        $event.preventDefault();
      }
      var hybridSimulationAttr = $scope.data.project.getRelatedAttrName(
          'designsafe.project.hybrid_simulation'
      );
      var hybridSimulations = $scope.data.project[hybridSimulationAttr];
      if (typeof hybridSimulations === 'undefined'){
        $scope.data.project[hybridSimulationAttr] = [];
        hybridSimulations = $scope.data.project[hybridSimulationAttr];
      }
      ProjectService.manageHybridSimulations({'hybridSimulations': hybridSimulations, 'project': $scope.data.project});
    };

    $scope.checkEmptyCategories = function(){
      var missing = [];
      var ptype = $scope.data.project.value.projectType;
      var proj = $scope.data.project;

      /*
      This function will reach into each supplied model or "_set" within the
      project to check for missing files. If there is no categorized files
      within the "_set" we will return a notification to the user.
      */
      function checkPrjModel(model, modelRelation, prjset, prjtype, setname) {
        if (model === undefined || model.length == 0) {
          missing.push({'missingSet': setname});
          return;
        }
        model.forEach(function(m) {
          if (m.value.files.length === 0) {
            m.value[modelRelation].forEach(function(mr){
              prjset.forEach(function(p){
                if (p.uuid == mr) {
                  var ptitle = p.value.title;
                  var modeltitle = m.value.title;
                  var obj = {};
                  obj.title = ptitle;
                  obj.model = modeltitle;
                  obj.type = prjtype;
                  missing.push(obj);
                }
              });
            });
          }
        });
      }

      if (ptype == 'simulation') {
        checkPrjModel(proj.model_set, 'simulations', proj.simulation_set, 'simulation', 'model');
        checkPrjModel(proj.output_set, 'simulations', proj.simulation_set, 'simulation', 'simulation output');
        checkPrjModel(proj.input_set, 'simulations', proj.simulation_set, 'simulation', 'simulation input');
        // checkPrjModel(proj.analysis_set, 'simulations', proj.simulation_set, 'simulation', 'analysis');
        // checkPrjModel(proj.report_set, 'simulations', proj.simulation_set, 'simulation', 'report');
      } else if (ptype == 'experimental') {
        checkPrjModel(proj.modelconfig_set, 'experiments', proj.experiment_set, 'experiment', 'model configuration');
        checkPrjModel(proj.event_set, 'experiments', proj.experiment_set, 'experiment', 'event');
        checkPrjModel(proj.sensorlist_set, 'experiments', proj.experiment_set, 'experiment', 'sensor list');
        // checkPrjModel(proj.analysis_set, 'experiments', proj.experiment_set, 'experiment', 'analysis');
        // checkPrjModel(proj.report_set, 'experiments', proj.experiment_set, 'experiment', 'report');
      } else if (ptype == 'hybrid_simulation') {
        checkPrjModel(proj.globalmodel_set, 'hybridSimulations', proj.hybridsimulation_set, 'hybrid simulation', 'global model');
        checkPrjModel(proj.coordinator_set, 'hybridSimulations', proj.hybridsimulation_set, 'hybrid simulation', 'master simulation coordinator');
        checkPrjModel(proj.expsubstructure_set, 'hybridSimulations', proj.hybridsimulation_set, 'hybrid simulation', 'experimental substructure');
        checkPrjModel(proj.simsubstructure_set, 'hybridSimulations', proj.hybridsimulation_set, 'hybrid simulation', 'simulation substructure');
        checkPrjModel(proj.expoutput_set, 'hybridSimulations', proj.hybridsimulation_set, 'hybrid simulation', 'output set');
      }
      $scope.browser.missing = missing;
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
      $scope.checkEmptyCategories();
      $scope.previewHref = undefined;
      DataBrowserService.showPreview();
      // FileListing.get({'system': $scope.browser.listing.system,
      //                  'name': 'projectimage.jpg',
      //                  'path': '/projectimage.jpg'}).then(function(list){
      //                   list.preview().then(function(data){
      //                       $scope.previewHref = data.postit;
      //                   });
      //                 });
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
      var pub = $scope.state.publication;
      // experimental
      var experimentsList = pub.experimentsList;
      var analysisList = pub.analysisList;
      var reportsList = pub.reportsList;
      // simulation
      var simSimulations = pub.simulations;
      var simAnalysis = pub.analysiss;
      var simReports = pub.reports;
      // hybrid
      var hybridSimulation = pub.hybrid_simulations;
      // var hybridAnalysis = pub.analysisList;
      // var hybridReports = pub.reportsList;


      var publicationMessages = [];
      var checklist = {
        project: {},
      };

      // object containing required* fields that will be checked on metadata page
      var requirements = {
        "projectReq": ['title', 'projectType', 'description', 'awardNumber', 'keywords'],
        "experimentReq": ['title', 'experimentType', 'experimentalFacility', 'description', 'authors'],
        "simulationReq": ['title', 'authors', 'description', 'simulationType'],
        "hybridReq": ['title', 'authors', 'description', 'simulationType', 'simulationTypeOther'],
        "otherReq": [],
        "reportReq": ['title'],
        "analysisReq": ['title', 'description'],
      };

      /**
       * completes project checklist using the following:
       * 
       * dataType - models, sensors, structures, outputs etc...
       * prjType - metadata key in $scope.state.publication
       * clKeyName - string for checklist label (returned to user in error log)
       * exp - a single experiment/simulation/hybrid
       * iterator - for indexing checklist
       */
      function fillChecklist(dataType, prjType, clKeyName, exp, iterator){
        checklist[prjType+iterator][clKeyName] = false;
        dataType.forEach(function(ent){
          ent.value[prjType].forEach(function(entId) {
            if (exp.uuid == entId) {
              checklist[prjType+iterator][clKeyName] = true;
            }
          });
        });
      }

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
        
        var models = $scope.data.project.modelconfig_set;
        var sensors = $scope.data.project.sensorlist_set;
        var events = $scope.data.project.event_set;

        experimentsList.forEach(function (exp) {
          var title = experimentsList[i].value.title;

          checklist['experiments'+i] = {};
          checklist['experiments'+i].name = title;
          checklist['experiments'+i].category = 'experiment';

          //model configs
          fillChecklist(models, 'experiments', 'model', exp, i);
          //sensor data
          fillChecklist(sensors, 'experiments', 'sensor', exp, i);
          //event data
          fillChecklist(events, 'experiments', 'event', exp, i);

          requirements.experimentReq.forEach(function (req) {
            if (exp.value[req] == '' || exp.value[req] == []) {
              checklist['experiments'+i][req] = false;
            } else {
              checklist['experiments'+i][req] = true;
            }
          });
          i++;
        });
        return;
      }

      //check simulation requirements
      function simulationRequirements(){
        var i = 0;
        
        var models = pub.models;
        var inputs = pub.inputs;
        var outputs = pub.outputs;

        if (simSimulations === undefined || simSimulations == '') {
          return;
        } else {
          simSimulations.forEach(function (exp) {
            var title = simSimulations[i].value.title;

            checklist['simulations'+i] = {};
            checklist['simulations'+i].name = title;
            checklist['simulations'+i].category = 'simulation';
            
            //models
            if (models === undefined) {
              checklist['simulations'+i].model = false;
            } else {
              fillChecklist(models, 'simulations', 'model', exp, i);
            }
            //inputs
            if (inputs === undefined) {
              checklist['simulations'+i].input = false;
            } else {
              fillChecklist(inputs, 'simulations', 'input', exp, i);
            }
            //outputs
            if (outputs === undefined) {
              checklist['simulations'+i].output = false;  
            } else {
              fillChecklist(outputs, 'simulations', 'output', exp, i);
            }

            requirements.simulationReq.forEach(function (req) {
              if (exp.value[req] == '' || exp.value[req] == []) {
                checklist['simulations'+i][req] = false;
              } else {
                checklist['simulations'+i][req] = true;
              }
            });
            i++;
          });
        }
        return;
      }

      //check hybrid simulation requirements
      function hybridSimRequirements(){
        var i = 0;
        
        var globalModel = pub.global_models;
        var simCoordinator = pub.coordinators;
        var simSubstructure = pub.sim_substructures;
        var expSubstructure = pub.exp_substructures;
        var hybridOutputs = pub.outputs;


        if (hybridSimulation === undefined || hybridSimulation == '') {
          return;
        } else {
          hybridSimulation.forEach(function (exp) {
            var title = hybridSimulation[i].value.title;

            checklist['hybridSimulations'+i] = {};
            checklist['hybridSimulations'+i].name = title;
            checklist['hybridSimulations'+i].category = 'hybrid';
            
            //global model
            if (globalModel === undefined) {
              checklist['hybridSimulations'+i].global_model = false;
            } else {
              fillChecklist(globalModel, 'hybridSimulations', 'global_model', exp, i);
            }
            //sim coordinator
            if (simCoordinator === undefined) {
              checklist['hybridSimulations'+i].coordinator = false;
            } else {
              fillChecklist(simCoordinator, 'hybridSimulations', 'coordinator', exp, i);
            }
            //sim substructure
            if (simSubstructure === undefined) {
              checklist['hybridSimulations'+i].simulation_substructure = false;
            } else {
              fillChecklist(simSubstructure, 'hybridSimulations', 'simulation_substructure', exp, i);
            }
            //exp substructure
            if (expSubstructure === undefined) {
              checklist['hybridSimulations'+i].experiment_substructure = false;
            } else {
              fillChecklist(expSubstructure, 'hybridSimulations', 'experiment_substructure', exp, i);
            }

            requirements.hybridReq.forEach(function (req) {
              if (exp.value[req] == '' || exp.value[req] == []) {
                checklist['hybridSimulations'+i][req] = false;
              } else {
                checklist['hybridSimulations'+i][req] = true;
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
      analysisRequirements();
      reportRequirements();

      var allow = true;
      if (projData.projectType == "experimental") {
        experimentRequirements();
        if (Object.keys(checklist).includes('experiments0') !== true) {
          publicationMessages.push({title: "Project", message: "Your project must include an experiment."});
          allow = false;
        }
      } else if (projData.projectType == "simulation") {
        simulationRequirements();
        if (Object.keys(checklist).includes('simulations0') !== true) {
          publicationMessages.push({title: "Project", message: "Your project must include a simulation."});
          allow = false;
        }
      } else if (projData.projectType == "hybrid_simulation") {
        hybridSimRequirements();
        if (Object.keys(checklist).includes('hybridSimulations0') !== true) {
          publicationMessages.push({title: "Project", message: "Your project must include a hybrid simulation."});
          allow = false;
        }
      }
        
      // return messages for missing fields
      var i = 0;
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
      } else if ($scope.state.project.value.projectType == 'hybrid_simulation'){
        delete publication.eventsList;
        delete publication.modelConfigs;
        delete publication.sensorLists;
        delete publication.analysisList;
        delete publication.reportsList;
        delete publication.experimentsList;
        publication.analysiss = _.uniq(publication.analysiss, function(e){ return e.uuid; });
        publication.reports = _.uniq(publication.reports, function(e){ return e.uuid; });

        publication.coordinators = _.uniq(publication.coordinators, function(e){ return e.uuid; });
        publication.coordinator_outputs = _.uniq(publication.coordinator_outputs, function(e){ return e.uuid; });
        publication.exp_substructures = _.uniq(publication.exp_substructures, function(e){ return e.uuid; });
        publication.exp_outputs = _.uniq(publication.exp_outputs, function(e){ return e.uuid; });
        publication.sim_substructures = _.uniq(publication.sim_substructures, function(e){ return e.uuid; });
        publication.sim_outputs = _.uniq(publication.sim_outputs, function(e){ return e.uuid; });
        publication.global_models = _.uniq(publication.global_models, function(e){ return e.uuid; });
        publication.hybrid_simulations = _.uniq(publication.hybrid_simulations, function(e){ return e.uuid; });
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
        _.each(publication.reports, getFileObjs);

        _.each(publication.coordinators, getFileObjs);
        _.each(publication.coordinator_outputs, getFileObjs);
        _.each(publication.exp_substructures, getFileObjs);
        _.each(publication.exp_outputs, getFileObjs);
        _.each(publication.sim_substructures, getFileObjs);
        _.each(publication.sim_outputs, getFileObjs);
        _.each(publication.global_models, getFileObjs);
        _.each(publication.hybrid_simulations, getFileObjs);
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

  }

  export const ProjectViewComponent = {
      controller: ProjectViewCtrl,
      controllerAs: '$ctrl',
      template: ProjectViewTemplate,
      bindings: {
          resolve: '<',
          projectId: '<'
      }
  }
