(function(window, angular, $, _) {
  "use strict";
  angular.module('WorkspaceApp').factory('Apps', ['$http', 'djangoUrl', function($http, djangoUrl) {

    var service = {};

    service.list = function() {
      return $http({
        url: djangoUrl.reverse('designsafe_workspace:call_api', ['apps']),
        method: 'GET'
      });
    };

    service.get = function(app_id) {
      return $http({
        url: djangoUrl.reverse('designsafe_workspace:call_api', ['apps']),
        method: 'GET',
        params: {'app_id': encodeURIComponent(app_id)}
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
        properties: {
          name: {
            title: 'Job name',
            description: 'A recognizable name for this job',
            type: 'string'
          }
        }
      };

      if (params.length > 0) {
        schema.properties.parameters = {
          type: 'object',
          title: 'Parameters',
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
            description: input.details.description,
            type: 'string'
          };
          schema.properties.inputs.properties[input.id] = field;
        });
      }

      return schema;
    };

    return service;
  }]);

})(window, angular, jQuery, _);