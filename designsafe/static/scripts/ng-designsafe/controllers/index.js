import angular from 'angular';

import { NotificationBadgeCtrl } from './notifications'

let designsafeControllers = angular.module('designsafe.controllers', [])

designsafeControllers.controller('NotificationBadgeCtrl', NotificationBadgeCtrl);

export default designsafeControllers;