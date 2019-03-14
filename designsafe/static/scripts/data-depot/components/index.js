import angular from 'angular';
import './projects';
import { DataDepotToolbarComponent } from './data-depot-toolbar/data-depot-toolbar.component';
import { DataDepotNavComponent } from './data-depot-nav/data-depot-nav.component';
import { PublishedComponent } from './published/published.component';
import { DataDepotNewComponent } from './data-depot-new/data-depot-new.component';
import { MainComponent } from './main/main.component';
import { FilesListingComponent, FilesListingPublicComponent } from './files-listing/files-listing.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { DataDepotBrowserComponent, DataDepotPublicationsBrowserComponent } from './data-depot-browser/data-depot-browser.component';
import { NeesPublishedComponent } from './nees-publication/nees-publication.component';

let ddComponents = angular.module('dd.components', ['dd.components.projects']);

ddComponents.component('ddtoolbar', DataDepotToolbarComponent);
ddComponents.component('ddnav', DataDepotNavComponent);
ddComponents.component('published', PublishedComponent);
ddComponents.component('ddmain', MainComponent);
ddComponents.component('ddnew', DataDepotNewComponent);
ddComponents.component('filesListing', FilesListingComponent);
ddComponents.component('filesListingPublic', FilesListingPublicComponent);
ddComponents.component('breadcrumb', BreadcrumbComponent);
ddComponents.component('dataDepotBrowser', DataDepotBrowserComponent);
ddComponents.component('dataDepotPublicationsBrowser', DataDepotPublicationsBrowserComponent);
ddComponents.component('neesPublished', NeesPublishedComponent);

export default ddComponents;
