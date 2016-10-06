(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('SharedDataCtrl', ['$scope', '$state', 'Django', 'DataBrowserService', function ($scope, $state, Django, DataBrowserService) {

    $scope.browser = DataBrowserService.state();

    $scope.data = {
      user: Django.user,
      customRoot: {
        name: 'Shared with me',
        href: $state.href('sharedData', {systemId: $scope.browser.listing.system, filePath: '$SHARE/'})}
    };

    $scope.resolveBreadcrumbHref = function(trailItem) {
      return $state.href('sharedData', {systemId: $scope.browser.listing.system, filePath: trailItem.path});
    };

    $scope.onBrowse = function($event, file) {
      $event.stopPropagation();

      var systemId = file.system || file.systemId;
      var filePath;
      if (file.path === '/') {
        filePath = file.path + file.name;
      } else {
        filePath = file.path;
      }
      $state.go('sharedData', {systemId: systemId, filePath: filePath});
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

    $scope.onDetail = function($event, file) {
      $event.stopPropagation();
    };
  }]);
})(window, angular);
