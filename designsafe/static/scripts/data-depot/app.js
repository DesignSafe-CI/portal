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
      .state('agave', {
        url: '/agave/{fileId:any}',
        abstract: true
      })
      .state('agave.myData', {
        url: '',
        controller: 'MyDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/agave-data-listing.html'
      })
      .state('agave.sharedData', {
        url: '',
        controller: 'SharedDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/agave-data-listing.html'
      })
      .state('myProjects', {
        url: '/projects/{fileId:any}',
        templateUrl: '/static/scripts/data-depot/templates/enhanced-data-listing.html'
      })
      .state('myPublications', {
        url: '/my-publications/{fileId:any}',
        templateUrl: '/static/scripts/data-depot/templates/enhanced-data-listing.html'
      })
      .state('boxData', {
        url: '/box/{fileId:any}?',
        templateUrl: '/static/scripts/data-depot/templates/external-data-listing.html'
      })

      /* Public */
      .state('allPublications', {
        url: '/publications',
        template: '<pre>local/allPublications.html</pre>'
      })
      .state('communityData', {
        url: '/community-data',
        template: '<pre>local/communityData.html</pre>'
      })
      .state('trainingMaterials', {
        url: '/training-materials',
        template: '<pre>local/trainingMaterials.html</pre>'
      })

      /* Workspace */
      .state('applicationCatalog', {
        url: '/workspace/catalog',
        template: '<pre>local/applicationCatalog.html</pre>'
      })
      .state('runApplication', {
        url: '/workspace/run/{appId:any}?',
        template: '<pre>local/runApplication.html</pre>'
      })
      .state('jobHistory', {
        url: '/workspace/history/{jobId:any}?',
        template: '<pre>local/jobHistory.html</pre>'
      })
    ;

    $urlRouterProvider.otherwise('/agave/');
  }

  dataDepotApp.config(['$httpProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', 'Django', config]);

})(window, angular);
