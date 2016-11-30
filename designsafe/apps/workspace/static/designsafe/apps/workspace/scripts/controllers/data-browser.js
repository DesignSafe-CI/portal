(function(window, angular, $) {
  "use strict";
  angular.module('designsafe').controller('DataBrowserCtrl',
    ['$scope', '$controller', '$rootScope', 'Systems', 'Files', 'logger', function($scope, $controller, $rootScope, Systems, Files, logger) {

    $controller('WorkspacePanelCtrl', {$scope: $scope});

    if ($(window).width() < 992) {
      $scope.panel.collapsed = true;
    }

    $scope.data = {
      loading: false,
      wants: null,
      systemList: [],
      filesListing: null,
      system: null,
      dirPath: [],
      filePath: ''
    };

    $scope.dataSourceUpdated = function dataSourceUpdated() {
      $scope.data.filesListing = null;
      $scope.data.loading = true;
      $scope.data.filePath = '';
      $scope.data.dirPath = [];

      /* initialize the browser */
      Files.list({systemId: $scope.data.system.id, path: $scope.data.filePath})
      .then(function(response) {
        $scope.data.filesListing = response.data;
        if ($scope.data.filesListing.length > 0) {
          $scope.data.filePath = $scope.data.filesListing[0].path;
          $scope.data.dirPath = $scope.data.filePath.split('/');
        }
        $scope.data.loading = false;
      }, function(response) {
        logger.log(error);
        $scope.data.error = 'Unable to list the selected data source: ' + error.statusText;
        $scope.data.loading = false;
      });
    };

    $scope.getFileIcon = Files.icon;

    $scope.browseFile = function(file) {
      if (file.type === 'dir' || file.type === 'folder') {
        if (file.name === '.') {
          $scope.data.dirPath.pop();
        } else {
          $scope.data.dirPath.push(file.name);
        }
        $scope.data.filePath = $scope.data.dirPath.join('/');
        $scope.loadFiles();
      }
    };

    $scope.loadFiles = function loadFiles() {
      $scope.data.filesListing = null;
      $scope.data.loading = true;
      Files.list({systemId: $scope.data.system.id, path: $scope.data.filePath})
      .then(function(response) {
        $scope.data.filesListing = response.data;
        $scope.data.loading = false;
      }, function(error) {
        logger.log(error);
        $scope.data.error = 'Unable to list the selected data source: ' + error.statusText;
        $scope.data.loading = false;
      });
    };

    $scope.displayName = function displayName(file) {
      if (file.systemId === 'nees.public') {
        if (file.name === '.' ) {
          return '..';
        } else {
          return file.projecTitle || file.name;
        }
      } else {
        if (file.name === '.' ) {
          return '..';
        } else {
          return file.name;
        }
      }
    };

    $scope.chooseFile = function(file) {
      if ($scope.data.wants) {
        Files.provideFile($scope.data.wants.requestKey, file);
      }
    };

    $rootScope.$on('wants-file', function($event, wantArgs) {
      $scope.data.wants = wantArgs;
      if ($scope.panel.collapsed) {
        $scope.data.wants.wasCollapsed = true;
        $scope.panel.collapsed = false;
      }
    });

    $rootScope.$on('cancel-wants-file', function($event, args) {
      if ($scope.data.wants && $scope.data.wants.requestKey === args.requestKey) {
        if ($scope.data.wants.wasCollapsed) {
          $scope.panel.collapsed = true;
        }
        $scope.data.wants = null;
      }
    });

    /* Initialize... */
    Systems.list().then(function(systemList) {
      $scope.data.systemList = systemList;
      $scope.data.system = systemList[0];
      $scope.dataSourceUpdated();
    });
  }]);
})(window, angular, jQuery);
