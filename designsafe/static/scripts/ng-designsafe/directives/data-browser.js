(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('ng.designsafe');

  module.directive('dsDataBrowser', ['Logging', function(Logging) {
    var logger = Logging.getLogger('ngDesignSafe.dsDataBrowser');

    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser.html',
      scope: {
        source: '=source',  /* the data source to initialize with */
        id: '=id'  /* the id to initialize with */
      },
      controller: ['$scope', 'DataService', function($scope, DataService) {

        $scope.data = {
          files: [],
          sources: []
        };

        $scope.state = {
          selecting: false,
          selected: {},
          hover: {}
        };

        var self = this;

        self.getIconClass = function(file, hover) {
          if ($scope.state.selecting || hover) {
            if ($scope.state.selected[file.id]) {
              return 'fa-check-circle';
            } else {
              return 'fa-circle-o';
            }
          }
          return file._extra.icon;
        };

        self.selectAll = function() {
          if ($scope.state.selectAll) {
            self.clearSelection();
          } else {
            $scope.state.selected = _.chain($scope.data.files)
                                     .pluck('id').map(function (id) { return [id, true]; })
                                     .object()
                                     .value();
            $scope.state.selectAll = $scope.state.selecting = true;
          }
        };

        self.selectFile = function(file) {
          if ($scope.state.selected[file.id]) {
            delete $scope.state.selected[file.id];
          } else {
            $scope.state.selected[file.id] = true;
          }

          if (Object.keys($scope.state.selected).length === 0) {
            self.clearSelection();
          } else {
            $scope.state.selecting = true;
            $scope.state.selectAll = false;
          }
        };

        self.clearSelection = function() {
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
  }]);

  module.directive('dsDataBrowserSourceSelect', ['Logging', function(Logging) {

    var logger = Logging.getLogger('ngDesignSafe.dsDataBrowserSourceSelect');

    return {
      require: '^^dsDataBrowser',
      restrict: 'E',
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-source-select.html',
      scope: {},
      link: function(scope, element, attrs, dbCtrl) {
        scope.state = scope.$parent.$parent.state;
        scope.data = scope.$parent.$parent.data;
        scope.getIconClass = dbCtrl.getIconClass;
        scope.selectAll = dbCtrl.selectAll;
        scope.selectFile = dbCtrl.selectFile;
        scope.clearSelection = dbCtrl.clearSelection;
      }
    };
  }]);

  module.directive('dsDataBrowserToolbar', ['Logging', function(Logging) {

    var logger = Logging.getLogger('ngDesignSafe.dsDataBrowserToolbar');

    return {
      require: '^^dsDataBrowser',
      restrict: 'E',
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-toolbar.html',
      scope: {},
      link: function(scope, element, attrs, dbCtrl) {
        scope.state = scope.$parent.$parent.state;
        scope.data = scope.$parent.$parent.data;
        scope.getIconClass = dbCtrl.getIconClass;
        scope.selectAll = dbCtrl.selectAll;
        scope.selectFile = dbCtrl.selectFile;
        scope.clearSelection = dbCtrl.clearSelection;
      }
    };
  }]);

  module.directive('dsDataListDisplay', ['Logging', function(Logging) {
    var logger = Logging.getLogger('ngDesignSafe.dsDataListDisplay');

    return {
      require: '^^dsDataBrowser',
      restrict: 'E',
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-list-display.html',
      scope: {},
      link: function(scope, element, attrs, dbCtrl) {
        scope.state = scope.$parent.$parent.state;
        scope.data = scope.$parent.$parent.data;
        scope.getIconClass = dbCtrl.getIconClass;
        scope.selectAll = dbCtrl.selectAll;
        scope.selectFile = dbCtrl.selectFile;
        scope.clearSelection = dbCtrl.clearSelection;
      }
    };
    
  }]);
})(window, angular, jQuery, _);
