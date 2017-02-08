(function(window, angular) {
  var module = angular.module('designsafe');
  module.requires.push(
    'ui.router',
    'djng.urls',
    'ui.bootstrap',
    'django.context'
  );

  function config($httpProvider, $locationProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, Django) {
    console.log('config')
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);

    $stateProvider
      /* Private */
      .state('dashboard', {
        url: '/',
        controller: 'DashboardCtrl',
        templateUrl: '/static/designsafe/apps/dashboard/html/dashboard.html',
        // resolve: {
        //   'listing': ['$stateParams', 'DataBrowserService', function($stateParams, DataBrowserService) {
        //     var options = {
        //       system: ($stateParams.systemId || 'designsafe.storage.default'),
        //       path: ($stateParams.filePath || Django.user)
        //     };
        //     if (options.path === '/') {
        //       options.path = Django.user;
        //     }
        //     DataBrowserService.apiParams.fileMgr = 'agave';
        //     DataBrowserService.apiParams.baseUrl = '/api/agave/files';
        //     DataBrowserService.apiParams.searchState = 'dataSearch';
        //     return DataBrowserService.browse(options);
        //   }],
        //   'auth': function($q) {
        //     if (Django.context.authenticated) {
        //       return true;
        //     } else {
        //       return $q.reject({
        //         type: 'authn',
        //         context: Django.context
        //       });
        //     }
        //   }
        // }
      })


    // $urlRouterProvider.otherwise(function($injector, $location) {
    //   var $state = $injector.get('$state');
    //
    //   /* Default to MyData for authenticated users, PublicData for anonymous */
    //   if (!(Django.context.authenticated)) {
    //     $state.go('myData', {
    //       systemId: 'designsafe.storage.default',
    //       filePath: Django.user
    //     });
    //   } else {
    //     $state.go('publicData');
    //   }
    // });
  }

  module.config(config)


})(window, angular);
