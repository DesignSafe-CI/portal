import './modals';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { NotificationBadgeComponent } from './notification-badge/notification-badge.component';

let designsafeComponents = angular.module('designsafe.components', ['designsafe.components.modals']);
designsafeComponents.component('breadcrumb', BreadcrumbComponent);
designsafeComponents.component('notificationBadge', NotificationBadgeComponent)

export default designsafeComponents;
