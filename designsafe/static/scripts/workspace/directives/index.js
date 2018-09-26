import angular from 'angular';
import focusout from './focusout'
import compile from './compile'


let workspaceDirectives = angular.module('workspace.directives', []);

workspaceDirectives.directive('focusout', focusout);
workspaceDirectives.directive('compile', compile);

export default workspaceDirectives