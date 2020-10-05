import angular from 'angular';

import ApplicationFormCtrl from './application-form';
import { JobsStatusCtrl, JobDetailsModalCtrl, VNCJobDetailsModalCtrl } from './jobs-status';


let workspaceControllers = angular.module('workspace.controllers', ['workspace.services', 'designsafe']);
workspaceControllers.controller('ApplicationFormCtrl', [
    '$scope',
    '$rootScope',
    '$localStorage',
    '$location',
    '$anchorScroll',
    '$translate',
    'WorkspaceApps',
    'Jobs',
    'Systems',
    '$mdToast',
    'Django',
    'ProjectService',
    ApplicationFormCtrl]
);
workspaceControllers.controller('JobsStatusCtrl', JobsStatusCtrl);
workspaceControllers.controller('JobDetailsModalCtrl', JobDetailsModalCtrl);
workspaceControllers.controller('VNCJobDetailsModalCtrl', VNCJobDetailsModalCtrl);

export default workspaceControllers;
