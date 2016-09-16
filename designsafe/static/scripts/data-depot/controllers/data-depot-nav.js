(function(window, angular) {
  var app = angular.module('DataDepotApp');
  app.controller('DataDepotNavCtrl', ['$scope', 'Django', function($scope, Django) {

    $scope.routerItems = [];

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
          href: '/publications'
        },
        {
          name: 'Community Data',
          collapsible: false,
          active: false,
          href: '/community-data'
        },
        {
          name: 'Training Materials',
          collapsible: false,
          active: false,
          href: '/training-materials'
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
            href: '/agave/designsafe.storage.default/' + Django.user + '/'
          },
          {
            name: 'My Projects',
            collapsible: false,
            active: false,
            href: '/projects/'
          },
          {
            name: 'My Publications',
            collapsible: false,
            active: false,
            href: '/my-publications/'
          },
          {
            name: 'Shared with Me',
            collapsible: false,
            active: false,
            href: '/agave/designsafe.storage.default/$SHARE/'
          },
          {
            name: 'Box.com',
            collapsible: false,
            active: false,
            href: '/box/'
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
              href: '/workspace/catalog/'
            },
            {
              name: 'Run Application',
              collapsible: false,
              active: false,
              href: '/workspace/run/'
            },
            {
              name: 'Job History',
              collapsible: false,
              active: false,
              href: '/workspace/history/'
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
