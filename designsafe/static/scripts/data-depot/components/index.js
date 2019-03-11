import angular from 'angular';
import './projects';
import { DataDepotToolbarComponent } from './data-depot-toolbar/data-depot-toolbar.component';
import { DataDepotNavComponent } from './data-depot-nav/data-depot-nav.component';
import { CommunityComponent } from './community/community.component';
import { MyDataComponent} from './my-data/my-data.component';
import { PublicationsComponent } from './publications/publications.component';
import { PublishedComponent } from './published/published.component';
import { SharedDataComponent } from './shared-data/shared-data.component';
import { GoogledriveComponent, DropboxComponent, BoxComponent} from './external-data/external-data.component';
import { DataDepotNewComponent } from './data-depot-new/data-depot-new.component';
import { MainComponent } from './main/main.component';
import { FileMetadataComponent } from './file-metadata/file-metadata.component';
import neesPublicationComponent from './nees-publication/nees-publication.component';
import ddPublicationListingComponent from './dd-publication-listing/dd-publication-listing.component';

import publicationDescriptionModalComponent from './publications/publication-description-modal/publication-description.component';

let ddComponents = angular.module('dd.components', ['dd.components.projects']);

ddComponents.component('ddtoolbar', DataDepotToolbarComponent);
ddComponents.component('ddnav', DataDepotNavComponent);
ddComponents.component('community', CommunityComponent);
ddComponents.component('myData', MyDataComponent);
ddComponents.component('publications', PublicationsComponent);
ddComponents.component('published', PublishedComponent);
ddComponents.component('shared', SharedDataComponent);
ddComponents.component('googleDrive', GoogledriveComponent);
ddComponents.component('dropbox', DropboxComponent);
ddComponents.component('box', BoxComponent);
ddComponents.component('ddmain', MainComponent);
ddComponents.component('ddnew', DataDepotNewComponent);
ddComponents.component('neesPublicationComponent', neesPublicationComponent);
ddComponents.component('ddPublicationListingComponent', ddPublicationListingComponent);
ddComponents.component('fileMetadata', FileMetadataComponent);
ddComponents.component('publicationDescriptionModalComponent', publicationDescriptionModalComponent)

export default ddComponents;
