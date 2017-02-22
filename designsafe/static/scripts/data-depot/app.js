(function(window, angular) {
  var module = angular.module('designsafe');
  module.requires.push(
    'ui.router',
    'djng.urls',
    'ui.bootstrap',
    'django.context',
    'ds.notifications',
    'ds.wsBus',
    'toastr',
    'logging'
  );

  function config($httpProvider, $locationProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, Django, toastrConfig, UserService) {

    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);

    angular.extend(toastrConfig, {
      positionClass: 'toast-bottom-left',
      timeOut: 20000
    });

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
            DataBrowserService.apiParams.fileMgr = 'agave';
            DataBrowserService.apiParams.baseUrl = '/api/agave/files';
            DataBrowserService.apiParams.searchState = 'dataSearch';
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
      .state('dataSearch',{
        url: '/agave-search/?query_string&offset&limit',
        controller: 'MyDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/agave-search-data-listing.html',
        params: {
          systemId: 'designsafe.storage.default',
          filePath: '$SEARCH'
        },
        resolve: {
          'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
            var systemId = $stateParams.systemId || 'designsafe.storage.default';
            var filePath = $stateParams.filePath || Django.user;
            DataBrowserService.apiParams.fileMgr = 'agave';
            DataBrowserService.apiParams.baseUrl = '/api/agave/files';
            DataBrowserService.apiParams.searchState = 'dataSearch';
            var queryString = $stateParams.query_string;
            if (/[^A-Za-z0-9]/.test(queryString)){
              queryString = '"' + queryString + '"';
            }
            var options = {system: $stateParams.systemId, query_string: queryString, offset: $stateParams.offset, limit: $stateParams.limit};
            return DataBrowserService.search(options);
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

            DataBrowserService.apiParams.fileMgr = 'agave';
            DataBrowserService.apiParams.baseUrl = '/api/agave/files';
            DataBrowserService.apiParams.searchState = 'sharedDataSearch';
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
      .state('sharedDataSearch',{
        url: '/shared-search/?query_string&offset&limit&shared',
        controller: 'MyDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/agave-search-data-listing.html',
        params: {
          systemId: 'designsafe.storage.default',
          filePath: '$SEARCHSHARED',
          shared: 'true'
        },
        resolve: {
          'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
            var systemId = $stateParams.systemId || 'designsafe.storage.default';
            var filePath = $stateParams.filePath || Django.user;
            DataBrowserService.apiParams.fileMgr = 'agave';
            DataBrowserService.apiParams.baseUrl = '/api/agave/files';
            DataBrowserService.apiParams.searchState = 'sharedDataSearch';
            var queryString = $stateParams.query_string;
            if (/[^A-Za-z0-9]/.test(queryString)){
              queryString = '"' + queryString + '"';
            }
            var options = {system: $stateParams.systemId, query_string: queryString, offset: $stateParams.offset, limit: $stateParams.limit, shared: $stateParams.shared};
            return DataBrowserService.search(options);
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
        params: {
          projectTitle: ''
        },
        resolve: {
          'projectId': function($stateParams) { return $stateParams.projectId; },
          'filePath': function($stateParams) { return $stateParams.filePath || '/'; },
          'projectTitle': function($stateParams) { return $stateParams.projectTitle; }
        }
      })
      .state('myPublications', {
        url: '/my-publications/{publicationId}}/{fileId:any}/',
        templateUrl: '/static/scripts/data-depot/templates/enhanced-data-listing.html'
      })
      .state('boxData', {
        url: '/box/{filePath:any}',
        controller: 'BoxDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/box-data-listing.html',
        params: {
          filePath: ''
        },
        resolve: {
          'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
            var filePath = $stateParams.filePath || '/';
            DataBrowserService.apiParams.fileMgr = 'box';
            DataBrowserService.apiParams.baseUrl = '/api/external-resources/files';
            DataBrowserService.apiParams.searchState = undefined;
            return DataBrowserService.browse({path: filePath});
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
      .state('dropboxData', {
        url: '/dropbox/{filePath:any}',
        controller: 'DropboxDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/dropbox-data-listing.html',
        params: {
          filePath: ''
        },
        resolve: {
          'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
            var filePath = $stateParams.filePath || '/';
            DataBrowserService.apiParams.fileMgr = 'dropbox';
            DataBrowserService.apiParams.baseUrl = '/api/external-resources/files';
            DataBrowserService.apiParams.searchState = undefined;
            return DataBrowserService.browse({path: filePath});
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

      /* Public */
      .state('publicDataSearch',{
        url: '/public-search/?query_string&offset&limit',
        controller: 'PublicationDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/search-public-data-listing.html',
        params: {
          systemId: 'nees.public',
          filePath: '$SEARCH'
        },
        resolve: {
          'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
            var systemId = $stateParams.systemId || 'nees.public';
            var filePath = $stateParams.filePath || '/';
            DataBrowserService.apiParams.fileMgr = 'public';
            DataBrowserService.apiParams.baseUrl = '/api/public/files';
            DataBrowserService.apiParams.searchState = 'publicDataSearch';
            var queryString = $stateParams.query_string;
            if (/[^A-Za-z0-9]/.test(queryString)){
              queryString = '"' + queryString + '"';
            }
            var options = {system: $stateParams.systemId, query_string: queryString, offset: $stateParams.offset, limit: $stateParams.limit};
            return DataBrowserService.search(options);
          }],
          'auth': function($q) {
              return true;
          }
        }
      })
      .state('publicData', {
        url: '/public/{systemId}/{filePath:any}',
        controller: 'PublicationDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/agave-public-data-listing.html',
        params: {
          systemId: 'nees.public',
          filePath: ''
        },
        resolve: {
          'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
            var systemId = $stateParams.systemId || 'nees.public';
            var filePath = $stateParams.filePath || '/';
            DataBrowserService.apiParams.fileMgr = 'public';
            DataBrowserService.apiParams.baseUrl = '/api/public/files';
            DataBrowserService.apiParams.searchState = 'publicDataSearch';
            return DataBrowserService.browse({system: systemId, path: filePath});
          }],
          'auth': function($q) {
              return true;
          },
          userAuth: ['UserService', function (UserService) {
            return UserService.authenticate().then(function (resp) {
              return true;
            }, function (err) {
              return false;
            });
          }]
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

  module
    .config(['$httpProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', 'Django', 'toastrConfig', config])
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

  module
    .config(['WSBusServiceProvider', function(WSBusServiceProvider){

        WSBusServiceProvider.setUrl(
            (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
            window.location.hostname +
            (window.location.port ? ':' + window.location.port : '') +
            '/ws/websockets?subscribe-broadcast&subscribe-user'
        );
	}])
// 	.run(['WSBusService', 'Logging', function init(WSBusService, logger){
// 	  WSBusService.init(WSBusService.url);
//     }]);

//   module
// 	.run(['NotificationService', 'Logging', function init(NotificationService, logger){
// 	  NotificationService.init();
// }]);

})(window, angular);
