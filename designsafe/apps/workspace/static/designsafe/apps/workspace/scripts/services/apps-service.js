(function(window, angular, $, _) {
  "use strict";
  angular.module('designsafe').factory('Apps', ['$http', '$q', '$translate', 'djangoUrl', function($http, $q, $translate, djangoUrl) {

    var service = {};

    var default_list_opts = {
      publicOnly: false
    };

    service.list = function(query) {
      return $http({
        url: djangoUrl.reverse('designsafe_workspace:call_api', ['meta']),
        method: 'GET',
        params: {'q': query},
        cache: true
      });
    };

    service.get = function(app_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_workspace:call_api', ['apps']),
        method: 'GET',
        params: {'app_id': app_id}
      });
    };

    service.getMeta = function(app_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_applications:call_api', ['meta']),
        method: 'GET',
        params: {q:{'name': $translate.instant('apps_metadata_name'),'value.definition.id': app_id}}
      });
    };

    service.formSchema = function(app) {
      /**
       * Generate a JSON.schema for the app ready for angular-schema-form
       * https://github.com/json-schema-form/angular-schema-form
       */
      if (typeof app === 'string') {
        app = service.get(app);
      }
      var params = app.parameters || [];
      var inputs = app.inputs || [];

      var schema = {
        type: 'object',
        properties: {}
      };

      if (params.length > 0) {
        schema.properties.parameters = {
          type: 'object',
          properties: {}
        };
        _.each(params, function(param) {
          if (! param.value.visible) {
            return;
          }
          if (param.id.startsWith('_')) {
            return;
          }
          var field = {
            title: param.details.label,
            description: param.details.description,
            required: param.value.required
          };
          switch (param.value.type) {
            case 'bool':
            case 'flag':
              field.type = 'boolean';
              break;

            case 'enumeration':
              field.type = 'string';
              field.enum = _.map(param.value.enum_values, function(enum_val) {
                return Object.keys(enum_val)[0];
              });
              field['x-schema-form'] = {
                'titleMap': _.map(param.value.enum_values, function(enum_val) {
                  var key = Object.keys(enum_val)[0];
                  return {
                    'value': key,
                    'name': enum_val[key]
                  };
                })
              };
              break;

            case 'number':
              field.type = 'number';
              break;

            case 'string':
            default:
              field.type = 'string';
          }
          schema.properties.parameters.properties[param.id] = field;
        });
      }

      if (inputs.length > 0) {
        schema.properties.inputs = {
          type: 'object',
          properties: {}
        };
        _.each(inputs, function(input) {
          if (! input.value.visible) {
            return;
          }
          if (input.id.startsWith('_')) {
            return;
          }
          var field = {
            title: input.details.label,
            description: input.details.description
          };
          if (input.semantics.maxCardinality === 1) {
            field.type = 'string';
            field.format = 'agaveFile';
            field.required = input.value.required;
          } else {
            field.type = 'array';
            field.items = {
              type: 'string',
              format: 'agaveFile',
              'x-schema-form': {notitle: true}
            };
            if (input.semantics.maxCardinality > 1) {
              field.maxItems = input.semantics.maxCardinality;
            }
          }
          schema.properties.inputs.properties[input.id] = field;
        });
      }

      schema.properties.maxRunTime = {
        title: 'Maximum job runtime',
        description: 'In HH:MM:SS format. The maximum time you expect this job to run for. After this amount of time your job will be killed by the job scheduler. Shorter run times result in shorter queue wait times. Maximum possible time is 48:00:00 (48 hours).',
        type: 'string',
        "pattern":"^(48:00:00)|([0-4][0-7]:[0-5][0-9]:[0-5][0-9])$",
        "validationMessage":"Must be in format HH:MM:SS and be less than 48 hours (48:00:00)",
        required: true,
        'x-schema-form': {placeholder: app.defaultMaxRunTime}
      };

      schema.properties.name = {
        title: 'Job name',
        description: 'A recognizable name for this job',
        type: 'string',
        required: true
      };

      schema.properties.nodeCount = {
        title: 'Node Count (optional)',
        description: `Number of requested process nodes for the job. Default number of nodes is ${app.defaultNodeCount}. If the application is not of executionType PARALLEL, this should be 1.`,
        type: 'integer',
        "minimum": 1,
        "maximum": 10000,
        "format": "int64",
        "validationMessage": "Must be an integer in the range 1 to 10000.",
        'x-schema-form': {placeholder: app.defaultNodeCount}
      };

      schema.properties.archivePath = {
        title: 'Job output archive location (optional)',
        description: 'Specify a location where the job output should be archived. By default, job output will be archived at: <code>&lt;username&gt;/archive/jobs/${YYYY-MM-DD}/${JOB_NAME}-${JOB_ID}</code>.',
        type: 'string',
        format: 'agaveFile',
        'x-schema-form': {placeholder: '<username>/archive/jobs/${YYYY-MM-DD}/${JOB_NAME}-${JOB_ID}'}
      };

      return schema;
    };

    return service;
  }]);

})(window, angular, jQuery, _);
