(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('ng.designsafe');

  module.directive('dsDataBrowser', function() {
    return {
      restrict: 'E',
      templateUrl: '/static/scripts/ng-designsafe/html/directives/ds-data-browser.html',
      scope: {},
      controller: []
    };
  });

  module.directive('dsDataBrowserSourceSelect', function() {
    return {
      restrict: 'E',
      templateUrl: '/static/scripts/ng-designsafe/html/directives/ds-data-browser-source-select.html',
      scope: {},
      controller: []
    };
  });

  module.directive('dsDataBrowserToolbar', function() {
    return {
      restrict: 'E',
      templateUrl: '/static/scripts/ng-designsafe/html/directives/ds-data-browser-toolbar.html',
      scope: {},
      controller: []
    };
  });

  module.directive('dsDataListDisplay', function() {
    
    return {
      restrict: 'E',
      templateUrl: '/static/scripts/ng-designsafe/html/directives/ds-data-list-display.html',
      scope: {
        source: '=source',  /* the data source to initialize with */
        id: '=id'  /* the id to initialize with */
      },
      controller: ['$scope', 'Logging', 'DataService', function($scope, Logging, DataService) {
        var logger = Logging.getLogger('ngDesignSafe.dsDataListDisplay');

        $scope.data = {
          sources: [],
          files: []
        };

        $scope.state = {
          selecting: false,
          selected: {},
          hover: {}
        };
        
        $scope.getIconClass = function(file, hover) {
          if ($scope.state.selecting || hover) {
            if ($scope.state.selected[file.id]) {
              return 'fa-check-circle';
            } else {
              return 'fa-circle-o';
            }
          }
          return file._extra.icon;
        };

        $scope.selectAll = function() {
          if ($scope.state.selectAll) {
            $scope.clearSelection();
          } else {
            $scope.state.selected = _.chain($scope.data.files)
                                     .pluck('id').map(function (id) { return [id, true]; })
                                     .object()
                                     .value();
            $scope.state.selectAll = $scope.state.selecting = true;
          }
        };

        $scope.selectFile = function(file) {
          if ($scope.state.selected[file.id]) {
            delete $scope.state.selected[file.id];
          } else {
            $scope.state.selected[file.id] = true;
          }

          if (Object.keys($scope.state.selected).length === 0) {
            $scope.clearSelection();
          } else {
            $scope.state.selecting = true;
            $scope.state.selectAll = false;
          }
        };

        $scope.clearSelection = function() {
          $scope.state.selected = {};
          $scope.state.selectAll = $scope.state.selecting = false;
        };

        DataService.listSources().then(
          function(response) {
            $scope.data.sources = response.data;
          },
          function(error) {
            logger.error(error);
          }
        );

        DataService.listFiles({}).then(
          function(response) {
            $scope.data.files = response.data;
          },
          function(error) {
            logger.error(error);
          }
        );
      }]
    };
    
  });
})(window, angular, jQuery, _);
