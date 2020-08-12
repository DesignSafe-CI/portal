import './modals';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';

let designsafeComponents = angular.module('designsafe.components', ['designsafe.components.modals']);
designsafeComponents.component('breadcrumb', BreadcrumbComponent);

export default designsafeComponents;
