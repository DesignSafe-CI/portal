import _ from 'underscore';
import MyDataTemplate from './my-data.component.html';

export function MyDataCtrl($scope, $state, Django, DataBrowserService) {
    'ngInject';
    $scope.browser = DataBrowserService.state();
    $scope.searchState = DataBrowserService.apiParams.searchState;

    if (! $scope.browser.error) {
      $scope.browser.listing.href = $state.href('myData', {
        system: $scope.browser.listing.system,
        filePath: $scope.browser.listing.path
      });
      _.each($scope.browser.listing.children, function (child) {
        child.href = $state.href('myData', {systemId: child.system, filePath: child.path});
      });
    }

    $scope.data = {
      user: Django.user
    };

    $scope.scrollToTop = function(){
      return;
    };
    $scope.scrollToBottom = function(){
      DataBrowserService.scrollToBottom();
    };

    $scope.resolveBreadcrumbHref = function (trailItem) {
      return $state.href('myData', {systemId: $scope.browser.listing.system, filePath: trailItem.path});
    };

    $scope.onBrowse = function ($event, file) {
      $event.preventDefault();
      $event.stopPropagation();
      if (typeof(file.type) !== 'undefined' && file.type !== 'dir' && file.type !== 'folder') {
        DataBrowserService.preview(file, $scope.browser.listing);
      } else {
        $state.go('myData', {systemId: file.system, filePath: file.path}, {reload: true});
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
      } else if( typeof file._ui !== 'undefined' &&
                 file._ui.selected){
        DataBrowserService.deselect([file]);
      } else {
        DataBrowserService.select([file], true);
      }
    };

    $scope.onDetail = function($event, file) {
      $event.stopPropagation();
      DataBrowserService.preview(file, $scope.browser.listing);
    };

  }

  export const MyDataComponent = {
    controller: MyDataCtrl,
    controllerAs: '$ctrl',
    template: MyDataTemplate
}