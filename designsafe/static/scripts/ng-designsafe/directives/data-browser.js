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
        data: '=data',  /* the data to initialize the data browser with; available keys are ['listing', 'resource', 'fileId'] */
        onPathChanged: '&onPathChanged',
        onResourceChanged: '&onResourceChanged'
        
      },
      controller: ['$scope', 'DataService', function($scope, DataService) {
        
        $scope.state = {
          loading: false,
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
          return DataService.getIcon(file.type, file.ext);
        };

        self.selectAll = function() {
          if ($scope.state.selectAll) {
            self.clearSelection();
          } else {
            $scope.state.selected = _.chain($scope.data.listing.children)
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

        self.browseFile = function(options) {
          $scope.state.loading = true;
          options = options || {};
          options = _.extend({resource: $scope.data.currentSource.resource}, options);
          DataService.listPath(options).then(
            function(response) {
              $scope.state.loading = false;
              $scope.data.listing = response.data;

              var handler = $scope.onPathChanged();
              if (handler) {
                handler($scope.data.listing);
              }
            },
            function(error) {
              $scope.state.loading = false;
              logger.error(error);
              // TODO notify user
            }
          );
        };

        if (! $scope.data.listing) {
          self.browseFile();
        }

        // self.listSources = function() {
        //   DataService.listSources().then(
        //     function (response) {
        //       $scope.data.sources = response.data;
        //
        //       var handler = $scope.onResourceChanged();
        //       if (handler) {
        //         handler($scope.data.listing);
        //       }
        //     },
        //     function (error) {
        //       logger.error(error);
        //       // TODO notify user
        //     }
        //   );
        // };
        //
        // if (! $scope.data.sources) {
        //   self.listSources();
        // }
      }]
    };
  }]);

  module.directive('dsDataBrowserNew', ['Logging', function(Logging) {

    var logger = Logging.getLogger('ngDesignSafe.daDataBrowserNew');

    return {
      require: '^^dsDataBrowser',
      restrict: 'E',
      replace: true,
      templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-new.html',
      scope: {},
      link: function(scope, element, attrs, dbCtrl) {
        scope.state = scope.$parent.$parent.state;
        scope.data = scope.$parent.$parent.data;

        scope.newFileEnabled = function() {
          return _.contains(scope.data.currentSource._actions, 'WRITE') ||
            _.contains(scope.data.listing._actions, 'WRITE');
        };
      }
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

        scope.getSourcePath = function (source) {
          return _.compact([source.resource, source.defaultPath]).join('/') + '/';
        };

        scope.selectSource = function($event, source) {
          $event.preventDefault();
          scope.data.currentSource = source;
          dbCtrl.browseFile({file_id: source.defaultPath});
        };
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
        scope.clearSelection = dbCtrl.clearSelection;
        
        scope.selectTrail = function($event, trailItem) {
          $event.preventDefault();
          dbCtrl.browseFile({file_id: trailItem.id});
        };
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

        scope.browseFile = function($event, file) {
          $event.preventDefault();
          if (file.type === 'folder') {
            dbCtrl.browseFile({file_id: file.id});
          }
        };
      }
    };
    
  }]);
})(window, angular, jQuery, _);
