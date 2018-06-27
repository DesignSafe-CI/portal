(function(window, angular) {
  var app = angular.module('designsafe');
  app.requires.push('django.context');

  app.controller('DataDepotToolbarCtrl', ['$scope', '$state', '$uibModal', 'Django', 'DataBrowserService', 'UserService', function ($scope, $state, $uibModal, Django, DataBrowserService, UserService) {
    $scope.$state = $state;
    $scope.search = {queryString : ''};
    $scope.browser = DataBrowserService.state();
    $scope.UserService = UserService;

    $scope.placeholder = function() {
      var stateNames = {
        'myData':'My Data',
        'projects.list':'My Projects',
        'sharedData':'Shared Data',
        'boxData':'Box',
        'dropboxData':'Dropbox',
        'googledriveData':'Google Drive',
        'publicData':'Public Data',
        'communityData':'Community Data',
        'projects.view': 'Project View',
        'projects.view.data': 'Project Data View'
      };

      if (stateNames[$state.current.name]) {
        return(stateNames[$state.current.name]);
      }
      else {
        return('Data Depot');
      }
    };

    DataBrowserService.subscribe($scope, function($event, eventData) {
      if (eventData.type === DataBrowserService.FileEvents.FILE_SELECTION) {
        updateToolbar();
      }
    });

    $scope.tests = {};

    /**
     * Update the toolbar's status for various functions.
     */
    function updateToolbar() {
      $scope.tests = DataBrowserService.allowedActions($scope.browser.selected);
    }

    /* Set initial toolbar status */
    updateToolbar();
    $scope.apiParams = DataBrowserService.apiParameters();
    /* Map service functions to toolbar buttons */
    $scope.ops = {
      details: function() {
        // preview the last selected file or current listing if none selected
        if ($scope.browser.selected.length > 0) {
          DataBrowserService.preview($scope.browser.selected.slice(-1)[0]);
        } else {
          DataBrowserService.preview($scope.browser.listing);
        }
      },
      download: function() {
        DataBrowserService.download($scope.browser.selected);
      },
      preview: function () {
        DataBrowserService.preview($scope.browser.selected[0], $scope.browser.listing);
      },
      previewImages: function () {
        DataBrowserService.previewImages($scope.browser.listing);
      },
      viewMetadata: function () {
        DataBrowserService.viewMetadata($scope.browser.selected, $scope.browser.listing);
      },
      viewCategories: function() {
        DataBrowserService.viewCategories($scope.browser.selected, $scope.browser.listing);
      },
      share: function () {
        DataBrowserService.share($scope.browser.selected[0]);
      },
      copy: function () {
        DataBrowserService.copy($scope.browser.selected);
      },
      move: function () {
        DataBrowserService.move($scope.browser.selected, $scope.browser.listing);
      },
      rename: function () {
        DataBrowserService.rename($scope.browser.selected[0]);
      },
      trash: function () {
        DataBrowserService.trash($scope.browser.selected);
      },
      rm: function () {
        DataBrowserService.rm($scope.browser.selected);
      },
      search: function(){
        var state = $scope.apiParams.searchState;
        $state.go(state, {'query_string': $scope.search.queryString, 'searching': true,
                   'systemId': $scope.browser.listing.system,
                   'filePath': '$SEARCH'});
      }
    };
  }]);
})(window, angular);
