(function(window, angular, $, _) {
  "use strict";
  angular.module('WorkspaceApp').factory('Apps', ['$http', 'djangoUrl', function($http, djangoUrl) {

    var service = {};

    var default_list_opts = {
      publicOnly: false
    };
    service.list = function(opts) {
      opts = opts || {};
      var params = _.extend(default_list_opts, opts);
      return $http({
        url: djangoUrl.reverse('designsafe_workspace:call_api', ['apps']),
        method: 'GET',
        params: params
      });
    };

    service.get = function(app_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_workspace:call_api', ['apps']),
        method: 'GET',
        params: {'app_id': app_id}
      });
    };

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

      if (params.length > 0) {
        schema.properties.parameters = {
          type: 'object',
          notitle: true,
          properties: {}
        };
        _.each(params, function(param) {
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
          title: 'Inputs',
          properties: {}
        };
        _.each(inputs, function(input) {
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
            }
            if (input.semantics.maxCardinality > 1) {
              field.maxItems = input.semantics.maxCardinality;
            }
          }
          schema.properties.inputs.properties[input.id] = field;
        });
      }

      schema.properties.name = {
        title: 'Job name',
        description: 'A recognizable name for this job',
        type: 'string',
        required: true
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
