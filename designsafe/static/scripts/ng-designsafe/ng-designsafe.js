//TODO: djng
import $ from 'jquery';
import angular from 'angular';
import _ from 'underscore';

//ng.modernizr
//import { mod } from '../ng-modernizr/ng-modernizr';
//also need to import slickCarousel and djng.urls- from npm?

//modules
//import { wsModule } from './modules/ws-module'
//import { notificationsModuel, notificationsModule } from './modules/notifications-module'

//import { wsBusService } from '../../../apps/signals/static/designsafe/apps/signals/scripts/provider'
//import directives from ./directives.
import { ddBoxListing } from './directives/dd-box-listing';
import { ddBreadcrumb } from './directives/dd-breadcrumb';
import { ddDropboxListing } from './directives/dd-dropbox-listing';
import { ddGoogleDriveListing } from './directives/dd-googledrive-listing';
import { ddListing } from './directives/dd-listing';
import { ddPublicListing } from './directives/dd-public-listing';
import { ddPublicSearchListing } from './directives/dd-public-search-listing';
import { ddSearchListing } from './directives/dd-search-listing';
import { ddSharedListing } from './directives/dd-shared-listing';
import { metadataListing } from './directives/metadata-listing';
import { myDataBrowser } from './directives/my-data-browser';
import { ngDesignsafeDirectives } from './directives/ng-designsafe-directives';

//import controllers from ./controllers
import { notifications } from './controllers/notifications';
//import { mainCtrl } from '../data-depot/controllers/main';

//import service from ./services
import { DataBrowserService, nbv } from './services/data-browser-service';
import { dataService } from './services/data-service';
import { fileListing } from './services/file-listing';
import { loggingService } from './services/logging-service';
import { notificationFactory} from './services/notification-factory';
import { projectEntityService } from './services/project-entity-service';
import { projectService } from './services/project-service';
import { publicDataBrowserService } from './services/public-data-browser-service';
import { systemsService } from './services/systems-service';
import { ticketsService } from './services/tickets-service';
import { userService } from './services/user-service';

//import filters from ./filters
import { dataBrowserFilters } from './filters/data-browser-filters';
import { ngDesignsafeFilters } from './filters/ng-designsafe-filters';

//import models
import { projectEntity } from './models/project.entity';
import { project } from './models/project';

//import providers
//import { notificationsProvider } from './providers/notifications-provider';
//import { wsProvider } from './providers/ws-provider';

//wsModule()
//notificationsModule()

//wsBusService();

//notificationsProvider();
//wsProvider();

//data depot controllers
/*
import { communityDataCtrl } from '../data-depot/controllers/community';
import { dataDepotNavCtrl } from '../data-depot/controllers/data-depot-nav';
import {dataDepotNewCtrl } from '../data-depot/controllers/data-depot-new'
import { dataDepotToolbarCtrl } from '../data-depot/controllers/data-depot-toolbar'
import {externalDataCtrl } from '../data-depot/controllers/external-data';
import { mainCtrl } from '../data-depot/controllers/main';
import { myDataCtrl } from '../data-depot/controllers/my-data';
import { projectsController } from '../data-depot/controllers/projects';
import { publicationDataCtrl } from '../data-depot/controllers/publications';
import { publishedDataCtrl } from '../data-depot/controllers/published';
import { sharedData } from '../data-depot/controllers/shared-data';

//dashboard
import { dashboardCtrl } from '../dashboard/controllers/dashboardCtrl';
import { agave2ds } from '../dashboard/filters/filters';
import { agaveService } from '../dashboard/services/agave-service';

//search
import { searchDirective } from '../search/directive';
import { searchService } from '../search/service';

//workspace
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

//applications
import { applicationAddCtrl } from '../applications/controllers/application-add';
import { applicationEditCtrl } from '../applications/controllers/application-edit';
import { applicationSystemsRoleCtrl } from '../applications/controllers/application-systems-role';
*/

import '../search'
//import '../data-depot'

export const ngDesignsafe = angular.module('designsafe', ['ng.modernizr', 'djng.urls', 'slickCarousel', 'ds-search']).config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}])
.constant('appCategories', ['Simulation', 'Visualization', 'Data Processing', 'Partner Data Apps', 'Utilities'])
// Current list of icons for apps
.constant('appIcons', ['Compress', 'Extract', 'MATLAB', 'Paraview', 'Hazmapper', 'Jupyter', 'ADCIRC', 'QGIS', 'LS-DYNA', 'LS-Pre/Post', 'VisIt', 'OpenFOAM', 'OpenSees'])


//Add directives from ./directives to the designsafe module.
ddBoxListing(window, angular);
ddBreadcrumb(window, angular);
ddDropboxListing(window, angular);
ddGoogleDriveListing(window, angular);
ddListing(window, angular);
ddPublicListing(window, angular);
ddPublicSearchListing(window, angular);
ddSearchListing(window, angular);
ddSharedListing(window, angular);
metadataListing(window, angular);
myDataBrowser(window, angular);
myDataBrowser(window, angular);
ngDesignsafeDirectives(angular, $);

//Add controllers from ./controllers.
notifications(window, angular, $);
//mainCtrl(window, angular);

//Add services
//dataBrowserService(window, angular, $, _);

ngDesignsafe.factory('nbv', nbv)
ngDesignsafe.factory('DataBrowserService', ['$rootScope', '$http', '$q',
                                        '$uibModal', '$state', 'Django',
                                        'FileListing', 'Logging', 'SystemsService', 'nbv',
                                        'ProjectEntitiesService', DataBrowserService])

projectService(window, angular, _)
dataService(window, angular, $, _);
fileListing(window, angular, $, _);
loggingService(window, angular);
notificationFactory(window, angular);
projectEntityService(window, angular, _);
publicDataBrowserService(angular, window, $);
systemsService(window, angular, $, _);
ticketsService(window, angular);
userService(window, angular);


//add filters
dataBrowserFilters(window, angular, $, _);
ngDesignsafeFilters(window, angular);

//add models
projectEntity(window, angular, $, _);
project(window, angular, $, _);

//add providers
//add data depot controllers
/*
communityDataCtrl(window, angular);
dataDepotNavCtrl(window, angular);
dataDepotNewCtrl(window, angular);
dataDepotToolbarCtrl(window, angular);
dataDepotToolbarCtrl(window, angular);
externalDataCtrl(window, angular);
externalDataCtrl(window, angular);
mainCtrl(window, angular);
myDataCtrl(window, angular, _);
projectsController(window, angular);
publicationDataCtrl(window, angular);
publishedDataCtrl(window, angular);
sharedData(window, angular);
*/
