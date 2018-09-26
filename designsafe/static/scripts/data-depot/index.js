import $ from 'jquery';
import angular from 'angular';
import _ from 'underscore';
console.log('index get.')

import { communityDataCtrl } from './controllers/community';
import { dataDepotNavCtrl } from './controllers/data-depot-nav';
import {dataDepotNewCtrl } from './controllers/data-depot-new'
//import { DataDepotToolbarComponent } from './components/data-depot-toolbar/data-depot-toolbar.component'
import { externalDataCtrl } from './controllers/external-data';
import { mainCtrl } from './controllers/main';
import { myDataCtrl } from '../data-depot/controllers/my-data';
import { projectsController } from '../data-depot/controllers/projects';
import { publicationDataCtrl } from '../data-depot/controllers/publications';
import { publishedDataCtrl } from '../data-depot/controllers/published';
import { sharedData } from '../data-depot/controllers/shared-data';






let ddModule = angular.module('ds-data', ['designsafe']);
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

import { DataBrowserServicePreviewComponent } from './components/modals/data-browser-service-preview/data-browser-service-preview.component'
//components
ddModule.component('ddtoolbar', DataDepotToolbarComponent)

import { DataDepotNavComponent } from './components/data-depot-nav/data-depot-nav.component'
ddModule.component('ddnav', DataDepotNavComponent)

import { DataBrowserServiceMoveComponent } from './components/modals/data-browser-service-move/data-browser-service-move.component'
//console.log(DataBrowserServiceMoveComponent)
ddModule.component('move', DataBrowserServiceMoveComponent)

//modals
import { DataDepotToolbarComponent } from './components/data-depot-toolbar/data-depot-toolbar.component'
ddModule.component('preview', DataBrowserServicePreviewComponent)



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
      template: require('./templates/agave-data-listing.html'),
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
      template: require('./templates/agave-search-data-listing.html'),
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
      controller: 'SharedDataCtrl',
      template: require('./templates/agave-shared-data-listing.html'),
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
      template: require('./templates/agave-search-data-listing.html'),
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
        controller: 'ProjectRootCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-root.html'
      })
      .state('projects.list', {
        url: '/projects/',
        controller: 'ProjectListingCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-list.html',
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

          }],
        }
    
      })
      .state('projects.view', {
        url: '/projects/{projectId}/',
        abstract: true,
        controller: 'ProjectViewCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-view.html',
        resolve: {
          'projectId': function($stateParams) { return $stateParams.projectId; }
        }
      })
      .state('projects.view.data', {
        url: '{filePath:any}?query_string&offset&limit',
        controller: 'ProjectDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-data.html',
        params: {
          projectTitle: '',
          query_string: '',
          filePath: '/'
        },
        resolve: {
          'projectId': function($stateParams) { return $stateParams.projectId; },
          'filePath': function($stateParams) { return $stateParams.filePath || '/'; },
          'projectTitle': function($stateParams) { return $stateParams.projectTitle; },
          'query_string': function($stateParams) { return $stateParams.query_string || ''; }
        }
      })
      .state('projects.search', {
        url: '/project-search/?query_string&offset&limit&projects',
        controller: 'ProjectSearchCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-search.html',
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
        templateUrl: '/static/scripts/data-depot/templates/enhanced-data-listing.html'
      })
      .state('boxData', {
        url: '/box/{filePath:any}',
        controller: 'ExternalDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/box-data-listing.html',
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
      controller: 'ExternalDataCtrl',
      template: require('./templates/dropbox-data-listing.html'),
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
      controller: 'ExternalDataCtrl',
      template: require('./templates/googledrive-data-listing.html'),
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

    /* Public */
    .state('publicDataSearch',{
      url: '/public-search/?query_string&offset&limit',
      controller: 'PublicationDataCtrl',
      template: require('./templates/search-public-data-listing.html'),
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

    .state('communityDataSearch',{
      url: '/community-search/?query_string&offset&limit',
      controller: 'CommunityDataCtrl',
      template: require('./templates/agave-search-data-listing.html'),
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
      controller: 'CommunityDataCtrl',
      template: require('./templates/agave-data-listing.html'),
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
    .state('publicData', {
      url: '/public/nees.public/{filePath:any}',
      controller: 'PublicationDataCtrl',
      template: require('./templates/agave-public-data-listing.html'),
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
    .state('publishedData', {
      url: '/public/designsafe.storage.published/{filePath:any}',
      controller: 'PublishedDataCtrl',
      template: require('./templates/published-data-listing.html'),
      params: {
        systemId: 'designsafe.storage.published',
        filePath: '',
      },
      resolve: {
        'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService){
          var systemId = $stateParams.systemId || 'designsafe.storage.published';
          var filePath = $stateParams.filePath;
          DataBrowserService.apiParams.fileMgr = 'published';
          DataBrowserService.apiParams.baseUrl = '/api/public/files';
          DataBrowserService.apiParams.searchState = 'publicDataSearch';
          return DataBrowserService.browse({system: systemId, path: filePath});
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
      console.log('statechangestart happened')
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

communityDataCtrl(window, angular);
//dataDepotNavCtrl(window, angular);
dataDepotNewCtrl(window, angular);
//dataDepotToolbarCtrl(window, angular);
externalDataCtrl(window, angular);
mainCtrl(window, angular);
myDataCtrl(window, angular, _);
projectsController(window, angular);
publicationDataCtrl(window, angular);
publishedDataCtrl(window, angular);
sharedData(window, angular);

export default ddModule