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
      controller: ['$scope', '$uibModal', 'DataService', function($scope, $uibModal, DataService) {
        
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
        
        self.previewFile = function(file) {
          $uibModal.open({
            templateUrl: '/static/scripts/ng-designsafe/html/directives/data-browser-preview.html',
            controller: function($scope, $sce, $uibModalInstance, DataService, file) {
              $scope.data = {
                file: file
              };

              $scope.data.previewUrl = {loading: true};
              DataService.preview({resource: file.source, file_id: file.id}).then(
                function(resp) {
                  $scope.data.previewUrl.loading = false;
                  if (resp.data) {
                    $scope.data.previewUrl.href = $sce.trustAs('resourceUrl', resp.data.href);
                  } else {
                    $scope.data.previewUrl.href = false;
                  }
                },
                function() {
                  $scope.data.previewUrl.loading = false;
                  $scope.data.previewUrl.href = false;
                });

              $scope.data.downloadUrl = {loading: true};
              DataService.download({resource: file.source, file_id: file.id}).then(
                function(resp) {
                  $scope.data.downloadUrl.loading = false;
                  if (resp.data) {
                    $scope.data.downloadUrl.href = $sce.trustAs('resourceUrl', resp.data.href);
                  } else {
                    $scope.data.downloadUrl.href = false;
                  }
                },
                function() {
                  $scope.data.downloadUrl.loading = false;
                  $scope.data.downloadUrl.href = false;
                });

              // $scope.copyToMyData = function($event, item) {
              //   $event.preventDefault();
              //
              //   DataService.copyToMyData(item)
              //   .then(function(response) {
              //     logger.debug(response);
              //   }, function(error) {
              //     logger.error(error);
              //   });
              // };

              $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
              };
            },
            size: 'lg',
            resolve: {file: file}
          });
        };

        self.browseFile = function(options) {
          $scope.state.loading = true;
          options = options || {};
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
          dbCtrl.browseFile({resource: source.resource, file_id: source.defaultPath});
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
          dbCtrl.browseFile({resource: trailItem.source, file_id: trailItem.id});
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
      scope: {
        enablePreview: '=preview'
      },
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
            dbCtrl.browseFile({resource: file.source, file_id: file.id});
          } else if (scope.enablePreview) {
            dbCtrl.previewFile(file);
          }
        };
      }
    };
    
  }]);
})(window, angular, jQuery, _);
