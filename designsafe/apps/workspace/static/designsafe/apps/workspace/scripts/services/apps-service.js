(function(window, angular, $) {
  "use strict";
  angular.module('WorkspaceApp').factory('Apps', ['$http', function($http) {
    return {
      list: function() {
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
      }
    };
  }]);

})(window, angular, jQuery);