import angular from 'angular';

import { NotificationServiceProvider } from './notifications-provider';
import { WSBusServiceProvider } from './ws-provider';
import '../services';

const dsNotifications = angular.module(
    'ds.notifications', ['toastr', 'djng.urls']
);
dsNotifications.provider(
    'NotificationService',
    NotificationServiceProvider
);
const dsWSBus = angular.module('ds.wsBus', ['logging', 'toastr']);
dsWSBus.provider('WSBusService', WSBusServiceProvider);
