(function(window, angular, $, _) {
  "use strict";
  angular.module('ApplicationsApp').controller('ApplicationAddCtrl',
    ['$scope', '$rootScope', '$q', '$timeout', '$uibModal', '$translate', '$state', 'Apps', 'SimpleList', 'MultipleList', 'AppsWizard', 'Django', function($scope, $rootScope, $q, $timeout, $uibModal, $translate, $state, Apps, SimpleList, MultipleList, AppsWizard, Django) {

      /******* addForm form *********/
      $scope.addSchema = {
        "type": "object",
        "title": "Other app form",
        "properties": {
          "select": {
            "title": "Select application type to add",
            "type": "string",
            "enum": [
              "Agave",
              "Custom",
            ]
          }
        }
      };

      $scope.addForm = [
        {
          "key": "select",
        }
      ];

      $scope.addModel = {};
      /****** end addForm ******/

      /****** customForm *********/
      $scope.customSchema = {
        "type": "object",
        "title": "Interactive registration form for DesignSafe Application",
        "properties": {
            "label": {
                "type": "string",
                "description": "The name of the application. The name does not have to be unique, but the combination of name and version does",
                "title": "Name",
                "minLength": 3,
                "maxLength": 64
            },
            "version": {
                "type": "string",
                "description": "The version of the application in #.#.# format. While the version does not need to be unique, the combination of name and version does have to be unique",
                "title": "Version",
                "validator": "\\d+(\\.\\d+)+",
                "minLength": 3,
                "maxLength": 16
            },
            "type": {
              "title": "Select application type",
              "type": "string",
              "enum": [
                "html"
              ],
              "default": "html",
              "readonly": true
            },
            "shortDescription": {
                "type": "string",
                "description": "Short description of this app",
                "maxLength": 128,
                "title": "Short description"
            },
            "isPublic": {
              "title": "Public",
              "type": "string",
              "enum": [
                false,
                true
              ],
              "default": false,
              "readonly": true
            },
            "html": {
                "type": "string",
                "description": "Custom HTML for your app",
                "title": "HTML",
            },

        }
      };
      $scope.customForm = [
        {
          "key": "label",
          ngModelOptions: {
            updateOnDefault: true
          },
          $validators: {
            required: function(value) {
              return value ? true : false;
            },
            // invalidCharacters: function(value) {
            //   var patt = /^[a-zA-Z0-9_]+$/;
            //   if (!patt.test(value)){
            //     return false
            //   }
            //   return true;
            // },
          },
          validationMessage: {
            "required": "Missing required",
            // "invalidCharacters": "Invalid parameter id. Parameters must be alphanumeric strings with no spaces and may include underscores"
          },
        },
        {
          "key": "version",
          $validators: {
            required: function(value) {
              return value ? true : false;
            },
            invalidCharacters: function(value) {
              var patt = /^\d+(.\d+)+$/;
              if (!patt.test(value)){
                return false
              }
              return true;
            },
          },
          validationMessage: {
            "required": "Missing required",
            "invalidCharacters": "Invalid version format. Should be #.#.#"
          },
        },
        "type",
        "shortDescription",
        "isPublic",
        {
          "key": "html",
          "type": "codemirror",
          "codemirrorOptions": {
            "lineWrapping" : true,
            "lineNumbers": true,
            "matchBrackets": true,
            "styleActiveLine": false,
            "theme": "neat",
            "mode": "html",
            "statementIndent": 2,
          },
          $validators: {
            required: function(value) {
              return value ? true : false;
            }
          },
          validationMessage: {
            "required": "Missing required"
          },
        }
      ];
      $scope.customModel = {};
      /****** end customForm *****/


      /******** Agave form ********/
      $scope.schema = {
          "type": "object",
          "title": "Interactive registration form for DesignSafe Agave Application",
          "properties": {
              "name": {
                  "type": "string",
                  "description": "The name of the application. The name does not have to be unique, but the combination of name and version does",
                  "title": "Name",
                  "validator": "[a-zA-Z_\\-\\.]+",
                  "minLength": 3,
                  "maxLength": 64
              },
              "version": {
                  "type": "string",
                  "description": "The version of the application in #.#.# format. While the version does not need to be unique, the combination of name and version does have to be unique",
                  "title": "Version",
                  "validator": "\\d+(\\.\\d+)+",
                  "minLength": 3,
                  "maxLength": 16
              },
              "helpURI": {
                  "type": "string",
                  "description": "The URL where users can go for more information about the app",
                  "format": "url",
                  "title": "Help URL",
                  // "validator": "(http|https)://[\\w-]+(\\.[\\w-]*)+([\\w.,@?^=%&amp;:/~+#-]*[\\w@?^=%&amp;/~+#-])?"
              },
              "label": {
                  "type": "string",
                  "description": "Label for use in forms generated by the jobs service",
                  "title": "Label"
              },
              "icon": {
                  "type": "string",
                  "description": "The icon url to associate with this app",
                  "title": "Icon",
                  "validator": "(http|https)://[\\w-]+(\\.[\\w-]*)+([\\w.,@?^=%&amp;:/~+#-]*[\\w@?^=%&amp;/~+#-])?"
              },
              "shortDescription": {
                  "type": "string",
                  "description": "Short description of this app",
                  "maxLength": 128,
                  "title": "Short description"
              },
              "longDescription": {
                  "type": "string",
                  "description": "Full description of this app",
                  "maxLength": 32768,
                  "title": "Long description"
              },
              "defaultQueue": {
                  "type": [null,"string"],
                  "description": "Default queue to use when submitting this job if none is provided in the job request. Can be left blank and a queue will be determined at run time",
                  "maxLength": 128,
                  "title": "Default queue"
              },
              "defaultNodeCount": {
                  "type": "integer",
                  "description": "Default number of nodes to be used when running this app if no node count is given in the job request",
                  "maxLength": 12,
                  "minimum": 0,
                  "exclusiveMinimum": true,
                  "title": "Default node count",
                  "x-schema-form": {
                      "type": "number",
                      "placeholder": 1
                  }
              },
              "defaultMemoryPerNode": {
                  "type": "number",
                  "description": "Default memory in GB to be used when running this app if no memory is given in the job request",
                  "maxLength": 9,
                  "minimum": 0,
                  "exclusiveMinimum": true,
                  "title": "Default memory (GB)",
                  "x-schema-form": {
                      "type": "number",
                      "placeholder": 4
                  }
              },
              "defaultProcessorsPerNode": {
                  "type": "integer",
                  "description": "Default number of processors per node to be used when running this app if no processor count is given in the job request",
                  "maxLength": 12,
                  "title": "Default processor count",
                  "x-schema-form": {
                      "type": "number",
                      "placeholder": 1
                  }
              },
              "defaultMaxRunTime": {
                "type": "string",
                "description": "Default max run time to be used when running this app if no requested run time is given in the job request",
                "maxLength": 10,
                "title": "Default run time",
                "validator": "^(?:[0-9]{1,3}?[0-9]):[0-5][0-9]:[0-5][0-9]$",
                "x-schema-form": {
                    "type": "input",
                    "placeholder": "24:00:00"
                }
              },
              "ontology": {
                  "type": "array",
                  "description": "An array of ontology values describing this app.",
                  "items": {
                      "type": "string"
                  },
                  "title": "Ontology"
              },
              "executionSystem": {
                  "type": "string",
                  "description": "The ID of the execution system where this app should run.",
                  "items": [],
                  "title": "Execution system"
              },
              "executionType": {
                  "type": "string",
                  "description": "The execution type of the application. If you're unsure, it's probably HPC",
                  "enum": [
                      "CLI", "HPC", "CONDOR"
                  ],
                  "title": "Execution type"
              },
              "parallelism": {
                  "type": "string",
                  "description": "The parallelism type of the application. If you're unsure, it's probably SERIAL",
                  "enum": [
                      "SERIAL",
                      "PARALLEL",
                      "PTHREAD"
                  ],
                  "title": "Parallelism"
              },
              "deploymentPath": {
                  "type": "string",
                  "description": "The path to the folder on the deployment system containing the application wrapper and dependencies",
                  "title": "Deployment path"
              },
              "deploymentSystem": {
                "type": "string",
                "description": "The ID of the storage system where this app's assets should be stored.",
                "items": [],
                "title": "Deployment system"
              },
              "templatePath": {
                  "type": "string",
                  "description": "The path to the wrapper script relative to the deploymentPath",
                  "title": "Wrapper script"
              },
              "testPath": {
                  "type": "string",
                  "description": "The path to the test script relative to the deploymentPath",
                  "title": "Test script"
              },
              "checkpointable": {
                  "type": "boolean",
                  "description": "Does this app support checkpointing?",
                  "title": "Checkpointable"
              },
              "tags": {
                  "type": "array",
                  "description": "Array of terms you may associate with this app",
                  "items": {
                      "type": "string"
                  },
                  "title": "Tags"
              },
              "modules": {
                  "type": "array",
                  "description": "An array of modules to load prior to the execution of the application. This is only relevant when you use the unix Modules or LMOD utilities to manage dependencies on the app execution system",
                  "items": {
                      "type": "string",
                  },
                  "title": "Modules"
              },
              "parameters": {
                  "type": "array",
                  "description": "Non-file inputs supported by this application.",
                  "items": {
                      "type": "object",
                      "title": "Parameter",
                      "properties": {
                          "id": {
                              "type": "string",
                              "maxLength": 256,
                              "minLength": 1,
                              "description": "The unique identifier for this parameter. This will be referenced in the wrapper script",
                              "title": "Parameter ID"
                          },
                          "details": {
                              "type": "object",
                              "description": "Descriptive details about this app parameter used in form generation",
                              "title": "Details",
                              "properties": {
                                  "label": {
                                      "type": "string",
                                      "description": "The label displayed for this parameter",
                                      "title": "Label"
                                  },
                                  "description": {
                                      "type": "string",
                                      "description": "Verbose information on what this parameter does",
                                      "title": "Description",
                                       "default": true
                                  },
                                  "showArgument": {
                                      "type": "boolean",
                                      "description": "Should this command line argument be injected into the submit script preceding the parameter?",
                                      "title": "Prepend command line argument?"
                                  },
                                  "argument": {
                                      "type": "string",
                                      "description": "Name of the command line flag or argument (including dashes) for this parameter",
                                      "title": "Argument value"
                                  },
                                  "repeatArgument": {
                                      "type": "boolean",
                                      "description": "In instances where multiple values are supplied for this parameter, should this command line argument be repeatedly injected into the submit script preceding every instance of the parameter value?",
                                      "title": "Repeat argument for every value?",
                                      "default": false
                                  }
                              }
                          },
                          "semantics": {
                              "type": "object",
                              "description": "Semantic information about the parameter field",
                              "title": "Semantics",
                              "properties": {
                                  "minCardinality": {
                                      "type": "integer",
                                      "description": "Minimum number of instances of this parameter per job",
                                      "title": "Min cardinality",
                                      "default": 0,
                                      "minimum": 0,
                                      "required": false
                                  },
                                  "maxCardinality": {
                                      "title": "Max cardinality",
                                      "type": "integer",
                                      "description": "Max number of instances of this parameter per job",
                                      "default": -1,
                                      "minimum": -1,
                                      "required": false
                                  },
                                  "ontology": {
                                      "title": "Ontology",
                                      "type": "array",
                                      "description": "Array of ontology terms describing this parameter.",
                                      "items": {
                                          "type": "string"
                                      }
                                  }
                              }
                          },
                          "value": {
                              "type": "object",
                              "description": "Default value and validations for the parameter field",
                              "title": "Value",
                              "properties": {
                                  "default": {
                                      "type": ["number", "string"],
                                      "description": "Default value",
                                      "title": "Default value"
                                  },
                                  "type": {
                                      "type": "string",
                                      "description": "The content type of the parameter",
                                      "enum": ["string", "number", "bool", "enumeration", "flag"],
                                      "title": "Parameter type",
                                  },
                                  "validator": {
                                      "type": "string",
                                      "description": "The regular expression used to validate this parameter value",
                                      "title": "Validator regex"
                                  },
                                  "enum_values": {
                                      "type": "array",
                                      "description": "The possible values this parameter accepts. A JSON array of string values should be provided",
                                      "title": "Enumerated values",
                                      "items": {
                                      "type": "string"
                                      }
                                  },
                                  "required": {
                                      "type": "boolean",
                                      "description": "Is this parameter required? If visible is false, this must be true",
                                      "title": "Required",
                                      "default": true
                                  },
                                  "visible": {
                                      "type": "boolean",
                                      "description": "Should this parameter be visible? If not, there must be a default and it will be required",
                                      "title": "Visible",
                                      "default": true
                                  },
                                  "order": {
                                      "type": "integer",
                                      "description": "The order in which this parameter should be printed when generating an execution command for forked execution. This will also be the order in which paramters are returned in the response json",
                                      "title": "Order",
                                  }
                              }
                          }
                      }
                  }
              },
              "inputs": {
                "type": "array",
                "description": "Inputs supported by this application.",
                "items": {
                    "type": "object",
                    "title": "Input",
                    "properties": {
                      "id": {
                        "type": "string",
                        "description": "The unique identifier for this input file. This will be referenced in the wrapper script.",
                        "title": "ID",
                        "valueInLegend": true
                      },
                      "details": {
                        "type": "object",
                        "description": "Descriptive details about this app input used in form generation.",
                        "title": "Details",
                        "properties": {
                            "argument": {
                                "type": "string",
                                "description": "Name of the command line flag or argument (including dashes) for this input.",
                                "title": "Argument value"
                            },
                            "description": {
                                "type": "string",
                                "description": "Verbose information on what this input does.",
                                "title": "Description"
                            },
                            "label": {
                                "type": "string",
                                "description": "The label displayed for this input.",
                                "title": "Label"
                            },
                            "showArgument": {
                                "type": "boolean",
                                "description": "Should this command line argument be injected into the submit script preceding the input?",
                                "title": "Prepend command line argument?",
                                "default": true
                            },
                            "repeatArgument": {
                                "type": "boolean",
                                "description": "In instances where multiple values are supplied for this input, should this command line argument be repeatedly injected into the submit script preceding every instance of the input value?",
                                "title": "Repeat argument for every value?",
                                "default": false
                            }
                        }
                      },
                        "semantics": {
                            "type": "object",
                            "description": "Semantic information about the input field.",
                            "title": "Semantics",
                            "properties": {
                                "fileTypes": {
                                     "type": "array",
                                     "description": "Array of file types required for this input.",
                                     "items": {
                                         "type": "string"
                                     },
                                     "title": "File types"
                                },
                                "minCardinality": {
                                    "type": "integer",
                                    "description": "Minimum number of instances of this input per job.",
                                    "title": "Min cardinality",
                                    "default": 0,
                                    "minimum": 0,
                                    "required": false
                                },
                                "maxCardinality": {
                                    "title": "Max cardinality",
                                    "type": "integer",
                                    "description": "Max number of instances of this input per job.",
                                    "default": -1,
                                    "minimum": -1,
                                    "required": false
                                },
                                "ontology": {
                                    "title": "Ontology",
                                    "type": "array",
                                    "description": "Array of ontology terms describing this input.",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        },
                        "value": {
                            "type": "object",
                            "description": "Default value and validations for the parameter field.",
                            "title": "Value",
                            "properties": {
                                "default": {
                                    "type": ["number","string"],
                                    "description": "Default value",
                                    "title": "Default value"
                                },
                                "order": {
                                    "type": "integer",
                                    "description": "The order in which this parameter should be printed when generating an execution command for forked execution. This will also be the order in which paramters are returned in the response json.",
                                    "title": "Order",
                                },
                                "validator": {
                                    "type": "string",
                                    "description": "The regular expression used to validate this parameter value.",
                                    "title": "Validator regex"
                                },
                                "required": {
                                    "type": "boolean",
                                    "description": "Is this parameter required? If visible is false, this must be true.",
                                    "title": "Required",
                                    "default": true
                                },
                                "visible": {
                                    "type": "boolean",
                                    "description": "Should this parameter be visible? If not, there must be a default and it will be required.",
                                    "title": "Visible",
                                    "default": true
                                },
                                "enquote": {
                                    "type": "boolean",
                                    "description": "Should this value be double quoted prior to injection in the wrapper template.",
                                    "title": "Visible",
                                    "default": true,
                                    "required": true
                                }
                            }
                        }
                    }
                }
            }
          }
      };

      $scope.form = [
        {
          "type": "wizard",
          "legend": "General Info",
          "tabs": [
              {
                  "title": "Basics",
                  "items": [
                      {
                        "key": "name",
                        ngModelOptions: {
                            updateOnDefault: true
                        },
                        required: function(value) {
                          return value ? true : false;
                        },
                        invalidCharacters: function(value) {
                          var patt = /^[a-zA-Z0-9_]+$/;
                          if (!patt.test(value)){
                            return false
                          }
                          return true;
                        },
                        validationMessage: {
                          "required": "Missing required",
                          "invalidCharacters": "Invalid parameter id. Parameters must be alphanumeric strings with no spaces and may include underscores"
                        },
                      },
                      {
                        "key": "version",
                        ngModelOptions: {
                            updateOnDefault: true
                        },
                        $validators: {
                          required: function(value) {
                            return value ? true : false;
                          },
                          invalidCharacters: function(value) {
                            var patt = /^\d+(.\d+)+$/;
                            if (!patt.test(value)){
                              return false
                            }
                            return true;
                          },
                        },
                        validationMessage: {
                          "required": "Missing required",
                          "invalidCharacters": "Invalid version format. Should be #.#.#"
                        }
                      },
                      "label",
                      "shortDescription",
                      "longDescription",
                      {
                          "key": "tags",
                          "placeholder": "One or more tags",
                          "options": {
                              "tagging": true,
                              "taggingLabel": '(new)',
                              "taggingTokens": 'SPACE|ENTER|,'
                          }
                      },
                      {
                        "key": "helpURI",
                        "title": "Help URL",
                        "description": "The URL where users can go for more information about the app",
                        // ngModelOptions: {
                        //     updateOnDefault: true
                        // },
                        // $validators: {
                        //   invalidCharacters: function(value) {
                        //     var patt = /^(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?$/;
                        //     if (!patt.test(value)){
                        //       return false
                        //     }
                        //     return true;
                        //   },
                        // },
                        // validationMessage: {
                        //   "invalidCharacters": "Invalid URI"
                        // }
                      },
                      {
                          "key": 'ontology',
                          "placeholder": 'Semantic terms',
                          "startEmpty": true
                      }
                  ]
              },
              {
                  "title": "Dependencies",
                  "items": [
                      {
                        "key": "deploymentPath",
                        "type": "template",
                        "template": '<div class="form-group has-success has-feedback"><label for="input" class="control-label">{{form.title}}</label><div class="input-group"><input type="text" class="form-control" id="input" ng-model="model.deploymentPath" ng-change="form.validate(form)"><a href="#" class="input-group-addon" ng-click="form.validatePath($event, form)"><span ng-show="form.requesting"><i class="fa fa-circle-o-notch fa-spin"></i></span><span ng-show="!form.requesting">Check File</span></a></div> <span class="help-block">{{form.description}}</span></div>',
                        validate: function(form){
                          if (!$scope.model.deploymentPath){
                            form.description = 'Missing required'
                          }
                        },
                        validatePath: function(event, form){
                          event.preventDefault();
                          event.stopPropagation();
                          if (typeof $scope.model.deploymentSystem === 'undefined' || $scope.model.deploymentSystem === ''){
                            var filePath = $scope.model.deploymentPath;
                            form.description = $scope.model.deploymentSystem + '/' + filePath + ' is not a valid path. Please verify that you have chosen a proper Deployment system and file path. You can check the data browser and make sure it exists and you have permissions to it';
                          } else {
                            var filePath = $scope.model.deploymentPath;
                            form.requesting = true;
                            Apps.getFile($scope.model.deploymentSystem, $scope.model.deploymentPath)
                            .then(
                              function(response){
                                form.description = $scope.model.deploymentSystem + '/' + filePath + ' is valid';
                                form.requesting = false;
                              },
                              function(response){
                                form.description = $scope.model.deploymentSystem + '/' + filePath + ' is not a valid path. Please verify that you have chosen a proper Deployment system and file path. You can check the data browser and make sure it exists and you have permissions to it';
                                form.requesting = false;
                              }
                            );
                          }
                        },
                        ngModelOptions: {
                          updateOnDefault: true
                        }
                      },
                      {
                          "key": "deploymentSystem",
                          "placeholder": "designsafe.storage.default",
                          "type": "select",
                          "titleMap": [],
                          ngModelOptions: {
                              updateOnDefault: true
                          },
                          $validators: {
                            required: function(value) {
                              return value ? true : false;
                            }
                          },
                          validationMessage: {
                            'required': 'Missing required'
                          }
                      },
                      {
                        "key": "templatePath",
                        "type": "template",
                        "template": '<div class="form-group has-success has-feedback"><label for="input" class="control-label">{{form.title}}</label><div class="input-group"><input type="text" class="form-control" id="input" ng-model="model.templatePath" ng-change="form.validate(form)"><a href="#" class="input-group-addon" ng-click="form.validatePath($event, form)"><span ng-show="form.requesting"><i class="fa fa-circle-o-notch fa-spin"></i></span><span ng-show="!form.requesting">Check File</span></a></div> <span class="help-block">{{form.description}}</span></div>',
                        validate: function(form){
                          if (!$scope.model.templatePath){
                            form.description = 'Missing required'
                          }
                        },
                        validatePath: function(event, form){
                          event.preventDefault();
                          event.stopPropagation();
                          if (
                            (typeof $scope.model.deploymentSystem === 'undefined' || $scope.model.deploymentSystem === '') &&
                            (typeof $scope.model.deploymentPath === 'undefined' || $scope.model.deploymentPath === '')
                          ){
                            var filePath = $scope.model.deploymentPath + '/' + $scope.model.templatePath;
                            form.description = $scope.model.deploymentSystem + '/' + filePath + ' is not a valid path. Please check data browser and make sure it exists and you have permissions to it';
                          } else {
                            var filePath = $scope.model.deploymentPath + '/' + $scope.model.templatePath;
                            form.requesting = true;
                            Apps.getFile($scope.model.deploymentSystem, filePath)
                            .then(
                              function(response){
                                form.description = $scope.model.deploymentSystem + '/' + filePath + ' is valid';
                                form.requesting = false;
                              },
                              function(response){
                                form.description = $scope.model.deploymentSystem + '/' + filePath + ' is not a valid path. Please check data browser and make sure it exists and you have permissions to it';
                                form.requesting = false;
                              }
                            );
                          }
                        }
                      },
                      {
                        "key": "testPath",
                        "type": "template",
                        "template": '<div class="form-group has-success has-feedback"><label for="input" class="control-label">{{form.title}}</label><div class="input-group"><input type="text" class="form-control" id="input" ng-model="model.testPath" ng-change="form.validate(form)"><a href="#" class="input-group-addon" ng-click="form.validatePath($event, form)"><span ng-show="form.requesting"><i class="fa fa-circle-o-notch fa-spin"></i></span><span ng-show="!form.requesting">Check File</span></a></div> <span class="help-block">{{form.description}}</span></div>',
                        validate: function(form){
                          if (!$scope.model.testPath){
                            form.description = 'Missing required'
                          }
                        },
                        validatePath: function(event, form){
                          event.preventDefault();
                          event.stopPropagation();
                          if (
                            (typeof $scope.model.deploymentSystem === 'undefined' || $scope.model.deploymentSystem === '') &&
                            (typeof $scope.model.deploymentPath === 'undefined' || $scope.model.deploymentPath === '')
                          ){
                            var filePath = $scope.model.deploymentPath + '/' + $scope.model.testPath;
                            form.description = $scope.model.deploymentSystem + '/' + filePath + ' is not a valid path. Please check data browser and make sure it exists and you have permissions to it';
                          } else {
                            var filePath = $scope.model.deploymentPath + '/' + $scope.model.testPath;
                            form.requesting = true;
                            Apps.getFile($scope.model.deploymentSystem, filePath)
                            .then(
                              function(response){
                                form.description = $scope.model.deploymentSystem + '/' + filePath + ' is valid';
                                form.requesting = false;
                              },
                              function(response){
                                form.description = $scope.model.deploymentSystem + '/' + filePath + ' is not a valid path. Please check data browser and make sure it exists and you have permissions to it';
                                form.requesting = false;
                              }
                            );
                          }
                        }
                      },
                      {
                          "key": 'modules',
                          "startEmpty": true,
                          "placeholder": 'Module command(s)',
                          "title": "Modules",
                          "options": {
                              "tagging": '',
                              "taggingLabel": '(new)',
                              "taggingTokens": ',|ENTER|,'
                          },
                          ngModelOptions: {
                              updateOnDefault: true
                          }
                      }
                  ]
              },
              {
                  "title": "Environment",
                  "items": [
                      {
                          "key": "executionType",
                          ngModelOptions: {
                              updateOnDefault: true
                          },
                          $validators: {
                            required: function(value) {
                              return value ? true : false;
                            }
                          },
                          validationMessage: {
                            'required': 'Missing required'
                          }
                      },
                      {
                          "key": "executionSystem",
                          "type": "select",
                          "titleMap": [],
                          onChange: function (value, form) {
                            Apps.getSystems(value, '', 'EXECUTION')
                              .then(
                                function(response){
                                  $scope.form[0].tabs[2].items[2].titleMap = [];
                                  angular.forEach(response.data.queues, function (queue, key) {
                                    $scope.form[0].tabs[2].items[2].titleMap.push({
                                      "value": queue.name,
                                      "name": queue.name
                                    });
                                  });
                                  },
                                function(response){
                                  // error
                                }
                              );
                          },
                          ngModelOptions: {
                              updateOnDefault: true
                          },
                          $validators: {
                            required: function(value) {
                              return value ? true : false;
                            }
                          },
                          validationMessage: {
                            'required': 'Missing required'
                          }
                      },
                      {
                          "key": "defaultQueue",
                          "title": "Default queue",
                          "description": "Default queue to use when submitting this job if none is provided in the job request. Can be left blank and a queue will be determined at run time",
                          "type": "select",
                          "condition": "model.executionSystem !== ''",
                          ngModelOptions: {
                              updateOnDefault: true
                          },
                          titleMap: []
                      },
                      "defaultNodeCount",
                      "defaultMemoryPerNode",
                      "defaultProcessorsPerNode",
                      "defaultMaxRunTime",
                      {
                          "key": "parallelism",
                          "type": "select",
                          ngModelOptions: {
                              updateOnDefault: true
                          },
                      },
                      {
                          "key": "checkpointable",
                          "type": "radiobuttons",
                          "style": {
                              "selected": "btn-success",
                              "unselected": "btn-default"
                          },
                          "titleMap": [
                              {value: true, name: "True"},
                              {value: false, name: "False"}
                          ],
                          ngModelOptions: {
                              updateOnDefault: true
                          },
                      }
                  ]
              },
              {
                  "title": "Parameters",
                  "items": [
                      {
                          "type": "tabarray",
                          "title": "{{value.id || ('Parameter ' + $index)}}",
                          "tabType": "top",
                          "key": "parameters",
                          //remove: "Delete",
                          "style": {
                              remove: "btn-danger"
                          },
                          "add": "Add parameter",
                          "items": [
                              {
                                  key: "parameters[].id",
                                  ngModelOptions: {
                                      updateOnDefault: true
                                  },
                                  ngModel: function(ngModel) {
                                      ngModel.$validators.myMail = function(value) {
                                          var exp = /[a-zA-Z0-9_]+/.exec(value);
                                          if (!exp) {
                                              return false;
                                          }
                                          return true;
                                      };
                                  },
                                  validationMessage: {
                                      'invalidCharacters': "Invalid parameter id. Parameters must be alphanumeric strings and may include underscores."
                                  }
                              },
                              {
                                  "key": "parameters[].details",
                                  "type": "fieldset",
                                  "title": "Details",
                                  "description": "Descriptive details about this app parameter used in form generation.",
                                  "items": [
                                      "parameters[].details.label",
                                      // "parameters[].details.description",
                                      {
                                          "key": "parameters[].details.showArgument",
                                          "type": "radiobuttons",
                                          // ngModelOptions: { updateOn: 'click' },
                                          ngModelOptions: {
                                              updateOnDefault: true
                                          },
                                          "style": {
                                              "selected": "btn-success",
                                              "unselected": "btn-default"
                                          },
                                          "titleMap": [
                                              {"value": true, "name": "True"},
                                              {"value": false, "name": "False"}
                                          ]
                                      },
                                      {
                                          "key": "parameters[].details.argument",
                                          "condition": "model.parameters[arrayIndex].details.showArgument",
                                          "title": "Command line argument"
                                      },
                                      {
                                          "key": "parameters[].details.repeatArgument",
                                          "type": "radiobuttons",
                                          // ngModelOptions: { updateOn: 'click' },
                                          "condition": "model.parameters[arrayIndex].details.showArgument",
                                          "style": {
                                              "selected": "btn-success",
                                              "unselected": "btn-default"
                                          },
                                          "titleMap": [
                                              {"value": true, "name": "True"},
                                              {"value": false, "name": "False"}
                                          ],
                                          ngModelOptions: {
                                              updateOnDefault: true
                                          }
                                      }
                                  ]
                              },
                              {
                                  "key": "parameters[].semantics",
                                  "type": "fieldset",
                                  "title": "Semantics",
                                  "description": "Semantic information about the parameter field.",
                                  "items": [
                                      {
                                        "key": "parameters[].semantics.ontology",
                                        "startEmpty": true,
                                      },
                                      {
                                          "key": "parameters[].semantics.minCardinality",
                                          "type": "number",
                                          ngModelOptions: {
                                              updateOnDefault: true
                                          },
                                          validationMessage: {
                                              'minLessThanMax': 'Minimum number of values allowed by this parameter must be a non-negative integer value less than or equal to the maximum number of values.',
                                              'gtzeroWhenRequired': 'Minimum number of values allowed by this parameter must be greater than zero when required.',
                                          },
                                          $validators: {
                                              minLessThanMax: function (value) {
                                                if (typeof $scope.model.parameteres !== 'undefined'){
                                                  if ($scope.model.parameters.length > 0 && typeof arrayIndex !== 'undefined'){
                                                    if (value && $scope.model.parameters[arrayIndex].semantics.maxCardinality > 0 &&
                                                        value > $scope.model.parameters[arrayIndex].semantics.maxCardinality) {
                                                        return false;
                                                    }
                                                  }
                                                }
                                                return true;
                                              },
                                              gtzeroWhenRequired: function (value) {
                                                if (typeof $scope.model.parameteres !== 'undefined'){
                                                  if ($scope.model.parameters.length > 0 && typeof arrayIndex !== 'undefined'){
                                                    if (value && $scope.model.parameters[arrayIndex].semantics.maxCardinality > 0 &&
                                                        value > $scope.model.parameters[arrayIndex].semantics.maxCardinality) {
                                                        return false;
                                                    }
                                                  }
                                                }
                                                return true;
                                              }
                                          },
                                      },
                                      {
                                          "key": "parameters[].semantics.maxCardinality",
                                          "type": "number",
                                          ngModelOptions: {
                                              updateOnDefault: true
                                          },
                                          validationMessage: {
                                              "maxGreaterThanMax": "Maximum number of values allowed by this parameter must be a non-negative integer value less than or equal to the maximum number of values",
                                              "oneWhenBoolish": "Maximum number of values is one when parameter is of type bool or flag",
                                          },
                                          $validators: {
                                              minLessThanMax: function (value) {
                                                  if (typeof $scope.model.parameters !== 'undefined'){
                                                    if ($scope.model.parameters.length > 0 && typeof arrayIndex !== 'undefined'){
                                                      if (value && $scope.model.parameters[arrayIndex].semantics.maxCardinality > 0 &&
                                                          value > $scope.model.parameters[arrayIndex].semantics.maxCardinality) {
                                                          return false;
                                                      }
                                                    }
                                                  }

                                                  return true;
                                              },
                                              oneWhenBoolish: function (value) {
                                                if (typeof $scope.model.parameters !== 'undefined'){
                                                  if ($scope.model.parameters.length > 0 && typeof arrayIndex !== 'undefined'){
                                                    if (value && ($scope.model.parameters[arrayIndex].value.type == 'bool' ||
                                                        $scope.model.parameters[arrayIndex].value.type == 'flag') &&
                                                        $scope.model.parameters[arrayIndex].semantics.maxCardinality > 1) {
                                                        return false;
                                                    }
                                                  }
                                                }
                                                return true;
                                              }
                                          }
                                      }
                                  ]
                              },
                              {
                                  "key": "parameters[].value",
                                  "type": "fieldset",
                                  "title": "Values",
                                  "description": "Default value and validations for the parameter field.",
                                  "items": [
                                      {
                                          "key": "parameters[].value.type",
                                          "type": "select",

                                      },
                                      {
                                          "key": "parameters[].value.default",
                                          "description": "Default value",
                                          "title": "Default value"
                                      },
                                      {
                                          "key": "parameters[].value.validator",
                                          "condition": "[string,number].indexOf(model.parameters[arrayIndex].value.type) !== -1",
                                          ngModelOptions: {
                                              updateOnDefault: true
                                          }
                                      },
                                      {
                                          "key": "parameters[].value.enum_values",
                                          "condition": "model.parameters[arrayIndex].value.type === 'enum'",
                                          ngModelOptions: {
                                              updateOnDefault: true
                                          },
                                          validationMessage: {
                                              'enumNotSupported': 'Enumerated values are only supported for parameters of type enum.',
                                          },
                                          $validators: {
                                              enumNotSupported: function (value) {
                                                  return (value && $scope.model.parameters[arrayIndex].value.type === 'enum');
                                              },
                                          }
                                      },
                                      {
                                        "key": "parameters[].value.visible",
                                        "type": "radiobuttons",
                                        "style": {
                                            "selected": "btn-success",
                                            "unselected": "btn-default"
                                        },
                                        "titleMap": [
                                            {"value": true, "name": "Yes"},
                                            {"value": false, "name": "No"}
                                        ],
                                        ngModelOptions: {
                                            updateOnDefault: true
                                        },
                                        onChange: function (modelValue, form) {
                                          if (typeof $scope.model.parameters !== 'undefined'){
                                            if ($scope.model.parameters.length > 0 && typeof form.key !== 'undefined'){
                                              if (!modelValue) {
                                                  $scope.model.parameters[form.key[1]].value.required = true
                                              }
                                            }
                                          }
                                        }
                                    },
                                    {
                                      "key": "parameters[].value.required",
                                      "type": "radiobuttons",
                                      "condition": "model.parameters[arrayIndex].value.visible",
                                      "style": {
                                          "selected": "btn-success",
                                          "unselected": "btn-default"
                                      },
                                      "titleMap": [
                                          {"value": true, "name": "Yes"},
                                          {"value": false, "name": "No"}
                                      ],
                                      ngModelOptions: {
                                          updateOnDefault: true
                                      },
                                      onChange: function (modelValue, form) {
                                        if (typeof $scope.model.parameters !== 'undefined'){
                                          if ($scope.model.parameters.length > 0 && typeof form.key !== 'undefined'){
                                            if (modelValue && $scope.model.parameters[form.key[1]].semantics.minCardinality == 0) {
                                                $scope.model.parameters[form.key[1]].semantics.minCardinality = 1;
                                            } else if (!modelValue && $scope.model.parameters[form.key[1]].semantics.minCardinality > 0) {
                                                $scope.model.parameters[form.key[1]].semantics.minCardinality = 0;
                                            }
                                          }
                                        }
                                      }
                                    },
                                    {
                                      "key": "parameters[].value.order"
                                    }
                                  ]
                              }

                          ]
                      }
                  ]
              },
              {
                "title": "Inputs",
                "items": [
                    {
                        "type": "tabarray",
                        "title": "{{value.id || ('Input ' + $index)}}",
                        "tabType": "top",
                        "key": "inputs",
                        "style": {
                            "remove": "btn-danger"
                        },
                        "add": "Add input",
                        "startEmpty": true,
                        "items": [
                            {
                                "key": "inputs[].id",
                                ngModelOptions: {
                                    updateOnDefault: true
                                },
                                ngModel: function(ngModel) {
                                    ngModel.$validators.myMail = function(value) {
                                        var exp = /[a-zA-Z0-9_]+/.exec(value);
                                        if (!exp) {
                                            return false;
                                        }
                                        return true;
                                    };
                                },
                                validationMessage: {
                                    'invalidCharacters': "Invalid input id. Inputs must be alphanumeric strings and may include underscores."
                                }
                            },
                            {
                                "key": "inputs[].details",
                                "type": "fieldset",
                                "title": "Details",
                                "description": "Descriptive details about this app inputs used in form generation.",
                                "items": [
                                    {
                                      "key": "inputs[].details.label"
                                    },
                                    {
                                        "key": "inputs[].details.showArgument",
                                        "type": "radiobuttons",
                                        "style": {
                                            "selected": "btn-success",
                                            "unselected": "btn-default"
                                        },
                                        "titleMap": [
                                            {"value": true, "name": "True"},
                                            {"value": false, "name": "False"}
                                        ],
                                        ngModelOptions: {
                                            updateOnDefault: true
                                        }
                                    },
                                    {
                                        "key": "inputs[].details.argument",
                                        "condition": "model.parameters[arrayIndex].details.showArgument",
                                        "title": "Command line argument"
                                    },
                                    {
                                        "key": "inputs[].details.repeatArgument",
                                        "type": "radiobuttons",
                                        "condition": "model.inputs[arrayIndex].details.showArgument",
                                        "style": {
                                            "selected": "btn-success",
                                            "unselected": "btn-default"
                                        },
                                        "titleMap": [
                                            {"value": true, "name": "True"},
                                            {"value": false, "name": "False"}
                                        ],
                                        ngModelOptions: {
                                            updateOnDefault: true
                                        }
                                    }
                                ]
                            },
                            {
                                "key": "inputs[].semantics",
                                "type": "fieldset",
                                "title": "Semantics",
                                "description": "Semantic information about the input field.",
                                "items": [
                                    {
                                      "key": "inputs[].semantics.ontology",
                                      "startEmpty": true,
                                    },
                                    {
                                        "key": "inputs[].semantics.minCardinality",
                                        "type": "number",
                                        ngModelOptions: {
                                            updateOnDefault: true
                                        },
                                        validationMessage: {
                                            'minLessThanMax': 'Minimum number of values allowed by this input must be a non-negative integer value less than or equal to the maximum number of values.',
                                            'gtzeroWhenRequired': 'Minimum number of values allowed by this input must be greater than zero when required.',
                                        },
                                        $validators: {
                                            minLessThanMax: function (value) {
                                                if (typeof $scope.model.inputs !== 'undefined'){
                                                  if ($scope.model.inputs.length > 0 && typeof arrayIndex !== 'undefined'){
                                                    if (value && $scope.model.inputs[arrayIndex].semantics.maxCardinality > 0 &&
                                                        value > $scope.model.inputs[arrayIndex].semantics.maxCardinality) {
                                                        return false;
                                                    }
                                                  }
                                                }
                                                return true;
                                              },
                                              gtzeroWhenRequired: function (value) {
                                                if (typeof $scope.model.inputs !== 'undefined'){
                                                  if ($scope.model.inputs.length > 0 && typeof arrayIndex !== 'undefined'){
                                                    if (value && $scope.model.inputs[arrayIndex].semantics.maxCardinality > 0 &&
                                                        value > $scope.model.inputs[arrayIndex].semantics.maxCardinality) {
                                                        return false;
                                                    }
                                                  }
                                                }
                                                return true;
                                              }
                                        },
                                    },
                                    {
                                        "key": "inputs[].semantics.maxCardinality",
                                        "type": "number",
                                        ngModelOptions: {
                                            updateOnDefault: true
                                        },
                                        validationMessage: {
                                            'maxGreaterThanMax': 'Maximum number of values allowed by this parameter must be a non-negative integer value less than or equal to the maximum number of values.',
                                            'oneWhenBoolish': 'Maximum number of values is one when parameter is of type bool or flag.',
                                        },
                                        $validators: {
                                            minLessThanMax: function (value) {
                                                if (typeof $scope.model.inputs !== 'undefined'){
                                                  if ($scope.model.inputs.length > 0 && typeof arrayIndex !== 'undefined'){
                                                    if (value && $scope.model.inputs[arrayIndex].semantics.maxCardinality > 0 &&
                                                        value > $scope.model.inputs[arrayIndex].semantics.maxCardinality) {
                                                        return false;
                                                    }
                                                  }
                                                }
                                                return true;
                                            },
                                            oneWhenBoolish: function (value) {
                                              if (typeof $scope.model.inputs !== 'undefined'){
                                                if ($scope.model.inputs.length > 0 && typeof arrayIndex !== 'undefined'){
                                                  if (value && ($scope.model.inputs[arrayIndex].value.type == 'bool' ||
                                                      $scope.model.inputs[arrayIndex].value.type == 'flag') &&
                                                      $scope.model.inputs[arrayIndex].semantics.maxCardinality > 1) {
                                                      return false;
                                                  }
                                                }
                                              }
                                              return true;
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                "key": "inputs[].value",
                                "type": "fieldset",
                                "title": "Values",
                                "description": "Default value and validations for the input field.",
                                "items": [
                                    {
                                        "key": "inputs[].value.default",
                                        "description": "Default value",
                                        "title": "Default value"
                                    },
                                    {
                                        "key": "inputs[].value.validator",
                                        "condition": "[string,number].indexOf(model.inputs[arrayIndex].value.type) !== -1",
                                        ngModelOptions: {
                                            updateOnDefault: true
                                        }
                                    },
                                    {
                                        "key": "inputs[].value.visible",
                                        "type": "radiobuttons",
                                        "style": {
                                            "selected": "btn-success",
                                            "unselected": "btn-default"
                                        },
                                        "titleMap": [
                                            {"value": true, "name": "Yes"},
                                            {"value": false, "name": "No"}
                                        ],
                                        ngModelOptions: {
                                            updateOnDefault: true
                                        },
                                        onChange: function (modelValue, form) {
                                          if (typeof $scope.model.inputs !== 'undefined'){
                                            if ($scope.model.inputs.length > 0 && typeof form.key !== 'undefined'){
                                              if (!modelValue) {
                                                  $scope.model.inputs[form.key[1]].value.required = true
                                              }
                                            }
                                          }
                                        }
                                    },
                                    {
                                        "key": "inputs[].value.required",
                                        "type": "radiobuttons",
                                        "condition": "model.inputs[arrayIndex].value.visible",
                                        "style": {
                                            "selected": "btn-success",
                                            "unselected": "btn-default"
                                        },
                                        "titleMap": [
                                            {"value": true, "name": "Yes"},
                                            {"value": false, "name": "No"}
                                        ],
                                        ngModelOptions: {
                                            updateOnDefault: true
                                        },
                                        onChange: function (modelValue, form) {
                                          if (typeof $scope.model.inputs !== 'undefined'){
                                            if ($scope.model.inputs.length > 0 && typeof form.key !== 'undefined'){
                                              if (modelValue && $scope.model.inputs[form.key[1]].semantics.minCardinality == 0) {
                                                  $scope.model.inputs[form.key[1]].semantics.minCardinality = 1;
                                              } else if (!modelValue && $scope.model.parameters[form.key[1]].semantics.minCardinality > 0) {
                                                  $scope.model.inputs[form.key[1]].semantics.minCardinality = 0;
                                              }
                                            }
                                          }
                                        }
                                    },
                                    {
                                      "key": "inputs[].value.order"
                                    }
                                ]
                            }

                        ]
                    }
                ]
            }

          ]
      }];

      $scope.model = {
        "name": "shell-runner",
        "version": "0.1.0",
        "helpURI": "http://agaveapi.co/documentation/tutorials/app-management-tutorial",
        "label": "Execute a command at a shell",
        "defaultNodeCount": 1,
        "defaultMaxRunTime": "01:00:00",
        "shortDescription": "This will execute whatever command you give in the command parameter",
        "longDescription": "This will execute whatever command you give in the command parameter",
        "executionSystem": "",
        "executionType": "CLI",
        "parallelism": "SERIAL",
        "deploymentPath": Django.user + "/apps/shell-runner-0.1.0",
        "deploymentSystem": "designsafe.storage.default",
        "templatePath": "wrapper.sh",
        "testPath": "test/test.sh",
        "tags": [
          "excute", "awesome", "demo"
        ],
        "modules": [],
        "inputs": [],
        "parameters": [{
            "id": "command",
            "details": {
              "label": "Command to run",
              "description": "This is the actual shell command you want to run",
              "argument": "sh -c ",
              "showArgument": true
            },
            "value": {
              "default": "/bin/date",
              "type": "string",
              "required": true,
              "visible": true
            },
            "semantics": {
              "ontology": []
            }
          }
        ],
        "checkpointable": false
      };

      // $scope.prettyModel = '{}';
      $scope.prettyModel = '';

      $scope.systems = {
          execution: [],
          storage: []
      }

      $scope.defaultSystems = {
          execution: null,
          storage: null
      }

      $scope.currentTabIndex = 0;
      $scope.codeview = false;

      $scope.init = function() {
          Apps.getSystems()
            .then(
              function(response){
                $scope.form[0].tabs[1].items[1].titleMap = [{"value": '', "name": 'Select a system'}];
                $scope.form[0].tabs[2].items[1].titleMap = [{"value": '', "name": 'Select a system'}];
                angular.forEach(response.data, function(system){
                  if (system.type === 'STORAGE'){
                    $scope.form[0].tabs[1].items[1].titleMap.push({"value": system.id, "name": system.id});
                  } else {
                    $scope.form[0].tabs[2].items[1].titleMap.push({"value": system.id, "name": system.id});
                  }
                });
                AppsWizard.activateTab($scope, $scope.currentTabIndex);
              },
              function(response){
                $scope.form[0].tabs[1].items[1].titleMap = [{"value": '', "name": 'Select a system'}];
                $scope.form[0].tabs[1].items[1].titleMap.push({"value": $translate.instant('storage_default'), "name": $translate.instant('storage_default')});

                $scope.form[0].tabs[2].items[1].titleMap = [{"value": '', "name": 'Select a system'}];
                $scope.form[0].tabs[2].items[1].titleMap.push({"value": $translate.instant('execution_default'), "name": $translate.instant('storage_execution')});
                AppsWizard.activateTab($scope, $scope.currentTabIndex);
              }
            )

      }


      $scope.init();

      $scope.submit = function () {
          $scope.error = '';
          $scope.requesting = true;
          $scope.$broadcast('schemaFormValidate');
            switch($scope.addModel.select){
              case 'Agave':
                if ($scope.myForm.$valid){
                  Apps.createApp($scope.model)
                    .then(
                      function(response){
                        var metadata = {};
                        metadata.name = 'ds_app';
                        metadata.value = {};
                        metadata.value.id = response.data.id;
                        metadata.value.label = response.data.name;
                        metadata.value.version = response.data.version;
                        metadata.value.isPublic = response.data.isPublic;
                        metadata.value.available = true;
                        metadata.value.shortDescription = response.data.shortDescription;
                        metadata.value.type = 'agave';

                        // Check if metadata record exists
                        Apps.getMeta(metadata.value.id)
                          .then(
                            function(response){
                              if (response.data.length === 0){
                                Apps.createMeta(metadata)
                                  .then(
                                    function(response){
                                      $scope.appMeta = response.data.value;
                                      var modalInstance = $uibModal.open({
                                        templateUrl: '/static/designsafe/apps/applications/html/application-add-success.html',
                                        scope: $scope,
                                        size: 'md',
                                        resolve: {
                                         appMeta: function(){
                                           return $scope.appMeta;
                                         }
                                        },
                                        controller: [
                                         '$scope', '$uibModalInstance', '$translate', 'appMeta', function($scope, $uibModalInstance, $translate, appMeta) {

                                            $scope.appMeta = appMeta;

                                            $scope.close = function() {
                                              $uibModalInstance.dismiss();
                                              $state.transitionTo('applications');
                                            };

                                         }
                                        ]
                                      });
                                      $scope.requesting = false;
                                    },
                                    function(response){
                                      $scope.error = $translate.instant('error_app_create');
                                    }
                                  )
                              } else {
                                // metadata.uuid = response.data[0].uuid;
                                Apps.updateMeta(metadata, response.data[0].uuid)
                                  .then(
                                    function(response){
                                      $scope.appMeta = response.data.value;
                                      var modalInstance = $uibModal.open({
                                        templateUrl: '/static/designsafe/apps/applications/html/application-add-success.html',
                                        scope: $scope,
                                        size: 'md',
                                        resolve: {
                                         appMeta: function(){
                                           return $scope.appMeta;
                                         }
                                        },
                                        controller: [
                                         '$scope', '$uibModalInstance', '$translate', 'appMeta', function($scope, $uibModalInstance, $translate, appMeta) {
                                            $scope.appMeta = appMeta;
                                            $scope.close = function() {
                                              $uibModalInstance.dismiss();
                                              $state.transitionTo('applications');
                                            };

                                         }
                                        ]
                                      });
                                      $scope.requesting = false;
                                    },
                                    function(response){
                                      $scope.error = $translate.instant('error_app_create') + response.data;
                                      $scope.requesting = false;
                                    }
                                  )
                              }
                            },
                            function(response){
                              $scope.error = $translate.instant('error_app_create') + response.data;
                              $scope.requesting = false;
                            }
                          );
                      },
                      function(response){
                        $scope.error = $translate.instant('error_app_create') + response.data;
                        $scope.requesting = false;
                      }
                    );
                } else {
                  $scope.error = $translate.instant('error_form_invalid');
                  $scope.requesting = false;
                }
                break;
              case 'Custom':
                if ($scope.myCustomForm.$valid){

                  var metadata = {'name': 'ds_app'};
                  metadata.value = {};
                  metadata.value.id = $scope.customModel.label+ '-' + $scope.customModel.version;
                  metadata.value.available = true;
                  _.extend(metadata.value, angular.copy($scope.customModel));

                  Apps.getMeta(metadata.value.id)
                    .then(
                      function(response){
                        if (response.data.length === 0){
                          Apps.createMeta(metadata)
                            .then(
                              function(response){
                                $scope.appMeta = response.data.value;
                                var modalInstance = $uibModal.open({
                                  templateUrl: '/static/designsafe/apps/applications/html/application-add-success.html',
                                  scope: $scope,
                                  size: 'md',
                                  resolve: {
                                   appMeta: function(){
                                     return $scope.appMeta;
                                   }
                                  },
                                  controller: [
                                   '$scope', '$uibModalInstance', '$translate', 'appMeta', function($scope, $uibModalInstance, $translate, appMeta) {
                                      $scope.appMeta = appMeta;

                                      $scope.close = function() {
                                        $uibModalInstance.dismiss();
                                        $state.transitionTo('applications');
                                      };
                                   }
                                  ]
                                });
                                $scope.requesting = false;
                              },
                              function(response){
                                $scope.error = $translate.instant('error_app_create') + response.data;
                                $scope.requesting = false;
                              }
                            );
                        } else {
                          $scope.error = $translate.instant('error_app_exists');
                          $scope.requesting = false;
                        }
                      },
                      function(response){
                        $scope.error = $translate.instant('error_app_create') + response.data;
                        $scope.requesting = false;
                      }
                    );
                } else {
                  $scope.error = $translate.instant('error_form_invalid');
                  $scope.requesting = false;
                }
                break;
            }
      };

      $scope.nextStep = function () {
          AppsWizard.validateTab($scope, $scope.currentTabIndex).then(function () {
              AppsWizard.activateTab($scope, ++$scope.currentTabIndex);
          });
      };

      $scope.previousStep = function () {
          AppsWizard.activateTab($scope, --$scope.currentTabIndex);
      };

      $scope.wizview = 'split';

      $scope.updateWizardLayout = function() {
      };

      $scope.codemirrorLoaded = function(_editor) {
          // Events
          _editor.on("change", function () {
              $timeout(function() {
                  if (_editor.getValue() === ''){
                    $scope.model = '';
                  } else {
                    try {
                      $scope.model = JSON.parse(_editor.getValue());
                    } catch(error) {
                      $scope.error = $translate.instant('error_form_codemirror');
                    }

                  }
              }, 0);
          });
          _editor.on("blur", function () {
              if (_editor.hasFocus()) {
                  try {
                    $scope.model = JSON.parse(_editor.getValue());
                  } catch (error){
                    $scope.error = $translate.instant('error_form_codemirror');
                  }
              }
          });
      };

      // CodeMirror editor support
      $scope.editorConfig = {
          lineWrapping : true,
          lineNumbers: true,
          matchBrackets: true,
          styleActiveLine: false,
          theme: 'neat',
          mode: 'javascript',
          json: true,
          statementIndent: 2,
          onLoad: $scope.codemirrorLoaded
      };

      $scope.$watch('model', function(currentModel){
          $scope.error = '';
          // if (currentModel === ''){
          //   $scope.model = {};
          // }
          if (currentModel){
              $scope.prettyModel = JSON.stringify(currentModel, undefined, 2);
          }
      }, true);

      // $scope.$watch('model.modules', function(newValue, oldValue){
      //     if (typeof newValue === 'undefined' && $scope.model !== ''){
      //       $scope.model.modules = [];
      //     }
      // }, true);
      //
      // $scope.$watch('model.ontology', function(newValue, oldValue){
      //     if (typeof newValue === 'undefined' && typeof $scope.model !== 'undefined'){
      //       $scope.model.ontology = [];
      //     }
      // }, true);
      //
      // $scope.$watch('model.parameters', function(newValue, oldValue){
      //     if (typeof newValue === 'undefined'){
      //       $scope.model.parameters = [];
      //     }
      // }, true);
      //
      // $scope.$watch('model.tags', function(newValue, oldValue){
      //     if (typeof newValue === 'undefined'){
      //       $scope.model.tags = [];
      //     }
      // }, true);
      /******** end Agave form ********/

    }]);

})(window, angular, jQuery, _);
