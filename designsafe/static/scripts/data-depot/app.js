(function(window, angular) {
  var dataDepotApp = angular.module('DataDepotApp', ['ui.router', 'djng.urls', 'ui.bootstrap', 'ng.designsafe', 'django.context']);

  function config($httpProvider, $locationProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, Django) {

    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);

    $stateProvider

      /* Private */
      .state('myData', {
        url: '/agave/{systemId}/{filePath:any}/',
        controller: 'MyDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/agave-data-listing.html',
        params: {
          systemId: 'designsafe.storage.default',
          filePath: Django.user
        },
        resolve: {
          'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
            var options = {
              system: ($stateParams.systemId || 'designsafe.storage.default'),
              path: ($stateParams.filePath || Django.user)
            };
            if (options.path === '/') {
              options.path = Django.user;
            }
            return DataBrowserService.browse(options);
          }],
          'auth': function($q) {
            if (Django.context.authenticated) {
              return true;
            } else {
              return $q.reject({
                type: 'authn',
                context: Django.context
              });
            }
          }
        }
      })
      .state('sharedData', {
        url: '/shared/{systemId}/{filePath:any}/',
        controller: 'SharedDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/agave-shared-data-listing.html',
        params: {
          systemId: 'designsafe.storage.default',
          filePath: '$SHARE'
        },
        resolve: {
          'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
            var systemId = $stateParams.systemId || 'designsafe.storage.default';
            var filePath = $stateParams.filePath || '$SHARE/';

            return DataBrowserService.browse({system: systemId, path: filePath});
          }],
          'auth': function($q) {
            if (Django.context.authenticated) {
              return true;
            } else {
              return $q.reject({
                type: 'authn',
                context: Django.context
              });
            }
          }
        }
      })
      .state('projects', {
        url: '/projects/',
        controller: 'ProjectRootCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-root.html'
      })
      .state('projects.list', {
        url: '',
        controller: 'ProjectListingCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-list.html'
      })
      .state('projects.view', {
        url: '{projectId}/',
        abstract: true,
        controller: 'ProjectViewCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-view.html',
        resolve: {
          'projectId': function($stateParams) { return $stateParams.projectId; }
        }
      })
      .state('projects.view.data', {
        url: '{filePath:any}',
        controller: 'ProjectDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-data.html',
        resolve: {
          'projectId': function($stateParams) { return $stateParams.projectId; },
          'filePath': function($stateParams) { return $stateParams.filePath || '/'; }
        }
      })
      .state('myPublications', {
        url: '/my-publications/{publicationId}}/{fileId:any}/',
        templateUrl: '/static/scripts/data-depot/templates/enhanced-data-listing.html'
      })
      .state('boxData', {
        url: '/box/{fileId:any}/',
        templateUrl: '/static/scripts/data-depot/templates/external-data-listing.html'
      })

      /* Public */
      .state('publicData', {
        url: '/public/{systemId}/{filePath:any}/',
        templateUrl: '/static/scripts/data-depot/templates/agave-public-data-listing.html',
        params: {
          systemId: 'nees.public',
          filePath: '/'
        },
        resolve: {
          'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
            var systemId = $stateParams.systemId || 'nees.public';
            var filePath = $stateParams.filePath || '/';

            return DataBrowserService.browse({system: systemId, path: filePath});
          }],
          'auth': function($q) {
            if (Django.context.authenticated) {
              return true;
            } else {
              return $q.reject({
                type: 'authn',
                context: Django.context
              });
            }
          }
        }
      })
      .state('communityData', {
        url: '/community/',
        template: '<pre>local/communityData.html</pre>'
      })
      .state('trainingMaterials', {
        url: '/training/',
        template: '<pre>local/trainingMaterials.html</pre>'
      })
    ;

    $urlRouterProvider.otherwise(function($injector, $location) {
      var $state = $injector.get('$state');

      /* Default to MyData for authenticated users, PublicData for anonymous */
      if (Django.context.authenticated) {
        $state.go('myData', {
          systemId: 'designsafe.storage.default',
          filePath: Django.user
        });
      } else {
        $state.go('publicData');
      }
    });
  }

  dataDepotApp
    .config(['$httpProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', 'Django', config])
    .run(['$rootScope', '$location', '$state', 'Django', function($rootScope, $location, $state, Django) {
      $rootScope.$state = $state;

      $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
        if (toState.name === 'myData' || toState.name === 'sharedData') {
          var ownerPath = new RegExp('^/?' + Django.user).test(toParams.filePath);
          if (toState.name === 'myData' && !ownerPath) {
            event.preventDefault();
            $state.go('sharedData', toParams);
          } else if (toState.name === 'sharedData' && ownerPath) {
            event.preventDefault();
            $state.go('myData', toParams);
          }
        }
      });

      // $rootScope.$on('$stateChangeSuccess', function() {});

      $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
        if (error.type === 'authn') {
          var redirectUrl = $state.href(toState.name, toParams);
          window.location = '/login/?next=' + redirectUrl;
        }
      });
    }]);

})(window, angular);
