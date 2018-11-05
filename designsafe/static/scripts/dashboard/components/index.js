import angular from 'angular';
import { DashboardComponent } from './dashboard/dashboard.component';


let dashboardComponents = angular.module('dashboard.components', []);

dashboardComponents.component('db', DashboardComponent);

export default dashboardComponents;
