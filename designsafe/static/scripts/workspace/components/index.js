import angular from 'angular';
import { AppTrayComponent } from './application-tray/application-tray.component'


let workspaceComponents = angular.module('workspace.components', []);

workspaceComponents.component('apptray', AppTrayComponent);

export default workspaceComponents;