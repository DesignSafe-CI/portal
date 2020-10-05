import angular from 'angular';
import {AppTrayComponent} from './application-tray/application-tray.component';
import {  WorkspaceDataBrowser } from './workspace-data-browser/workspace-data-browser.component';
import { WorkspaceDataBrowserFileListing } from './workspace-data-browser-file-listing/workspace-data-browser-file-listing.component';
import {WorkspaceDataBrowserPublicationListing } from './workspace-data-browser-publication-listing/workspace-data-browser-publication-listing.component';
import { WorkspaceDataBrowserProjectListing } from './workspace-data-browser-project-listing/workspace-data-browser-project-listing.component';
import { WorkspaceDataBrowserNeesListing } from './workspace-data-browser-nees-listing/workspace-data-browser-nees-listing.component';


let workspaceComponents = angular.module('workspace.components', []);

workspaceComponents.component('apptray', AppTrayComponent);
workspaceComponents.component('workspaceDataBrowser', WorkspaceDataBrowser);
workspaceComponents.component('workspaceDataBrowserFileListing', WorkspaceDataBrowserFileListing);
workspaceComponents.component('workspaceDataBrowserPublicationListing', WorkspaceDataBrowserPublicationListing);
workspaceComponents.component('workspaceDataBrowserProjectListing', WorkspaceDataBrowserProjectListing);
workspaceComponents.component('workspaceDataBrowserNeesListing', WorkspaceDataBrowserNeesListing);


export default workspaceComponents;
