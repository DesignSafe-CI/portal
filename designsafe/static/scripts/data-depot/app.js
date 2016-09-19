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
      .state('agaveDataDefault', {
        url: '/agave/',
        abstract: true,
        controller: ['$state', function($state) {}],
        template: '<ui-view/>'
      })
      .state('agaveData', {
        url: '/agave/{fileId:any}',
        abstract: true,
        controller: ['$state', function($state) {}],
        template: '<ui-view/>'
      })
      .state('myData', {
        controller: 'MyDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/agave-data-listing.html',
        params: {
          fileId: 'designsafe.storage.default/' + Django.user + '/'
        }
      })
      .state('sharedData', {
        controller: 'SharedDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/agave-data-listing.html',
        params: {
          fileId: 'designsafe.storage.default/$SHARE/'
        }
      })
      .state('myProjects', {
        url: '/projects/{projectId}/{fileId:any}',
        controller: 'ProjectListingCtrl',
        templateUrl: '/static/scripts/data-depot/templates/project-listing.html',
        resolve: {
          'projectId': function($stateParams) { return $stateParams.projectId; },
          'fileId': function($stateParams) { return $stateParams.fileId; }
        }
      })
      .state('myPublications', {
        url: '/my-publications/{publicationId}}/{fileId:any}',
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
