(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('PublicationDataCtrl', ['$scope', '$state', 'Django', 'DataBrowserService', 
                 function ($scope, $state, Django, DataBrowserService) {
  }]);

  $scope.browser = DataBrowserService.state();

  $scope.data = {
    user: Django.user,
    customRoot: {
      name: 'Publications',
      href: $steate.href('publications', {systemId: $scope.browser.listing.system, 
                                          filePath: 'public/'})
    }
  };
})(window, angular);
