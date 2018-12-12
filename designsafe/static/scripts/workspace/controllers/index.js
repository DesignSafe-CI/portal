import angular from 'angular';

import ApplicationFormCtrl from './application-form';
import DataBrowserCtrl from './data-browser';
import {JobsStatusCtrl, JobDetailsModalCtrl, VNCJobDetailsModalCtrl} from './jobs-status';
import WorkspacePanelCtrl from './workspace-panel';


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
workspaceControllers.controller('DataBrowserCtrl', DataBrowserCtrl);
workspaceControllers.controller('JobsStatusCtrl', JobsStatusCtrl);
workspaceControllers.controller('JobDetailsModalCtrl', JobDetailsModalCtrl);
workspaceControllers.controller('VNCJobDetailsModalCtrl', VNCJobDetailsModalCtrl);
workspaceControllers.controller('WorkspacePanelCtrl', WorkspacePanelCtrl);

export default workspaceControllers;
