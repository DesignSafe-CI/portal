/**
 * Created by mrhanlon on 4/28/16.
 */
(function(window, angular, $, _) {
  "use strict";

  var app = angular.module('DataDepotBrowser', [
    'ngCookies',
    'djng.urls',
    'ui.bootstrap',
    'ng.designsafe',
    'django.context',
    'toastr',
    'ds.wsBus'
  ]);

  app.config(['WSBusServiceProvider', '$httpProvider', '$locationProvider', 'toastrConfig',
    function config(WSBusServiceProvider, $httpProvider, $locationProvider, toastrConfig) {
      $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
      $httpProvider.defaults.xsrfCookieName = 'csrftoken';
      $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

      $locationProvider.html5Mode(true);

      /*
       * https://github.com/Foxandxss/angular-toastr#toastr-customization
       */
      angular.extend(toastrConfig, {
        positionClass: 'toast-bottom-left',
        timeOut: 20000
      });

      WSBusServiceProvider.setUrl(
        (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
        window.location.hostname +
        (window.location.port ? ':' + window.location.port : '') +
        '/ws/websockets?subscribe-broadcast&subscribe-user'
      );
    }
  ]);

  app.controller('DataDepotBrowserCtrl', 
    ['$scope', '$location', '$filter', 'toastr', 'Logging', 'Django',
    function($scope, $location, $filter, toastr, Logging, Django) {

      var logger = Logging.getLogger('DataDepotBrowser.DataDepotBrowserCtrl');

      $scope.data = {
        user: Django.user,
        currentSource: Django.context.currentSource,
        sources: Django.context.sources,
        listing: Django.context.listing
      };

      $scope.state = {
        loading: Django.context.state && Django.context.state.loading || false,
        listingError: Django.context.state && Django.context.state.loading || false,
        selecting: Django.context.state && Django.context.state.loading || false,
        search: Django.context.state && Django.context.state.loading || false,
        selected: Django.context.state && Django.context.state.loading || []
      };

      /* initialize HTML5 history state */
      $location.state({'data': angular.copy($scope.data),
                       'state': angular.copy($scope.state)});
      $location.replace();

      $scope.$on('$locationChangeSuccess', function ($event, newUrl, oldUrl, newState) {
        if (newUrl !== oldUrl) {
          _.extend($scope.data, newState.data);
          _.extend($scope.state, newState.state);
        }
      });

      /**
       *
       * @param $event {event}
       * @param data {object}
       * @param data.level {string} info, success, warning, error
       * @param data.message {string}
       * @param data.title {string}
       * @param data.opts {object}
       */
      function toastNotify ($event, data) {
        var level = data.level || 'info';
        var toastop = toastr[level] || toastr.info;
        var opts = _.extend({allowHtml: true}, data.opts);
        toastop(data.message, data.title, opts);
      }

      $scope.$on('designsafe:notify', toastNotify);

      $scope.onPathChanged = function(listing) {
        var path = $filter('dsFileUrl')(listing);
        $location.state({'data': angular.copy($scope.data), 
                         'state': angular.copy($scope.state)});
        $location.path(path);
        if (listing.name == '$SEARCH') {
          $location.search('q', listing.query.q);
          $location.search('filters', listing.query.filters);
        }else{
          var qs = $location.search();
          if (qs.q) delete qs.q;
          if (qs.filters) delete qs.filters;
          $location.search(qs);
        }
      };

    }]);

    app.run(['WSBusService', 'logger', function init(WSBusService, logger){
      logger.log(WSBusService.url);
      WSBusService.init(WSBusService.url);
    }]);

})(window, angular, jQuery, _);
