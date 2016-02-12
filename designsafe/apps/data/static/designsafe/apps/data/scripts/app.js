/*!
 * Angular FileManager v1.4.0 (https://github.com/joni2back/angular-filemanager)
 * Jonas Sciangula Street <joni2back@gmail.com>
 * Licensed under MIT (https://github.com/joni2back/angular-filemanager/blob/master/LICENSE)
 */

(function(window, angular, $) {
    "use strict";

    function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider, $compileProvider) {
        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|agave):/);
        WSBusServiceProvider.setUrl('ws://' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + '/ws/websockets?subscribe-broadcast');
    }

    var app = angular.module('FileManagerApp', [
      'pascalprecht.translate',
      'ngStorage',
      'ngCookies',
      'ds.wsBus',
      'ds.notifications'
    ]).config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', '$compileProvider', config]);

    // angular.module('FileManagerApp')
    app
    .run(['WSBusService', function init(WSBusService){
        console.log(WSBusService.url);
        WSBusService.init(WSBusService.url);
    }])
    .run(['NotificationService', function init(NotificationService){
        console.log('workspace app.js running NotificationService')
        NotificationService.init();
    }]);

    /**
     * jQuery inits
     */
    $(window.document).on('shown.bs.modal', '.modal', function() {
        setTimeout(function() {
            $('[autofocus]', this).focus();
        }.bind(this), 100);
    });

    $(window.document).on('click', function() {
        $("#context-menu").hide();
    });

    $(window.document).on('contextmenu', '.main-navigation .table-files td:first-child, .iconset a.thumbnail', function(e) {
        $("#context-menu").hide().css({
            left: e.pageX,
            top: e.pageY
        }).show();
        e.preventDefault();
    });

})(window, angular, jQuery);
