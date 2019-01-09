import _ from 'underscore';
export function ProjectRootCtrl($scope, $state, DataBrowserService, ProjectService) {
    'ngInject';
    $scope.browser = DataBrowserService.state();
    DataBrowserService.apiParams.fileMgr = 'agave';
    DataBrowserService.apiParams.baseUrl = '/api/agave/files';
    DataBrowserService.apiParams.searchState = 'projects.search';

    // DataBrowserService.currentListing = 'new listing thing.'
    // release selected files
    DataBrowserService.deselect(DataBrowserService.state().selected);
    //$scope.data = {
    //  navItems: [],
    //  projects: []
    //};

    $scope.data = ProjectService.data

    $scope.stateReload = function() {
      $state.reload();
    };


    DataBrowserService.projectBreadcrumbSubject.subscribe( () =>  {
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


      if ($state.params.filePath) {
        if ($state.params.filePath.replace('%2F', '/') === '/') {
          $scope.data.navItems.push({
            label: DataBrowserService.state().project.value.title,
            href: $state.href('projects.view.data', {
              projectId: $state.params.projectId,
              filePath: '/',
              projectTitle: DataBrowserService.state().project.value.title,
              query_string: ''
            })
          });
        } else {
          _.each($state.params.filePath.replace('%2F', '/').split('/'), function (e, i, l) {
            var filePath = l.slice(0, i + 1).join('/');
            if (filePath === '' || filePath === '$SEARCH') {
              filePath = '/';
            }
            if (e === '$SEARCH') {
              e = ''
            }
            $scope.data.navItems.push({
              label: e || DataBrowserService.state().project.value.title,
              href: $state.href('projects.view.data', {
                projectId: $state.params.projectId,
                filePath: filePath,
                projectTitle: DataBrowserService.state().project.value.title,
                query_string: ''
              })
            });
          });
        }
      } else {
        
        // when the user is in the base project file's directory 
        // display the project title in the breadcrumbs
        $scope.data.navItems.push({
          label: getTitle($state.params, $scope.data.projects),
          href: $state.href('projects.view.data', {
            projectId: $state.params.projectId,
            filePath: '/',
            projectTitle: getTitle($state.params, $scope.data.projects),
            query_string: ''
          })
        });
      }
    });
    //$state.go('projects.list');
  }

  export function ProjectListingCtrl($scope, $rootScope, $state, DataBrowserService, Django, ProjectService) {
    'ngInject';
    $scope.ui = {};
    $scope.ui.busy = true;
    $scope.browser = DataBrowserService.state();
    $scope.browser.error = null;  //clears any potential lingering error messages.
    $scope.data = ProjectService.data
    $scope.data.projects = [];
    var offset = 0;
    var limit = 100;
    var page = 0;

    // release selected files on load
    DataBrowserService.deselect(DataBrowserService.state().selected);
    ProjectService.list({offset:offset, limit:limit}).then(function(projects) {
      $scope.ui.busy = false;
      $scope.data.projects = _.map(projects, function(p) { p.href = $state.href('projects.view', {projectId: p.uuid}); return p; });
      DataBrowserService.projectBreadcrumbSubject.next()
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

    $scope.scrollToTop = function () {
      return;
    };

    $scope.scrollToBottom = function () {
      offset = 0;

      if ($scope.browser.loadingMore || $scope.browser.reachedEnd) {
        return;
      }
      
      $scope.browser.busyListingPage = true;
      $scope.browser.loadingMore = true;
      page += 1;
      offset = limit * page;

      ProjectService.list({offset: offset, limit: limit}).then(function (projects) {  
        //This is making a listing call and adding it to the existing Project list
        $scope.data.projects = $scope.data.projects.concat(_.map(projects, 
          function (p) { p.href = $state.href('projects.view', { projectId: p.uuid }); return p; }));  
        $scope.browser.busyListingPage = false;
      });

      $scope.browser.loadingMore = false;

      if ($scope.data.projects.length < offset) {
        $scope.browser.reachedEnd = true;
      } 
    };
  }

  export function ProjectViewCtrl($scope, $state, Django, ProjectService, ProjectEntitiesService, DataBrowserService, projectId, FileListing, $uibModal, $q, $http, $interval) {
    'ngInject';

    $scope.data = ProjectService.data;
    $scope.state = DataBrowserService.state();
    $scope.ui = {};

    function setEntitiesRel(resp){
      $scope.data.project.appendEntitiesRel(resp);
      return resp;
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
      ProjectService.manageExperiments({'experiments': experiments, 'project': $scope.data.project});
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
        checkPrjModel(proj.coordinatoroutput_set, 'hybridSimulations', proj.hybridsimulation_set, 'hybrid simulation coordinator output', 'coordinator output');
        checkPrjModel(proj.expsubstructure_set, 'hybridSimulations', proj.hybridsimulation_set, 'hybrid simulation', 'experimental substructure');
        checkPrjModel(proj.expoutput_set, 'hybridSimulations', proj.hybridsimulation_set, 'hybrid simulation experiment output', 'experimental output');
        checkPrjModel(proj.simsubstructure_set, 'hybridSimulations', proj.hybridsimulation_set, 'hybrid simulation', 'simulation substructure');
        checkPrjModel(proj.simoutput_set, 'hybridSimulations', proj.hybridsimulation_set, 'hybrid simulation simulation output', 'simulation output');
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
        var expSubstructure = pub.exp_substructures;
        var cordOutput = pub.coordinator_outputs;
        var expOutput = pub.exp_outputs;

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
            //coordinator output
            if (cordOutput === undefined) {
              checklist['hybridSimulations'+i].coordinator_output = false;
            } else {
              fillChecklist(cordOutput, 'hybridSimulations', 'coordinator_output', exp, i);
            }
            //exp substructure
            if (expSubstructure === undefined) {
              checklist['hybridSimulations'+i].experiment_substructure = false;
            } else {
              fillChecklist(expSubstructure, 'hybridSimulations', 'experiment_substructure', exp, i);
            }
            //exp output
            if (expOutput === undefined) {
              checklist['hybridSimulations'+i].experiment_output = false;
            } else {
              fillChecklist(expOutput, 'hybridSimulations', 'experiment_output', exp, i);
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

  export function ProjectDataCtrl($scope, $rootScope, $state, Django, ProjectService, DataBrowserService, projectId, filePath, projectTitle, FileListing, UserService, $uibModal, $http, $q) {
    'ngInject';
    DataBrowserService.apiParams.fileMgr = 'agave';
    DataBrowserService.apiParams.baseUrl = '/api/agave/files';
    DataBrowserService.apiParams.searchState = 'projects.view.data';
    $scope.data = ProjectService.data;
    $scope.browser = DataBrowserService.state();
    $scope.browser.listings = {};
    $scope.browser.ui = {};
    $scope.browser.publication = {experimentsList: [], eventsList: [],
                                  users: [], analysisList: [], reportsList: [],
                                  filesSelected: {}};
    if (typeof $scope.browser !== 'undefined'){
      $scope.browser.busy = true;
    }

    $scope.browser.projectServicePromise.then(function() {
    DataBrowserService.browse({system: 'project-' + projectId, path: filePath}, 
                              {'query_string': $state.params.query_string})
      .then(function () {
        $scope.browser = DataBrowserService.state();
        DataBrowserService.projectBreadcrumbSubject.next()
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
    })
    
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
      usernames = _.uniq(usernames);
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
            var users = [$scope.browser.project.value.pi]
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
      $scope.browser.publication[attrName] = _.uniq($scope.browser.publication[attrName], function(e){return e.uuid;});
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
      ProjectService.editProject($scope.browser.project);
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
        if (ent instanceof Array) {
          if (ent.length < 1) {
            return true;
          } else {
            return false;
          }
        }
        if (ent instanceof Object) {
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

      selectAllHybridSimFiles : function(ent){
        var listing = {};

        // show inputs selected
        _.each($scope.browser.project.coordinator_set, function (set) {
          if (set.associationIds.includes(ent.uuid)) {
            listing[set.uuid] = $scope.browser.listings[set.uuid];
            // add inputs
            _addToSimLists(set);
          }
        });
        // show substructure selected
        _.each($scope.browser.project.simsubstructure_set, function (set) {
          if (set.associationIds.includes(ent.uuid)) {
            listing[set.uuid] = $scope.browser.listings[set.uuid];
            // add outputs
            _addToSimLists(set);
          }
        });
        // show substructure selected
        _.each($scope.browser.project.expsubstructure_set, function (set) {
          if (set.associationIds.includes(ent.uuid)) {
            listing[set.uuid] = $scope.browser.listings[set.uuid];
            // add outputs
            _addToSimLists(set);
          }
        });
        // show coordinator outputs selected
        _.each($scope.browser.project.coordinatoroutput_set, function (set) {
          if (set.associationIds.includes(ent.uuid)) {
            listing[set.uuid] = $scope.browser.listings[set.uuid];
            // add outputs
            _addToSimLists(set);
          }
        });
        // show simulation outputs selected
        _.each($scope.browser.project.simoutput_set, function (set) {
          if (set.associationIds.includes(ent.uuid)) {
            listing[set.uuid] = $scope.browser.listings[set.uuid];
            // add outputs
            _addToSimLists(set);
          }
        });
        // show experimental outputs selected
        _.each($scope.browser.project.expoutput_set, function (set) {
          if (set.associationIds.includes(ent.uuid)) {
            listing[set.uuid] = $scope.browser.listings[set.uuid];
            // add outputs
            _addToSimLists(set);
          }
        });

        // show global_model selected
        _.each($scope.browser.project.globalmodel_set, function (set) {
          if (set.associationIds.includes(ent.uuid)) {
            listing[set.uuid] = $scope.browser.listings[set.uuid];
            // add outputs
            _addToSimLists(set);
          }
        });

        // add model
        _addToSimLists(ent);
        
        // show model/report/analysis selected
        if (ent._displayName == "Report" || ent._displayName == "Analysis") {
          listing[ent.uuid] = $scope.browser.listings[ent.uuid];
        }

        // if there are already selected files do not deselect them when selecting more
        if (Object.keys($scope.browser.publication.filesSelected).length === 0) {
          $scope.browser.publication.filesSelected = listing;
        } else {
          _.map(listing, function(i){
            Object.assign($scope.browser.publication.filesSelected, listing);
          });
        }
      },

      selectAllSimFiles : function(ent){
        var listing = {};

        // show inputs selected
        _.each($scope.browser.project.input_set, function (set) {
          if (set.value.modelConfigs.includes(ent.uuid)) {
            listing[set.uuid] = $scope.browser.listings[set.uuid];
            // add inputs
            _addToSimLists(set);
          }
        });
        // show outputs selected
        _.each($scope.browser.project.output_set, function (set) {
          if (set.value.modelConfigs.includes(ent.uuid)) {
            listing[set.uuid] = $scope.browser.listings[set.uuid];
            // add outputs
            _addToSimLists(set);
          }
        });

        // add model
        _addToSimLists(ent);
        
        // show model/report/analysis selected
        if (ent._displayName == "Model" || ent._displayName == "Report" || ent._displayName == "Analysis") {
          listing[ent.uuid] = $scope.browser.listings[ent.uuid];
        }

        // if there are already selected files do not deselect them when selecting more
        if (Object.keys($scope.browser.publication.filesSelected).length === 0) {
          $scope.browser.publication.filesSelected = listing;
        } else {
          _.map(listing, function(i){
            Object.assign($scope.browser.publication.filesSelected, listing);
          });
        }
      },

      selectFileForHybridSimPublication : function(ent, file, sim){
        if (typeof $scope.browser.publication.filesSelected[ent.uuid] === 'undefined'){
          $scope.browser.publication.filesSelected[ent.uuid] = [];
        }
        // include simulation when adding a file associated with a model
        if (ent._displayName == "Global Model"){
          _addToSimLists(sim);
        }
        // show file as selected
        $scope.browser.publication.filesSelected[ent.uuid].push(file);
        _addToSimLists(ent);
      },

      selectFileForSimPublication : function(ent, file, sim){
        if (typeof $scope.browser.publication.filesSelected[ent.uuid] === 'undefined'){
          $scope.browser.publication.filesSelected[ent.uuid] = [];
        }
        // include simulation when adding a file associated with a model
        if (ent._displayName == "Model"){
          _addToSimLists(sim);
        }
        // show file as selected
        $scope.browser.publication.filesSelected[ent.uuid].push(file);
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
          _.each($scope.browser.project.input_set, function (set) {
            if (set.value.modelConfigs.includes(ent.uuid)) {
              delete $scope.browser.publication.filesSelected[set.uuid];
              _removeFromSimLists(set);
            }
          });
          _.each($scope.browser.project.output_set, function (set) {
            if (set.value.modelConfigs.includes(ent.uuid)) {
              delete $scope.browser.publication.filesSelected[set.uuid];
              _removeFromSimLists(set);
            }
          });
          delete $scope.browser.publication.filesSelected[ent.uuid];
        }
        _removeFromSimLists(ent);
      },

      deselectAllHybridSimFiles : function(ent){
        if ($scope.browser.publication.filesSelected[ent.uuid] !== 'undefined'){
          _.each($scope.browser.project.coordinator_set, function (set) {
            if (set.associationIds.includes(ent.uuid)) {
              delete $scope.browser.publication.filesSelected[set.uuid];
              _removeFromSimLists(set);
            }
          });
          _.each($scope.browser.project.simsubstructure_set, function (set) {
            if (set.associationIds.includes(ent.uuid)) {
              delete $scope.browser.publication.filesSelected[set.uuid];
              _removeFromSimLists(set);
            }
          });
          _.each($scope.browser.project.expsubstructure_set, function (set) {
            if (set.associationIds.includes(ent.uuid)) {
              delete $scope.browser.publication.filesSelected[set.uuid];
              _removeFromSimLists(set);
            }
          });
          _.each($scope.browser.project.coordinatoroutput_set, function (set) {
            if (set.associationIds.includes(ent.uuid)) {
              delete $scope.browser.publication.filesSelected[set.uuid];
              _removeFromSimLists(set);
            }
          });
          _.each($scope.browser.project.simoutput_set, function (set) {
            if (set.associationIds.includes(ent.uuid)) {
              delete $scope.browser.publication.filesSelected[set.uuid];
              _removeFromSimLists(set);
            }
          });
          _.each($scope.browser.project.expoutput_set, function (set) {
            if (set.associationIds.includes(ent.uuid)) {
              delete $scope.browser.publication.filesSelected[set.uuid];
              _removeFromSimLists(set);
            }
          });
          delete $scope.browser.publication.filesSelected[ent.uuid];
        }
        _removeFromSimLists(ent);
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

      deselectFileForSimPublication : function(ent, file, sim){
        if (ent._displayName == "Model"){
          _removeFromSimLists(sim);
        }
        delete $scope.browser.publication.filesSelected[ent.uuid];
        _removeFromSimLists(ent);
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

      filterHybridSimulations : function(simulations){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
          return simulations;
        } else {
          return $scope.browser.publication.hybrid_simulations;
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

      filterGlobalModels : function(models, simulation){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
          return models;
        } else {
          return _.filter($scope.browser.publication.global_models,
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

      filterHybridSimAnalysis : function(analysis){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
          return _.filter(analysis, function(anl){
            return !anl.value.hybridSimulations.length;
          });
        } else {
          return _.filter($scope.browser.publication.analysiss, function(anl){
            return !anl.value.hybridSimulations.length;
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

      filterHybridSimReports : function(reports){
        if(!$scope.browser.publishPipeline || $scope.browser.publishPipeline === 'select'){
          return _.filter(reports, function(rpt){
            return !rpt.value.hybridSimulations.length;
          });
        } else {
          return _.filter($scope.browser.publication.reports, function(rpt){
            return !rpt.value.hybridSimulations.length;
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
  }

  export function ProjectSearchCtrl($scope, $state, Django, DataBrowserService) {

    $scope.browser = DataBrowserService.state();
    $scope.searchState = DataBrowserService.apiParams.searchState;

    if (! $scope.browser.error) {
      $scope.browser.listing.href = $state.href('myData', {
        system: $scope.browser.listing.system,
        filePath: $scope.browser.listing.path
      });
      _.each($scope.browser.listing.children, function (child) {
        child.href = $state.href('projects.view.data', {
          projectId: child.system.slice(8),
          filePath: child.path,
          //projectTitle: projectTitle
        });
        child.project_href = $state.href('projects.view', {
          projectId: child.system.slice(8),
        });
      });
    }

    $scope.data = ProjectService.data
    $scope.data.user = Django.user

    $scope.projSearch = true

    $scope.scrollToTop = function(){
      DataBrowserService.scrollToTop();
    };
    $scope.scrollToBottom = function(){
      DataBrowserService.scrollToBottom();
    };

    $scope.resolveBreadcrumbHref = function (trailItem) {
      return $state.href('myData', {systemId: $scope.browser.listing.system, filePath: trailItem.path});
    };

    $scope.onBrowseProject = function($event, file) {
      $event.preventDefault();
      $event.stopPropagation();

      $state.go('projects.view.data', {projectId: file.system.slice(8)})
    }

    $scope.onBrowseData = function ($event, file) {
      $event.preventDefault();
      $event.stopPropagation();
      if (typeof(file.type) !== 'undefined' && file.type !== 'dir' && file.type !== 'folder') {
        DataBrowserService.preview(file, $scope.browser.listing);
      } else {
        $state.go('projects.view.data', {projectId: file.system.slice(8), filePath: file.path});
      }
    };

    $scope.onSelect = function($event, file) {
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
      } else {
        DataBrowserService.select([file], true);
      }
    };

    $scope.onDetail = function($event, file) {
      $event.stopPropagation();
      DataBrowserService.preview(file, $scope.browser.listing);
    };

  }
