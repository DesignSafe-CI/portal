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
        url: '/agave/{fileId:[./]*}',
        controller: 'MyDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/agave-data-listing.html',
        onEnter: function($state, $stateParams, $timeout, DataService) {
          if ($stateParams.fileId) {
            var parsedFileId = DataService.parseFileId($stateParams.fileId);
            if (parsedFileId.user !== Django.user) {
              $timeout(function() {
                $state.go('sharedData', {fileId: $stateParams.fileId});
              });
            }
          }
        },
        resolve: {
          listing: function($stateParams, DataService) {
            return DataService.listPath({
              resource: 'agave',
              file_id: $stateParams.fileId
            }).then(function(resp) {
              return resp.data
            });
          }
        }
      })
      .state('sharedData', {
        url: '/agave/{fileId:.*}',
        controller: 'SharedDataCtrl',
        templateUrl: '/static/scripts/data-depot/templates/agave-data-listing.html',
        onEnter: function($state, $stateParams, $timeout, DataService) {
          if ($stateParams.fileId) {
            var parsedFileId = DataService.parseFileId($stateParams.fileId);
            if (parsedFileId.user === Django.user) {
              $timeout(function () {
                $state.go('myData', {fileId: $stateParams.fileId});
              });
            }
          }
        },
        resolve: {
          listing: function($stateParams, DataService) {
            return DataService.listPath({
              resource: 'agave',
              file_id: $stateParams.fileId
            }).then(function(resp) {
              return resp.data
            });
          }
        },
        params: {
          'fileId': 'designsafe.storage.default/$SHARE/'
        }
      })
      .state('myProjects', {
        url: '/projects',
        templateUrl: '/static/scripts/data-depot/templates/enhanced-data-listing.html'
      })
      .state('myPublications', {
        url: '/my-publications',
        templateUrl: '/static/scripts/data-depot/templates/enhanced-data-listing.html'
      })
      .state('boxData', {
        url: '/box/{fileId:.*}?',
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
        url: '/workspace/run/{appId:.*}?',
        template: '<pre>local/runApplication.html</pre>'
      })
      .state('jobHistory', {
        url: '/workspace/history/{jobId:.*}?',
        template: '<pre>local/jobHistory.html</pre>'
      })
    ;
  }

  dataDepotApp.config(['$httpProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', 'Django', config]);

})(window, angular);
