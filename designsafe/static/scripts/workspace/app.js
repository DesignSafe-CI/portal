import $ from 'jquery';
import angular from 'angular';
import _ from 'underscore';

import { applicationFormCtrl } from '../workspace/controllers/application-form';
import { applicationTrayCtrl } from '../workspace/controllers/application-tray';
import { dataBrowserCtrl } from '../workspace/controllers/data-browser';
import { jobsStatusCtrl } from '../workspace/controllers/jobs-status';
import { workspacePanelCtrl } from '../workspace/controllers/workspace-panel';
import {agaveFilePicker } from '../workspace/directives/agave-file-picker';
import { translateProvider } from '../workspace/providers/translations';
import { appsService } from '../workspace/services/apps-service';
import { jobsService } from '../workspace/services/jobs-service';
import { multipleListService } from '../workspace/services/multiple-list-service';
import { simpleListService } from '../workspace/services/simple-list-service';
import { workspaceSystemsService } from '../workspace/services/systems-service';

applicationFormCtrl(window, angular, $);
applicationTrayCtrl(window, angular, $, _);
dataBrowserCtrl(window, angular, $);
jobsStatusCtrl(window, angular, $);
workspacePanelCtrl(window, angular, $);
agaveFilePicker(window, angular, $, _);
translateProvider(angular);
appsService(window, angular, $, _);
jobsService(window, angular, $, _);
multipleListService(window, angular, $, _);
simpleListService(window, angular, $, _);
workspaceSystemsService(window, angular, $, _)


  function config(WSBusServiceProvider, NotificationServiceProvider, $interpolateProvider, $httpProvider, $urlRouterProvider, $stateProvider) {

    WSBusServiceProvider.setUrl(
        (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
        window.location.hostname +
        (window.location.port ? ':' + window.location.port : '') +
        '/ws/websockets?subscribe-broadcast&subscribe-user'
    );

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('tray', {
          url: '/:appId',
          templateUrl: '/static/scripts/workspace/html/main.html',
          controller: 'ApplicationTrayCtrl'
      })

  }

  angular.module('designsafe').requires.push(
    'ngCookies',
    'djng.urls',  //TODO: djng
    'ui.bootstrap',
    'ui.router',
    'schemaForm',
    'designsafe',
    'ds.wsBus',
    'ds.notifications',
    'logging',
    'dndLists',
    'xeditable',
    'pascalprecht.translate',
    'ngStorage', 
    'ngMaterial',
    'django.context'
  );
  angular.module('designsafe').config(['WSBusServiceProvider', 'NotificationServiceProvider', '$interpolateProvider', '$httpProvider', '$urlRouterProvider', '$stateProvider', config]);

  angular.module('designsafe')
    .run(function(editableOptions) {
      editableOptions.theme = 'bs3';
    });



