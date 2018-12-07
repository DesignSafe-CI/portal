import angular from 'angular';

import { DataBrowserServiceMoveComponent } from './data-browser-service-move/data-browser-service-move.component';
import { DataBrowserServicePreviewComponent } from './data-browser-service-preview/data-browser-service-preview.component';
import { DataDepotFilePickerComponent } from './dd-file-picker/dd-file-picker';

let ddComponentsModals = angular.module('designsafe.components.modals', ['ui.bootstrap']);

ddComponentsModals.component('move', DataBrowserServiceMoveComponent);
ddComponentsModals.component('preview', DataBrowserServicePreviewComponent);
ddComponentsModals.component('ddfilepicker', DataDepotFilePickerComponent);

export default ddComponentsModals;
