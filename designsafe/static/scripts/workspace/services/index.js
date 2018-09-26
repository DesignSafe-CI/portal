import angular from 'angular';

import { appsService } from './apps-service';
import {jobsService} from './jobs-service';
import {multipleListService} from './multiple-list-service';
import { simpleListService } from './simple-list-service';
import {workspaceSystemsService} from './systems-service';


let workspaceServices = angular.module('workspace.services', []);
workspaceServices.factory('Apps', appsService)
workspaceServices.factory('Jobs', jobsService)
workspaceServices.factory('MultipleList', multipleListService)
workspaceServices.factory('SimpleList', simpleListService)
workspaceServices.factory('Systems', workspaceSystemsService)

export default workspaceServices