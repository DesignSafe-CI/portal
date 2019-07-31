import angular from 'angular';

import { nbv, DataBrowserService } from './data-browser-service';
import { DataService } from './data-service';
import { FileListing } from './file-listing';
import { LoggingServiceProvider } from './logging-service';
import { notificationFactory } from './notification-factory';
import { ProjectEntitiesService } from './project-entity-service';
import { ProjectService } from './project-service';
import { SystemsService } from './systems-service';
import { TicketsService } from './tickets-service';
import { UserService } from './user-service';
import { ManageProjectTypeComponent } from '../../projects/components/manage-project-type/manage-project-type.component';
import { ConfirmDeleteComponent } from '../../projects/components/confirm-delete/confirm-delete.component';
import { ManageExperimentsComponent } from '../../projects/components/manage-experiments/manage-experiments.component';
import { ManageHybridSimComponent } from '../../projects/components/manage-hybrid-simulations/manage-hybrid-simulations.component';
import { ManageSimulationComponent } from '../../projects/components/manage-simulations/manage-simulations.component';
import { EditProjectComponent } from '../../projects/components/edit-project/edit-project.component';
import { FileCategorySelectorComponent } from '../../projects/components/file-category-selector/file-category-selector';
import { FileCategoriesComponent } from '../../projects/components/file-categories/file-categories.component';


let designsafeServices = angular.module('designsafe.services', []);

designsafeServices.factory('nbv', ['$window', nbv]);
designsafeServices.factory('DataBrowserService', DataBrowserService);
designsafeServices.factory('DataService', DataService);
designsafeServices.factory('FileListing', ['$http', '$q', 'Logging', FileListing]);
designsafeServices.provider('Logging', LoggingServiceProvider);
designsafeServices.factory('notificationFactory', notificationFactory);
designsafeServices.factory('ProjectEntitiesService', ProjectEntitiesService);
designsafeServices.factory('ProjectService', ProjectService);
designsafeServices.factory('SystemsService', SystemsService);
designsafeServices.service('TicketsService', TicketsService);
designsafeServices.service('UserService', UserService);
// TODO: Move these components to /static/scripts/projects/components/index.js
designsafeServices.component('manageProjectType', ManageProjectTypeComponent);
designsafeServices.component('confirmDelete', ConfirmDeleteComponent);
designsafeServices.component('manageExperiments', ManageExperimentsComponent);
designsafeServices.component('manageHybridSimulations', ManageHybridSimComponent);
designsafeServices.component('manageSimulations', ManageSimulationComponent);
designsafeServices.component('editProject', EditProjectComponent);
designsafeServices.component('fileCategorySelector', FileCategorySelectorComponent);
designsafeServices.component('fileCategories', FileCategoriesComponent);

export default designsafeServices;
