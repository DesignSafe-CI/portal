import angular from 'angular';

import { DataBrowserServiceMoveComponent } from './data-browser-service-move/data-browser-service-move.component';
import { DataBrowserServicePreviewComponent } from './data-browser-service-preview/data-browser-service-preview.component';

let ddComponentsModals = angular.module('designsafe.components.modals', []);

ddComponentsModals.component('move', DataBrowserServiceMoveComponent);
ddComponentsModals.component('preview', DataBrowserServicePreviewComponent);

export default ddComponentsModals;