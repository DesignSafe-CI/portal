(function(window, angular) {
  var app = angular.module('designsafe');
  app.requires.push('django.context');

  app.controller('PublicationDataCtrl', ['$scope', '$state', 'Django',
                                         'DataBrowserService',
                 function ($scope, $state, Django, DataBrowserService) {

  $scope.browser = DataBrowserService.state();
  $scope.state = {
        loadingMore : false,
        reachedEnd : false,
        page : 0
      };

  if (! $scope.browser.error){
    $scope.browser.listing.href = $state.href('publicData', {
      system: $scope.browser.listing.system,
      filePath: $scope.browser.listing.path
    });
    _.each($scope.browser.listing.children, function (child) {
      if(child.system === 'nees.public'){
        child.href = $state.href('publicData', {system: child.system, filePath: child.path});
      }
      if(child.system === 'designsafe.storage.published'){
        child.href = $state.href('publishedData', {system: child.system, filePath: child.path});
      }
    });
  }

  $scope.data = {
    customRoot: {
      name: 'Published',
      href: $state.href('publicData', {systemId: 'nees.public', filePath: ''}),
      system: 'nees.public',
      path: '/'
    }
  };

    $scope.resolveBreadcrumbHref = function(trailItem) {
      return $state.href('publicData', {systemId: $scope.browser.listing.system, filePath: trailItem.path});
    };

    $scope.scrollToTop = function(){
      return;
    };
    $scope.scrollToBottom = function(){
      DataBrowserService.scrollToBottom();
    };

    $scope.onBrowse = function($event, file) {
      console.log('I am printing from on browser publications.js')
      $event.preventDefault();
      $event.stopPropagation();

      var systemId = file.system || file.systemId;
      console.log (systemId)
      var filePath;
      console.log(filePath)
      if (file.path == '/'){
        filePath = file.path + file.name;
      } else {
        filePath = file.path;
      }
      if (typeof(file.type) !== 'undefined' && file.type !== 'dir' && file.type !== 'folder'){
        DataBrowserService.preview(file, $scope.browser.listing);
      } else {
        if (file.system === 'nees.public'){
          // DataBrowserService.viewMetadata([file], $scope.browser.listing);
          $state.go('publicData', {systemId: file.system, filePath: file.path});
          // designsafe.dev/data/browser/public/nees.public//NEES-2006-0202.groups
        } else {
          $state.go('publishedData', {systemId: file.system, filePath: file.path});
          // designsafe.dev/data/browser/public/designsafe.storage.published//PRJ-2056
        }
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
      DataBrowserService.preview(file, $scope.browser.listing);
    };

    $scope.onMetadata = function($event, file) {
      $event.stopPropagation();
      DataBrowserService.viewMetadata([file], $scope.browser.listing);
    };

    $scope.renderName = function(file){
      console.log('I am printing from publications.js')
      if (typeof file.metadata === 'undefined' ||
          file.metadata === null ||
          _.isEmpty(file.metadata)){
          if(file.meta && file.meta.title){
              return file.meta.title;
          } else {
            return file.name;
            }
      }
      var pathComps = file.path.split('/');
      var experiment_re = /^experiment/;
      if (file.path[0] === '/' && pathComps.length === 2) {
        return file.metadata.project.title;
      }
      else if (file.path[0] !== '/' &&
               pathComps.length === 2 &&
               experiment_re.test(file.name.toLowerCase())){
        return file.metadata.experiments[0].title;
      }
      return file.name;
    };

  }]);
})(window, angular);
