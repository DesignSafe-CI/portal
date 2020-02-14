import angular from 'angular';
import './projects';
import { DataDepotToolbarComponent } from './data-depot-toolbar/data-depot-toolbar.component';
import { DataDepotNavComponent } from './data-depot-nav/data-depot-nav.component';
import { PublishedComponent } from './published/published.component';
import { DataDepotNewComponent } from './data-depot-new/data-depot-new.component';
import { MainComponent } from './main/main.component';
import { FilesListingComponent, PublicationsListingComponent } from './data-depot-listing/data-depot-listing.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { DataDepotBrowserComponent, DataDepotPublicationsBrowserComponent } from './data-depot-browser/data-depot-browser.component';
import { NeesPublishedComponent } from './nees-publication/nees-publication.component';
import { PublicationDescriptionModalComponent } from './data-depot-listing/publication-description-modal/publication-description.component';
import { FileMetadataComponent } from './file-metadata/file-metadata.component';
import { PublishedParentComponent } from './published/published-parent.component.js';
import { ExpPublishedViewComponent,
    SimPublishedViewComponent,
    HybSimPublishedViewComponent,
    FieldReconPublishedViewComponent,
    OtherPublishedViewComponent
} from './published/published-view.component.js';
import { NeesCitationModalComponent } from './modals/nees-citation-modal.component';
import { NeesDoiListComponent } from './modals/nees-doi-list.component'

let ddComponents = angular.module('dd.components', ['dd.components.projects']);

ddComponents.component('ddtoolbar', DataDepotToolbarComponent);
ddComponents.component('ddnav', DataDepotNavComponent);
ddComponents.component('published', PublishedComponent);
ddComponents.component('ddmain', MainComponent);
ddComponents.component('ddnew', DataDepotNewComponent);
ddComponents.component('filesListing', FilesListingComponent);
ddComponents.component('publicationsListing', PublicationsListingComponent);
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
ddComponents.component('neesCitationModal', NeesCitationModalComponent);
ddComponents.component('neesDoiList', NeesDoiListComponent);

export default ddComponents;
