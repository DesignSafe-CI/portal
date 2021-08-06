import angular from 'angular';

import {NotificationBadgeCtrl} from './notifications';

let designsafeControllers = angular.module(
    'designsafe.controllers',
    []
);

designsafeControllers.controller(
    'NotificationBadgeCtrl',
    [
        '$rootScope',
        '$scope',
        '$filter',
        'Logging',
        'Django',
        'NotificationService',
        '$http',
        'logger',
        NotificationBadgeCtrl,
    ]
);

export default designsafeControllers;
