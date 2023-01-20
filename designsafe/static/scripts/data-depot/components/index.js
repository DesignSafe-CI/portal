import angular from 'angular';
import './projects';
import { ShowMoreComponent } from './_common/show-more.component';
import { DataDepotToolbarComponent } from './data-depot-toolbar/data-depot-toolbar.component';
import { DataDepotNavComponent } from './data-depot-nav/data-depot-nav.component';
import { PublishedComponent } from './published/published.component';
import { DataDepotNewComponent } from './data-depot-new/data-depot-new.component';
import { MainComponent } from './main/main.component';
import { FilesListingComponent, PublicationsListingComponent, PublicationsLegacyListingComponent } from './data-depot-listing/data-depot-listing.component';
import { DataDepotBrowserComponent, DataDepotPublicationsBrowserComponent, DataDepotPublicationsLegacyBrowserComponent } from './data-depot-browser/data-depot-browser.component';
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
import { PublishedCitationComponent } from '../../projects/components/publication-citation/publication-citation.component'; 
import { NeesCitationModalComponent } from './modals/nees-citation-modal.component';
import { NeesDoiListComponent } from './modals/nees-doi-list.component'
import { publicationAdvancedSearchComponent } from './data-depot-listing/publication-advanced-search/publication-advanced-search.component';
import { publicationAdvancedSearchCheckbox } from './data-depot-listing/publication-advanced-search/publication-advanced-search-checkbox.component';

let ddComponents = angular.module('dd.components', ['dd.components.projects']);

ddComponents.component('showMore', ShowMoreComponent);
ddComponents.component('ddtoolbar', DataDepotToolbarComponent);
ddComponents.component('ddnav', DataDepotNavComponent);
ddComponents.component('published', PublishedComponent);
ddComponents.component('ddmain', MainComponent);
ddComponents.component('ddnew', DataDepotNewComponent);
ddComponents.component('filesListing', FilesListingComponent);
ddComponents.component('publicationsListing', PublicationsListingComponent);
ddComponents.component('publicationsLegacyListing', PublicationsLegacyListingComponent);
ddComponents.component('dataDepotBrowser', DataDepotBrowserComponent);
ddComponents.component('dataDepotPublicationsBrowser', DataDepotPublicationsBrowserComponent);
ddComponents.component('dataDepotPublicationsLegacyBrowser', DataDepotPublicationsLegacyBrowserComponent);
ddComponents.component('neesPublished', NeesPublishedComponent);
ddComponents.component('publicationDescriptionModalComponent', PublicationDescriptionModalComponent);
ddComponents.component('fileMetadata', FileMetadataComponent);
ddComponents.component('publishedParent', PublishedParentComponent);
ddComponents.component('expPublishedView', ExpPublishedViewComponent);
ddComponents.component('simPublishedView', SimPublishedViewComponent);
ddComponents.component('simHybPublishedView', HybSimPublishedViewComponent);
ddComponents.component('fieldReconPublishedView', FieldReconPublishedViewComponent);
ddComponents.component('otherPublishedView', OtherPublishedViewComponent);
ddComponents.component('publishedCitation', PublishedCitationComponent);
ddComponents.component('neesCitationModal', NeesCitationModalComponent);
ddComponents.component('neesDoiList', NeesDoiListComponent);
ddComponents.component('publicationAdvancedSearch', publicationAdvancedSearchComponent);
ddComponents.component('publicationAdvancedSearchCheckbox', publicationAdvancedSearchCheckbox);

export default ddComponents;
