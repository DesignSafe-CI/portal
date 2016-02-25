(function(window, angular, $) {
  "use strict";
  angular.module('WorkspaceApp').controller('DataBrowserCtrl',
    ['$scope', '$controller', '$rootScope', 'Files', function($scope, $controller, $rootScope, Files) {

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
      filePath: ''
    };

    /* TODO: this should be an API call. A static list will do for now... */
    $scope.data.systemList = [
        {
          id: 'designsafe.storage.default',
          name: 'DesignSafe User Data'
        },
        {
          id: 'nees.public',
          name: 'NEES Public Data'
        }
    ];
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

    $scope.dataSourceUpdated = function dataSourceUpdated() {
      $scope.data.filePath = '';
      $scope.updateListing();
    };

    $scope.getFileIcon = Files.icon;

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
  }]);
})(window, angular, jQuery);
