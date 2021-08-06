import angular from 'angular';

import { appsService } from './apps-service';
import { jobsService } from './jobs-service';
import { simpleListService } from './simple-list-service';
import { workspaceSystemsService } from './systems-service';


let workspaceServices = angular.module('workspace.services', []);

workspaceServices.factory('WorkspaceApps', ['$http', '$q', '$translate', 'Django', appsService]);
workspaceServices.factory('Jobs', jobsService);
workspaceServices.factory('SimpleList', ['$http', '$q', 'appCategories', 'appIcons', simpleListService]);
workspaceServices.factory('Systems', workspaceSystemsService);

export default workspaceServices;
