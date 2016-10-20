(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('PublicationDataCtrl', ['$scope', '$state', 'Django', 
                                         'DataBrowserService', 
                 function ($scope, $state, Django, DataBrowserService) {

  $scope.browser = DataBrowserService.state();

  $scope.data = {
    user: Django.user,
    customRoot: {
      name: 'Publications',
      href: $steate.href('publications', {systemId: $scope.browser.listing.system, 
                                          filePath: 'public/'})
    }
  };

    $scope.resolveBreadcrumbHref = function(trailItem) {
      return $state.href('sharedData', {systemId: $scope.browser.listing.system, filePath: trailItem.path});
    };

    $scope.onBrowse = function($event, file) {
      $event.stopPropagation();
    
      var systemId = file.system || file.systemId;
      var filePath;
      if (file.path == '/'){
        filePath = file.path + file.name;
      } else {
        filePath = file.path;
      }
      if (file.type === 'file'){
        DataBrowserService.preview(file);
      } else {
        $state.go('sharedData', {systemId: file.system, filePath: file.path});
      }
    };

    $scope.onSelect = function($event, file) {
      $event.stopPropagation();

      if ($event.ctrlKey || $event.metaKey) {
        var selectedIndex = $scope.browser.selected.indexOf(file);
        if (selectedIndex > -1) {
          DataBrowserService.deselect([file]);
        } else {
          DataBrowserService.select([file]);
        }
      } else if ($event.shiftKey && $scope.browser.selected.length > 0) {
        var lastFile = $scope.browser.selected[$scope.browser.selected.length - 1];
        var lastIndex = $scope.browser.listing.children.indexOf(lastFile);
        var fileIndex = $scope.browser.listing.children.indexOf(file);
        var min = Math.min(lastIndex, fileIndex);
        var max = Math.max(lastIndex, fileIndex);
        DataBrowserService.select($scope.browser.listing.children.slice(min, max + 1));
      } else {
        DataBrowserService.select([file], true);
      }
    };

    $scope.showFullPath = function(item){
      if ($scope.browser.listing.path != '$PUBLIC' && 
          item.parentPath() != $scope.browser.listing.path &&
          item.parentPath() != '/'){
        return true;
      } else {
        return false;
      }
    };

    $scope.onDetail = function($event, file) {
      $event.stopPropagation();
      DataBrowserService.preview(file);
    };

  }]);
})(window, angular);
