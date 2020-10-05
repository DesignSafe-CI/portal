import angular from 'angular';

import { FileListingService } from './file-listing-service';
import { FileOperationService } from './file-operation-service';
import { LoggingServiceProvider } from './logging-service';
import { notificationFactory } from './notification-factory';
import { ProjectEntitiesService } from './project-entity-service';
import { ProjectService } from './project-service';
import { PublicationService } from './publication-service';
import { TicketsService } from './tickets-service';
import { UserService } from './user-service';
import { ConfirmMessageComponent } from '../../projects/components/confirm-message/confirm-message.component';
import { EditProjectComponent } from '../../projects/components/edit-project/edit-project.component';
import { FileCategorySelectorComponent } from '../../projects/components/file-category-selector/file-category-selector';
import { FileCategoriesComponent } from '../../projects/components/file-categories/file-categories.component';


let designsafeServices = angular.module('designsafe.services', []);

designsafeServices.provider('Logging', LoggingServiceProvider);
designsafeServices.factory('notificationFactory', notificationFactory);
designsafeServices.factory('ProjectEntitiesService', ProjectEntitiesService);
designsafeServices.service('ProjectService', ProjectService);
designsafeServices.service('TicketsService', TicketsService);
designsafeServices.service('UserService', UserService);
designsafeServices.service('FileListingService', FileListingService);
designsafeServices.service('FileOperationService', FileOperationService);
designsafeServices.service('PublicationService', PublicationService);
// TODO: Move these components to /static/scripts/projects/components/index.js
designsafeServices.component('confirmMessage', ConfirmMessageComponent);
designsafeServices.component('editProject', EditProjectComponent);
designsafeServices.component('fileCategorySelector', FileCategorySelectorComponent);
designsafeServices.component('fileCategories', FileCategoriesComponent);

export default designsafeServices;
