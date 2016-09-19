(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('DataDepotNavCtrl', ['$scope', '$rootScope', '$state', 'Django', function($scope, $rootScope, $state, Django) {

    $scope.routerItems = [];

    $scope.myDataFileId = 'designsafe.storage.default/' + Django.user + '/';
    $scope.sharedFileId = 'designsafe.storage.default/$SHARE/';

    $scope.routerItems.push({
      name: 'Public',
      collapsible: true,
      collapse: true,
      active: false,
      children: [
        {
          name: 'Publications',
          collapsible: false,
          active: false,
          state: 'publications'
        },
        {
          name: 'Community Data',
          collapsible: false,
          active: false,
          state: 'communityData'
        },
        {
          name: 'Training Materials',
          collapsible: false,
          active: false,
          state: 'trainingMaterials'
        }
      ]
    });

    if (Django.context.authenticated) {
      $scope.routerItems.splice(0, 0, {
        name: 'Private',
        collapsible: true,
        collapse: false,
        active: true,
        children: [
          {
            name: 'My Data',
            collapsible: false,
            active: true,
            state: 'myData'
          },
          {
            name: 'My Projects',
            collapsible: false,
            active: false,
            state: 'myProjects'
          },
          {
            name: 'My Publications',
            collapsible: false,
            active: false,
            state: 'myPublications'
          },
          {
            name: 'Shared with Me',
            collapsible: false,
            active: false,
            state: 'sharedData'
          },
          {
            name: 'Box.com',
            collapsible: false,
            active: false,
            state: 'boxData'
          }
        ]
      });
      $scope.routerItems.push({
          name: 'Workspace',
          collapsible: true,
          collapse: true,
          active: false,
          children: [
            {
              name: 'Application Catalog',
              collapsible: false,
              active: false,
              state: 'applicationCatalog'
            },
            {
              name: 'Run Application',
              collapsible: false,
              active: false,
              state: 'runApplication'
            },
            {
              name: 'Job History',
              collapsible: false,
              active: false,
              state: 'jobHistory'
            }
          ]
        }
      );
    }

    $scope.itemClicked = function(routerItem) {
      if (routerItem.collapsible) {
        routerItem.collapse = ! routerItem.collapse;
      }
    };
  }]);
})(window, angular);
