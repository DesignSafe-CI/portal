// TODO: can only import CSS here, not in each module or
// they will stomp on eachother
import '../../styles/base.scss';
import '../../styles/main.css';
import '../../styles/branding_logos.css';
import '../../styles/c-footer.css';
import '../projects/components/file-categories/file-categories.scss';
import '../projects/components/file-category-selector/file-category-selector.scss';
import '../data-depot/components/projects/publication-preview/publication-preview.scss';
import '../nco/components/nco-scheduler/nco-scheduler.component.scss';
import '../nco/components/nco-scheduler-list/nco-scheduler-list.scss';
import '../nco/components/nco-scheduler-pagination/nco-scheduler-pagination.component.scss';
import '../nco/components/nco-scheduler-filters/nco-scheduler-filters.component.scss';

import $ from 'jquery';
import angular from 'angular';
import _ from 'underscore';
import * as angular_animate from 'angular-animate';
import * as ui_bootstrap from 'angular-ui-bootstrap';
import * as ui_router from 'angular-ui-router';
import * as ng_translate from 'angular-translate';
import * as angular_sanitize from 'angular-sanitize';
import * as angular_toaster from 'angular-toastr';
import * as angular_aria from 'angular-aria';
import * as angular_cookies from 'angular-cookies';
import * as tether from 'tether';
import * as angular_material from 'angular-material';
import * as angular_messages from 'angular-messages';
import * as slick_carousel from 'slick-carousel';
import * as angular_slick_carousel from 'angular-slick-carousel';
import * as ngstorage from 'ngstorage';


import './services';
import './providers';
import './directives';
import './filters';
import './models';
import './controllers';
import './components';

export const ngDesignsafe = angular.module('designsafe',
    ['ng.modernizr',
        'slickCarousel',
        'designsafe.services',
        'designsafe.directives',
        'designsafe.filters',
        'designsafe.models',
        'designsafe.controllers',
        'designsafe.components',
        'ds.notifications',
        'ds.wsBus',
    ])
    .config(['$httpProvider', '$qProvider', function($httpProvider, $qProvider) {
        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $qProvider.errorOnUnhandledRejections(false);
    }])
    .config(['WSBusServiceProvider', '$httpProvider', 'toastrConfig',
        function config(WSBusServiceProvider, $httpProvider, toastrConfig) {
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
    ])
    .constant('appCategories', ['Simulation', 'SimCenter Tools', 'Visualization', 'Analysis', 'Hazard Apps', 'Utilities'])
    // Current list of icons for apps
    .constant('appIcons', [
        'rWHALE',
        'Hazmapper',
        'Compress',
        'OpenSees-STKO',
        'STKO',
        'OpenFOAM',
        'Blender',
        'MATLAB',
        'NGL',
        'Paraview',
        'VisIt',
        'Jupyter',
        'QGIS',
        'ADCIRC',
        'OpenSees',
        'LS-DYNA',
        'LS-Pre/Post',
        'Dakota',
        'Clawpack',
        'Ansys',
        'swbatch',
        'Extract'
    ]);

ngDesignsafe.requires.push('django.context',
    'httpi',
    'ngCookies',
    'ui.bootstrap',
    'ds.notifications',
    'toastr',
    'logging',
    'ngMaterial');

ngDesignsafe.run(['WSBusService', 'logger',
    function init(WSBusService, logger) {
        WSBusService.init(WSBusService.url);
    }]);
ngDesignsafe.run(['NotificationService', 'logger',
    function init(NotificationService, logger) {
        NotificationService.init();
    }]);
const portal = angular.module('designsafe.portal', []).config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}]);
portal.requires.push('designsafe');
