import angular from 'angular';
import './modals';
import { DataDepotToolbarComponent } from './data-depot-toolbar/data-depot-toolbar.component';
import { DataDepotNavComponent } from './data-depot-nav/data-depot-nav.component';

let ddComponents = angular.module('dd.components', ['dd.components.modals']);

ddComponents.component('ddtoolbar', DataDepotToolbarComponent)
ddComponents.component('ddnav', DataDepotNavComponent)

export default ddComponents;
