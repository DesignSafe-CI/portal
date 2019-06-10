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
import { PublicationDescriptionModalComponent } from './files-listing/publication-description-modal/publication-description.component';
import { FileMetadataComponent } from './file-metadata/file-metadata.component';
import { PublishedParentComponent } from './published/published-parent.component.js';
import { ExpPublishedViewComponent,
    SimPublishedViewComponent,
    HybSimPublishedViewComponent,
    FieldReconPublishedViewComponent,
    OtherPublishedViewComponent
} from './published/published-view.component.js';

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
ddComponents.component('publicationDescriptionModalComponent', PublicationDescriptionModalComponent);
ddComponents.component('fileMetadata', FileMetadataComponent);
ddComponents.component('publishedParent', PublishedParentComponent);
ddComponents.component('expPublishedView', ExpPublishedViewComponent);
ddComponents.component('simPublishedView', SimPublishedViewComponent);
ddComponents.component('simHybPublishedView', HybSimPublishedViewComponent);
ddComponents.component('fieldReconPublishedView', FieldReconPublishedViewComponent);
ddComponents.component('otherPublishedView', OtherPublishedViewComponent);

export default ddComponents;
