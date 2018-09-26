export function sharedData(window, angular) {
  var app = angular.module('ds-data');
  app.requires.push('django.context');

  app.controller('SharedDataCtrl', ['$scope', '$state', 'Django', 'DataBrowserService', function ($scope, $state, Django, DataBrowserService) {

    $scope.browser = DataBrowserService.state();

  if (! $scope.browser.error){
    $scope.browser.listing.href = $state.href('publicData', {
      system: $scope.browser.listing.system,
      filePath: $scope.browser.listing.path
    });
    _.each($scope.browser.listing.children, function (child) {
      child.href = $state.href('sharedData', {system: child.system, filePath: child.path});
    });
  }

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
      $event.preventDefault();
      $event.stopPropagation();

      var systemId = file.system || file.systemId;
      var filePath;
      if (file.path == '/'){
        filePath = file.path + file.name;
      } else {
        filePath = file.path;
      }
      if (typeof(file.type) !== 'undefined' && file.type !== 'dir' && file.type !== 'folder'){
        DataBrowserService.preview(file, $scope.browser.listing);
      } else {
        $state.go('sharedData', {systemId: file.system, filePath: file.path}, {reload: true});
      }
    };

    $scope.onSelect = function($event, file) {
      $event.preventDefault();
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
      } else if( typeof file._ui !== 'undefined' &&
                 file._ui.selected){
        DataBrowserService.deselect([file]);
      } else{
        DataBrowserService.select([file], true);
      }
    };

    $scope.showFullPath = function(item){
      if ($scope.browser.listing.path != '$SHARED' &&
          item.parentPath() != $scope.browser.listing.path &&
          item.parentPath() != '/'){
        return true;
      } else {
        return false;
      }
    };

    $scope.onDetail = function($event, file) {
      $event.preventDefault();
      $event.stopPropagation();
      DataBrowserService.preview(file, $scope.browser.listing);
    };
  }]);
}
