import MapSidebarCtrl from './map-sidebar';
import DBModalCtrl from './db-modal';
import HelpCtrl from './help';
import SettingsModalCtrl from './settings-modal';
import ConfirmClearModalCtrl from './confirm-clear-modal';

let mod = angular.module('ds.geo.controllers', []);

mod.controller('MapSidebarCtrl', MapSidebarCtrl);
mod.controller('DBModalCtrl', DBModalCtrl);
mod.controller('HelpCtrl', HelpCtrl);
mod.controller('SettingsModalCtrl', SettingsModalCtrl);
mod.controller('ConfirmClearModalCtrl', ConfirmClearModalCtrl);

export default mod;
