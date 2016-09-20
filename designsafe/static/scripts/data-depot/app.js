(function(window, angular) {
  var dataDepotApp = angular.module('DataDepotApp', ['ui.router', 'djng.urls', 'ui.bootstrap', 'ng.designsafe', 'django.context']);

  function config($httpProvider, $locationProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, Django) {

    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);

    $urlRouterProvider.rule(function($injector, $location) {

    });

    $stateProvider

      /* Private */
      .state('agaveData', {
        url: '/agave/{fileId:any}/',
        controllerProvider: ['$stateParams', 'DataService', function($stateParams, DataService) {
          var parsedFileId = DataService.parseFileId($stateParams.fileId);
          if (parsedFileId.user === Django.user) {
            return 'MyDataCtrl';
          } else {
            return 'SharedDataCtrl';
          }
        }],
        templateUrl: function() {
          return '/static/scripts/data-depot/templates/agave-data-listing.html';
        }
      })
      .state('myData', {
        controller: ['$state', function($state) {
          $state.go('agaveData', {fileId: $state.params.fileId});
        }],
        template: '',
        params: {
          fileId: 'designsafe.storage.default/' + Django.user
        }
      })
      .state('sharedData', {
        controller: ['$state', function($state) {
          $state.go('agaveData', {fileId: $state.params.fileId});
        }],
        template: '',
        params: {
          fileId: 'designsafe.storage.default/$SHARE'
        }
      })
      .state('projects', {
        url: '/projects/',
        abstract: true,
        controller: 'ProjectRootCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-root.html'
      })
      .state('projects.list', {
        url: '',
        controller: 'ProjectListingCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-listing.html'
      })
      .state('projects.view', {
        url: '{projectId}/',
        controller: 'ProjectViewCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-view.html',
        resolve: {
          'projectId': function($stateParams) { return $stateParams.projectId; },
          'filePath': function() { return ''; }
        }
      })
      .state('projects.viewData', {
        url: '{projectId}/{filePath:any}/',
        controller: 'ProjectViewCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-view.html',
        resolve: {
          'projectId': function($stateParams) { return $stateParams.projectId; },
          'filePath': function($stateParams) { return $stateParams.filePath; }
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
      // .state('allPublications', {
      //   template: '<pre>local/allPublications.html</pre>'
      // })
      // .state('communityData', {
      //   template: '<pre>local/communityData.html</pre>'
      // })
      // .state('trainingMaterials', {
      //   template: '<pre>local/trainingMaterials.html</pre>'
      // })

      /* Workspace */
      // .state('applicationCatalog', {
      //   template: '<pre>local/applicationCatalog.html</pre>'
      // })
      // .state('runApplication', {
      //   template: '<pre>local/runApplication.html</pre>'
      // })
      // .state('jobHistory', {
      //   template: '<pre>local/jobHistory.html</pre>'
      // })
    ;

    $urlRouterProvider.otherwise('/agave/');
  }

  dataDepotApp.config(['$httpProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', 'Django', config]);

})(window, angular);
