(function(window, angular, $, _) {
  "use strict";
  angular.module('WorkspaceApp').factory('Apps', ['$http', function($http) {
    var service = {};

    service.list = function() {
      return [{
        "_links": {
          "self": {
            "href": "https://agave.designsafe-ci.org/apps/v2/opensees-2.4.4.5804u1"
          }
        },
        "executionSystem": "designsafe.exec.stampede",
        "id": "opensees-2.4.4.5804u1",
        "isPublic": true,
        "label": "OpenSees",
        "lastModified": "2015-12-22T08:52:35.000-06:00",
        "name": "opensees",
        "revision": 1,
        "shortDescription": "OpenSees is a software framework for simulating the seismic response of structural and geotechnical systems.",
        "version": "2.4.4.5804"
      }];
    };

    service.get = function(app_id) {
      return {
        "_links": {
          "executionSystem": {
            "href": "https://agave.designsafe-ci.org/systems/v2/designsafe.exec.stampede"
          },
          "metadata": {
            "href": "https://agave.designsafe-ci.org/meta/v2/data/?q={\"associationIds\":\"6666245263008787995-242ac114-0001-005\"}"
          },
          "owner": {
            "href": "https://agave.designsafe-ci.org/profiles/v2/mrhanlon"
          },
          "permissions": {
            "href": "https://agave.designsafe-ci.org/apps/v2/opensees-2.4.4.5804u1/pems"
          },
          "self": {
            "href": "https://agave.designsafe-ci.org/apps/v2/opensees-2.4.4.5804u1"
          },
          "storageSystem": {
            "href": "https://agave.designsafe-ci.org/systems/v2/designsafe.storage.default"
          }
        },
        "available": true,
        "checkpointable": false,
        "defaultMaxRunTime": "01:59:00",
        "defaultMemoryPerNode": 1,
        "defaultNodeCount": 1,
        "defaultProcessorsPerNode": 1,
        "defaultQueue": "development",
        "deploymentPath": "/applications/opensees-2.4.4.5804u1.zip",
        "deploymentSystem": "designsafe.storage.default",
        "executionSystem": "designsafe.exec.stampede",
        "executionType": "HPC",
        "helpURI": null,
        "icon": null,
        "id": "opensees-2.4.4.5804u1",
        "inputs": [{
          "details": {
            "argument": null,
            "description": "The tcl dataset to process",
            "label": "Dataset",
            "repeatArgument": false,
            "showArgument": false
          },
          "id": "dataset",
          "semantics": {
            "fileTypes": [
              "tcl-0"
            ],
            "maxCardinality": 1,
            "minCardinality": 1,
            "ontology": [
              "http://sswapmeet.sswap.info/mime/text/Tcl"
            ]
          },
          "value": {
            "default": "agave://designsafe.storage.default/mrhanlon/applications/opensees-2.4.4.5804/test/1elem.tcl",
            "enquote": false,
            "order": 0,
            "required": true,
            "validator": "([^\s]+(\.(?i)(tcl))$)",
            "visible": true
          }
        }],
        "isPublic": true,
        "label": "OpenSees",
        "lastModified": "2015-12-22T08:52:35.000-06:00",
        "longDescription": "The Open System for Earthquake Engineering Simulation (OpenSees) is a software framework for simulating the seismic response of structural and geotechnical systems. OpenSees has been developed as the computational platform for research in performance-based earthquake engineering at the Pacific Earthquake Engineering Research Center. OpenSees is also the simulation component for the NEESit since 2004.",
        "modules": [
          "petsc"
        ],
        "name": "opensees",
        "ontology": [],
        "outputs": [],
        "parallelism": "SERIAL",
        "parameters": [],
        "revision": 1,
        "shortDescription": "OpenSees is a software framework for simulating the seismic response of structural and geotechnical systems.",
        "tags": [
          "demo",
          "earthquake",
          "geo",
          "engineering"
        ],
        "templatePath": "wrapper.sh",
        "testPath": "test/test.sh",
        "uuid": "6666245263008787995-242ac114-0001-005",
        "version": "2.4.4.5804"
      }
    }

    service.formSchema = function(app) {
      if (typeof app === 'string') {
        app = service.get(app);
      }
      var params = app.parameters || [];
      var inputs = app.inputs || [];

      var schema = {
        type: 'object',
        properties: {}
      };

      _.each(params, function(param) {
        var field = {
          title: param.details.label,
          description: param.details.description
        };
        switch (param.value.type) {
          case 'bool':
          case 'flag':
            field.type = 'boolean';
            break;

          case 'enumeration':
            field.type = 'string';
            field.enum = param.value.enumValues;
            break;

          case 'number':
            field.type = 'number';
            break;

          case 'string':
          default:
            field.type = 'string';
        }
        schema.properties[param.id] = field;
      });

      _.each(inputs, function(input) {
        var field = {
          title: input.details.label,
          description: input.details.description,
          type: 'string'
        };
        schema.properties[input.id] = field;
      });

      return schema;
    };

    return service;
  }]);

})(window, angular, jQuery, _);