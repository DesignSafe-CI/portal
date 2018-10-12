import _ from 'underscore';
export function ExternalDataCtrl($scope, $state, Django, DataBrowserService) {
  $scope.browser = DataBrowserService.state();

  if (! $scope.browser.error){
    $scope.browser.listing.href = $state.href($state.current.name, {
      filePath: $scope.browser.listing.id
    });
    _.each($scope.browser.listing.children, function (child) {
      child.href = $state.href($state.current.name, {filePath: child.id});
    });
  }

  $scope.data = {
    customRoot: {
      name:  $state.current.params.name,
      href: $state.href($state.current.name, {filePath: $state.current.params.customRootFilePath})
    }
  };

   $scope.resolveBreadcrumbHref = function(trailItem) {
     return $state.href($state.current.name, {filePath: trailItem.path});
    };

    $scope.onBrowse = function($event, file) {
      $event.preventDefault();
      $event.stopPropagation();

      var filePath = file.id;
      if (typeof(file.type) !== 'undefined' && file.type !== 'dir' && file.type !== 'folder'){
        DataBrowserService.preview(file);
      } else {
        $state.go($state.current.name, {filePath: file.id});
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
      } else if (typeof file._ui !== 'undefined' &&
                 file._ui.selected){
        DataBrowserService.deselect([file]);
      } else {
        DataBrowserService.select([file], true);
      }
    };

    $scope.showFullPath = function(item){
      if ($scope.browser.listing.path != '/' &&
          item.parentPath() != $scope.browser.listing.path &&
          item.parentPath() != '/'){
        return true;
      } else {
        return false;
      }
    };

    $scope.onDetail = function($event, file) {
      $event.stopPropagation();
      DataBrowserService.preview(file, $scope.browser.listing);
    };

  }


//   app.controller('DropboxDataCtrl', ['$scope', '$state', 'Django',
//                                       'DataBrowserService',
//                   function ($scope, $state, Django, DataBrowserService) {
//   $scope.browser = DataBrowserService.state();

//   if (! $scope.browser.error){
//     $scope.browser.listing.href = $state.href('dropboxData', {
//       filePath: $scope.browser.listing.id
//     });
//     _.each($scope.browser.listing.children, function (child) {
//       child.href = $state.href('dropboxData', {filePath: child.id});
//     });
//   }

//   $scope.data = {
//     customRoot: {
//       name: 'Dropbox',
//       href: $state.href('dropboxData', {filePath: 'dropbox/'})
//     }
//   };

//    $scope.resolveBreadcrumbHref = function(trailItem) {
//       return $state.href('dropboxData', {filePath: trailItem.path});
//     };

//     $scope.onBrowse = function($event, file) {
//       $event.preventDefault();
//       $event.stopPropagation();

//       var filePath = file.id;
//       if (file.type === 'file'){
//         DataBrowserService.preview(file);
//       } else {
//         $state.go('dropboxData', {filePath: file.id});
//       }
//     };

//     $scope.onSelect = function($event, file) {
//       $event.preventDefault();
//       $event.stopPropagation();

//       if ($event.ctrlKey || $event.metaKey) {
//         var selectedIndex = $scope.browser.selected.indexOf(file);
//         if (selectedIndex > -1) {
//           DataBrowserService.deselect([file]);
//         } else {
//           DataBrowserService.select([file]);
//         }
//       } else if ($event.shiftKey && $scope.browser.selected.length > 0) {
//         var lastFile = $scope.browser.selected[$scope.browser.selected.length - 1];
//         var lastIndex = $scope.browser.listing.children.indexOf(lastFile);
//         var fileIndex = $scope.browser.listing.children.indexOf(file);
//         var min = Math.min(lastIndex, fileIndex);
//         var max = Math.max(lastIndex, fileIndex);
//         DataBrowserService.select($scope.browser.listing.children.slice(min, max + 1));
//       } else if (typeof file._ui !== 'undefined' &&
//                  file._ui.selected){
//         DataBrowserService.deselect([file]);
//       } else {
//         DataBrowserService.select([file], true);
//       }
//     };

//     $scope.showFullPath = function(item){
//       if ($scope.browser.listing.path != '/' &&
//           item.parentPath() != $scope.browser.listing.path &&
//           item.parentPath() != '/'){
//         return true;
//       } else {
//         return false;
//       }
//     };

//     $scope.onDetail = function($event, file) {
//       $event.stopPropagation();
//       DataBrowserService.preview(file, $scope.browser.listing);
//     };

//   }]);

