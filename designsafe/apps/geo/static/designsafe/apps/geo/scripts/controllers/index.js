import MapSidebarCtrl from './map-sidebar';
import DBModalCtrl from './db-modal';
import HelpCtrl from './help';

let mod = angular.module('ds.geo.controllers', []);

mod.controller('MapSidebarCtrl', MapSidebarCtrl);
mod.controller('DBModalCtrl', DBModalCtrl);
mod.controller('HelpCtrl', HelpCtrl);
export default mod;
