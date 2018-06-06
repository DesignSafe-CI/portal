export function dataDepotNavCtrl(window, angular) {
  var app = angular.module('designsafe');
  app.requires.push('django.context');

  app.controller('DataDepotNavCtrl', ['$scope', '$rootScope', '$state', 'Django', function($scope, $rootScope, $state, Django) {

    $scope.routerItems = [];
    $scope.$state = $state;

    $scope.myDataFileId = 'designsafe.storage.default/' + Django.user + '/';
    $scope.sharedFileId = 'designsafe.storage.default/$SHARE/';

    $scope.routerItems.push(
        {
          name: 'Published',
          collapsible: false,
          state: 'publicData',
          description: "Curated data/projects with DOI's"
        },
        {
          name: 'Community Data',
          collapsible: false,
          state: 'communityData',
          description: 'Non-curated user-contributed data'
        }/*,
        {
          name: 'Training Materials',
          collapsible: false,
          state: 'trainingMaterials'
        }*/
    );

    if (Django.context.authenticated) {
      $scope.routerItems.splice(0, 0,
          {
            name: 'My Data',
            collapsible: false,
            state: 'myData',
            description: 'Private directory for your data'
          },
          {
            name: 'My Projects',
            collapsible: false,
            state: 'projects.list',
            description: 'Group access to shared directories'
          },/*
          {
            name: 'My Publications',
            collapsible: false,
            state: 'myPublications'
          },*/
          {
            name: 'Shared with Me',
            collapsible: false,
            state: 'sharedData',
            description: 'Data other users shared with me'
          },
          {
            name: 'Box.com',
            collapsible: false,
            state: 'boxData',
            description: 'Access to my Box files for copying'
          },
          {
            name: 'Dropbox.com',
            collapsible: false,
            state: 'dropboxData',
            description: 'Access to my Dropbox for copying'
          },
          {
            name: 'Google Drive',
            collapsible: false,
            state: 'googledriveData',
            description: 'Access to my Google Drive for copying'
          }
      );

      // $scope.routerItems.push({
      //     name: 'Workspace',
      //     collapsible: true,
      //     collapse: true,
      //     children: [
      //       {
      //         name: 'Application Catalog',
      //         collapsible: false,
      //         state: 'applicationCatalog'
      //       },
      //       {
      //         name: 'Run Application',
      //         collapsible: false,
      //         state: 'runApplication'
      //       },
      //       {
      //         name: 'Job History',
      //         collapsible: false,
      //         state: 'jobHistory'
      //       }
      //     ]
      //   }
      // );
    }

    $scope.itemClicked = function(routerItem) {
      if (routerItem.collapsible) {
        routerItem.collapse = ! routerItem.collapse;
      }
    };

    // allows state to be refreshed
    // by clicking current nav button
    $scope.stateReload = function(childItem) {
      if(childItem == $state.current.name) {
        $state.reload();
      }
    };

  }]);
}
