import angular from 'angular';

import { ProjectEntityModel } from './project.entity';
import { ProjectModel } from './project';
let designsafeModels = angular.module('designsafe.models', []);

designsafeModels.factory('ProjectEntityModel', ProjectEntityModel);
designsafeModels.factory('ProjectModel', ProjectModel);

export default designsafeModels;