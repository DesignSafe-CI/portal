import MapSidebarCtrl from './map-sidebar';
import DBModalCtrl from './db-modal';
let mod = angular.module('ds.geo.controllers', []);

mod.controller('MapSidebarCtrl', MapSidebarCtrl);
mod.controller('DBModalCtrl', DBModalCtrl);
export default mod;
