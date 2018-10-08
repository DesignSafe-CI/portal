import angular from 'angular';

import ApplicationFormCtrl from './application-form';
import ApplicationTrayCtrl from './application-tray';
import DataBrowserCtrl from './data-browser';
import {JobsStatusCtrl, JobDetailsModalCtrl, VNCJobDetailsModalCtrl } from './jobs-status';
import WorkspacePanelCtrl from './workspace-panel';


let workspaceControllers = angular.module('workspace.controllers', []);
workspaceControllers.controller('ApplicationFormCtrl', ApplicationFormCtrl);
workspaceControllers.controller('ApplicationTrayCtrl', ApplicationTrayCtrl);
workspaceControllers.controller('DataBrowserCtrl', DataBrowserCtrl);
workspaceControllers.controller('JobsStatusCtrl', JobsStatusCtrl);
workspaceControllers.controller('JobDetailsModalCtrl', JobDetailsModalCtrl);
workspaceControllers.controller('VNCJobDetailsModalCtrl', VNCJobDetailsModalCtrl);
workspaceControllers.controller('WorkspacePanelCtrl', WorkspacePanelCtrl);

export default workspaceControllers