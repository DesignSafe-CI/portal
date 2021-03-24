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

export default designsafeServices;
