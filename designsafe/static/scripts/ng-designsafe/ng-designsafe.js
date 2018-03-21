//TODO: djng
import $ from 'jquery';
import angular from 'angular';
import _ from 'underscore';

//ng.modernizr
import { mod } from '../ng-modernizr/ng-modernizr';
//also need to import slickCarousel and djng.urls- from npm?

//import directives from ./directives.
import { ddBoxListing } from './directives/dd-box-listing';
import { ddBreadcrub } from './directives/dd-breadcrumb';
import { ddDropboxListing } from './directives/dd-dropbox-listing';
import { ddGoogledriveListing } from './directives/dd-googledrive-listing';
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

//import service from ./services
import { dataBrowserService } from './services/data-browser-service';
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

export const ngDesignsafe = angular.module('designsafe', ['ng.modernizr', 'djng.urls', 'slickCarousel']).config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}])

.constant('appCategories', ['Simulation', 'Visualization', 'Data Processing', 'Partner Data Apps', 'Utilities'])
// Current list of icons for apps
.constant('appIcons', ['Compress', 'Extract', 'MATLAB', 'Paraview', 'Hazmapper', 'Jupyter', 'ADCIRC', 'QGIS', 'LS-DYNA', 'LS-Pre/Post', 'VisIt', 'OpenFOAM', 'OpenSees'])

.run(['UserService', '$http', function (UserService, $http) {
  UserService.authenticate().then(function (resp) {
    $http.defaults.headers.common['Authorization'] = 'Bearer ' + resp.oauth.access_token;
  });
}]);

//Add directives from ./directives to the designsafe module.
ddBoxListing(window, angular);
ddBreadcrub(windows, angular);
ddDropboxListing(window, angular);
ddGoogledriveListing(window, angular);
ddListing(window, angular);
ddPublicListing(window, angular);
ddPublicSearchListing(window, angular);
ddSearchListing(window, angular);
ddSharedListing(window, angular);
metadataListing(window, angular);
myDataBrowser(window, angular);
myDataBrowser(window, angular);
ngDesignsafeDirectives(window, $);

//Add controllers from ./controllers.
notifications(window, angular, any);

//Add services
dataBrowserService(window, angular, $);
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