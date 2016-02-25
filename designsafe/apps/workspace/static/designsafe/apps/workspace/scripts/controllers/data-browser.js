(function(window, angular, $) {
  "use strict";
  angular.module('WorkspaceApp').controller('DataBrowserCtrl',
    ['$scope', '$controller', '$rootScope', 'Files', function($scope, $controller, $rootScope, Files) {

    $controller('WorkspacePanelCtrl', {$scope: $scope});

    $scope.data = {
      loading: false,
      systemList: [
        {
          id: 'designsafe.storage.default',
          name: 'DesignSafe User Data'
        },
        {
          id: 'nees.public',
          name: 'NEES Public Data'
        }
      ],
      filesListing: null,
      system: null,
      filePath: ''
    };

    $scope.data.system = $scope.data.systemList[0];

    $scope.updateListing = function updateListing() {
      $scope.data.filesListing = null;
      $scope.data.loading = true;
      Files.list({systemId: $scope.data.system.id, path: $scope.data.filePath})
      .then(function(response) {
        $scope.data.filesListing = response.data;
        $scope.data.filePath = $scope.data.filesListing[0].path;
        $scope.data.loading = false;
      }, function(error) {
        console.log(error);
        $scope.data.error = 'Unable to list the selected data source: ' + error.statusText;
        $scope.data.loading = false;
      });
    }
    $scope.updateListing();

    $scope.browseFile = function(file) {
      if (file.type === 'dir') {
        if (file.name === '.') {
          // browse to parent dir
          var parts = file.path.split('/');
          parts.pop();
          var parentPath = parts.join('/');
          $scope.data.filePath = parentPath;
        } else {
          $scope.data.filePath = file.path;
        }
        $scope.updateListing();
      }
    };

    $scope.chooseFile = function(file) {
      console.log(file);
      Files.choose(file);
    };

    $scope.dataSourceUpdated = function dataSourceUpdated() {
      $scope.filePath = '';
      $scope.updateListing();
    };

    $scope.getFileIcon = Files.icon;

    $rootScope.$on('wants-file', function($event, options) {
      console.log($event);
      console.log(options);
    });
  }]);
})(window, angular, jQuery);
