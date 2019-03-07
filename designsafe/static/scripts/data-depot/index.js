import $ from 'jquery';
import angular from 'angular';
import _ from 'underscore';

import './../ng-designsafe/providers';
import './components';
import './services';

let ddModule = angular.module('ds-data', ['designsafe', 'dd.components', 'dd.services']);
ddModule.requires.push(
  'ui.router',
  'djng.urls', //TODO: djng
  'ui.bootstrap',
  'django.context',
  'ds.notifications',
  'ds.wsBus',
  'toastr',
  'logging',
  'ui.customSelect',
  'ngSanitize'
);
angular.module('designsafe.portal').requires.push(
    'ds-data'
);

function config($httpProvider, $locationProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, Django, toastrConfig, UserService) {
    'ngInject';

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
      //controller: 'MyDataCtrl',
      //template: require('./templates/agave-data-listing.html'),
      component: 'myData',
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
      //controller: 'MyDataCtrl',
      //template: require('./templates/agave-search-data-listing.html'),
      component: 'my-data',
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
          //if (/[^A-Za-z0-9]/.test(queryString)){
          //  queryString = '"' + queryString + '"';
          //}
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
      //controller: 'SharedDataCtrl',
      //template: require('./templates/agave-shared-data-listing.html'),
      component: 'shared',
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
      //controller: 'MyDataCtrl',
      //template: require('./templates/agave-search-data-listing.html'),
      component: 'my-data',
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
          //if (/[^A-Za-z0-9]/.test(queryString)){
          //  queryString = '"' + queryString + '"';
          //}
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
        abstract:true,
        //controller: 'ProjectRootCtrl',
        //template: require('./templates/project-root.html')
        component: 'projectRoot',
      })
      .state('projects.list', {
        url: '/projects/',
        //controller: 'ProjectListingCtrl',
        //template: require('./templates/project-list.html'),
        component: 'projectListing',
        params: {
          systemId: 'designsafe.storage.default'
        },
        resolve: {
          'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
            DataBrowserService.apiParams.searchState = 'projects.search';
            var options = {
              system: ($stateParams.systemId || 'designsafe.storage.default'),
              path: ($stateParams.filePath || Django.user)

            };
            if (options.path === '/') {
              options.path = Django.user;
            }

            DataBrowserService.currentState.listing = {'system': 'designsafe.storage.default', 'permissions': []}

          }]
        }

      })
      .state('projects.view', {
        url: '/projects/{projectId}/',
        abstract: true,
        //controller: 'ProjectViewCtrl',
        //template: require('./templates/project-view.html'),
        component: 'projectView',
        resolve: {
          projectId: ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
            ProjectService.resolveParams.projectId = $stateParams.projectId;
            return $stateParams.projectId; }]
        }
      })
      .state('projects.view.data', {
        url: '{filePath:any}?query_string&offset&limit',
        //controller: 'ProjectDataCtrl',
        //template: require('./templates/project-data.html'),
        component: 'projectData',
        params: {
          projectTitle: '',
          query_string: '',
          filePath: '/'
        },
        resolve: {'params': ['$stateParams', 'ProjectService', ($stateParams, ProjectService) => {
          ProjectService.resolveParams.projectId = $stateParams.projectId;
          ProjectService.resolveParams.filePath = $stateParams.filePath || '/';
          ProjectService.resolveParams.projectTitle = $stateParams.projectTitle;
          ProjectService.resolveParams.query_string = $stateParams.query_string || '';

        }]}
        //{
        //  'projectId': function($stateParams) { return $stateParams.projectId; },
        //  'filePath': function($stateParams) { return $stateParams.filePath || '/'; },
        //  'projectTitle': function($stateParams) { return $stateParams.projectTitle; },
        //  'query_string': function($stateParams) { return $stateParams.query_string || ''; }
        //}
      })
      .state('projects.search', {
        url: '/project-search/?query_string&offset&limit&projects',
        //controller: 'ProjectSearchCtrl',
        //template: require('./templates/project-search.html'),
        component: 'projectSearch',
        params: {
          systemId: 'designsafe.storage.default',
          filePath: ''
        },
        resolve: {
          'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
            var systemId = $stateParams.systemId || 'designsafe.storage.default';
            var filePath = $stateParams.filePath || Django.user;
            DataBrowserService.apiParams.fileMgr = 'agave';
            DataBrowserService.apiParams.baseUrl = '/api/agave/files';
            DataBrowserService.apiParams.searchState = 'projects.search';
            var queryString = $stateParams.query_string;

            var options = {system: $stateParams.systemId, query_string: queryString, offset: $stateParams.offset, limit: $stateParams.limit, projects: true};
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
      .state('myPublications', {
        url: '/my-publications/{publicationId}}/{fileId:any}/',
        templateUrl: './data-depot/templates/enhanced-data-listing.html'
      })
      .state('boxData', {
        url: '/box/{filePath:any}',
        //controller: 'ExternalDataCtrl',
        //template: require('./templates/box-data-listing.html'),
        component: 'box',
        params: {
          filePath: '',
          name: 'Box',
          customRootFilePath: 'box/'
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
      //controller: 'ExternalDataCtrl',
      //template: require('./templates/dropbox-data-listing.html'),
      component: 'dropbox',
      params: {
        filePath: '',
        name: 'Dropbox',
        customRootFilePath: 'dropbox/'
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
    .state('googledriveData', {
      url: '/googledrive/{filePath:any}',
      //controller: 'ExternalDataCtrl',
      //template: require('./templates/googledrive-data-listing.html'),
      component: 'googleDrive',
      params: {
        filePath: '',
        name: 'Google Drive',
        customRootFilePath: 'googledrive/'
      },
      resolve: {
        'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
          var filePath = $stateParams.filePath || '/';
          DataBrowserService.apiParams.fileMgr = 'googledrive';
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
    .state('communityDataSearch',{
      url: '/community-search/?query_string&offset&limit',
      //controller: 'CommunityDataCtrl',
      //template: require('./templates/agave-search-data-listing.html'),
      component: 'community',
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
          DataBrowserService.apiParams.searchState = 'communityDataSearch';
          var queryString = $stateParams.query_string;
          //if (/[^A-Za-z0-9]/.test(queryString)){
          //  queryString = '"' + queryString + '"';
          //}
          var options = {system: $stateParams.systemId, query_string: queryString, offset: $stateParams.offset, limit: $stateParams.limit};
          return DataBrowserService.search(options);
        }],
        'auth': function($q) {
            return true;
        }
      }
    })


    .state('communityData', {
      // url: '/community/',
      // template: '<pre>local/communityData.html</pre>'
      url: '/public/designsafe.storage.community/{filePath:any}',
      //controller: 'CommunityDataCtrl',
      //template: require('./templates/agave-data-listing.html'),
      component: 'community',
      params: {
        systemId: 'designsafe.storage.community',
        filePath: '/'
      },
      resolve: {
        'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
          var options = {
            system: ($stateParams.systemId || 'designsafe.storage.community'),
            path: ($stateParams.filePath || '/')
          };
          // if (options.path === '/') {
            // options.path = Django.user;
          // }
          DataBrowserService.apiParams.fileMgr = 'community';
          DataBrowserService.apiParams.baseUrl = '/api/public/files';
          DataBrowserService.apiParams.searchState = 'communityDataSearch';
          return DataBrowserService.browse(options);
        }],
        'auth': function($q) {
            return true;
        }
      }
    })
    .state('neesPublishedData', {
      url: '/public/nees.public{filePath:any}',
      component: 'neesPublicationComponent',
      params: {
        filePath: undefined
      }
    })
    .state('publicData', {
      url: '/public/nees.public?query_string',
      //controller: 'PublicationDataCtrl',
      //template: require('./templates/agave-public-data-listing.html'),
      component: 'publications',
      params: {
        systemId: 'nees.public',
        filePath: '',
        query_string: null
      },
      resolve: {
        'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
          var systemId = $stateParams.systemId || 'nees.public';
          var filePath = $stateParams.filePath || '/';
          DataBrowserService.apiParams.fileMgr = 'public';
          DataBrowserService.apiParams.baseUrl = '/api/public/files';
          DataBrowserService.apiParams.searchState = 'publicData';
          //return DataBrowserService.browse({system: systemId, path: filePath}, {queryString: $stateParams.query_string});
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
    .state('publishedData', {
      url: '/public/designsafe.storage.published/{filePath:any}?query_string',
      //controller: 'PublishedDataCtrl',
      //template: require('./templates/published-data-listing.html'),
      component: 'published',
      params: {
        systemId: 'designsafe.storage.published',
        filePath: '',
        query_string: null,
      },
      onExit: ($window) => {
        $window.document.getElementsByName('description')[0].content = ""
        $window.document.getElementsByName('citation_title')[0].content = ""
        $window.document.getElementsByName('citation_title')[0].content = ""
        $window.document.getElementsByName('citation_publication_date')[0].content = ""
        $window.document.getElementsByName('citation_doi')[0].content = ""
        $window.document.getElementsByName('citation_abstract_html_url')[0].content = ""
        
        var elements = $window.document.getElementsByName('citation_author')
        while (elements[0]) elements[0].parentNode.removeChild(elements[0])
        var elements = $window.document.getElementsByName('citation_author_institution')
        while (elements[0]) elements[0].parentNode.removeChild(elements[0])
        var elements = $window.document.getElementsByName('citation_keywords')
        while (elements[0]) elements[0].parentNode.removeChild(elements[0])
      },
      resolve: {
        'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService){
          var systemId = $stateParams.systemId || 'designsafe.storage.published';
          var filePath = $stateParams.filePath;
          DataBrowserService.apiParams.fileMgr = 'published';
          DataBrowserService.apiParams.baseUrl = '/api/public/files';
          DataBrowserService.apiParams.searchState = 'publishedData';
          return DataBrowserService.browse({system: systemId, path: filePath}, {queryString: $stateParams.query_string});
        }],
        'auth': function($q){
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

ddModule
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

ddModule
  .config(['WSBusServiceProvider', function(WSBusServiceProvider){

      WSBusServiceProvider.setUrl(
          (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
          window.location.hostname +
          (window.location.port ? ':' + window.location.port : '') +
          '/ws/websockets?subscribe-broadcast&subscribe-user'
      );
}]);
// 	.run(['WSBusService', 'Logging', function init(WSBusService, logger){
// 	  WSBusService.init(WSBusService.url);
//     }]);

//   module
// 	.run(['NotificationService', 'Logging', function init(NotificationService, logger){
// 	  NotificationService.init();
// }]);

/*
communityDataCtrl(window, angular);
dataDepotNewCtrl(window, angular);
externalDataCtrl(window, angular);
mainCtrl(window, angular);
myDataCtrl(window, angular, _);
projectsController(window, angular);
publicationDataCtrl(window, angular);
publishedDataCtrl(window, angular);
sharedData(window, angular);
*/
export default ddModule
