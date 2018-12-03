import angular from 'angular';

import { ProjectRootComponent } from './project-root/project-root.component';
import { ProjectListingComponent } from './project-listing/project-listing.component';
import { ProjectDataComponent } from './project-data/project-data.component';
import { ProjectViewComponent } from './project-view/project-view.component';
import { ProjectSearchComponent } from './project-search/project-search.component';

let ddProjectsComponents = angular.module('dd.components.projects', []);

ddProjectsComponents.component('projectRoot', ProjectRootComponent);
ddProjectsComponents.component('projectListing', ProjectListingComponent);
ddProjectsComponents.component('projectData', ProjectDataComponent);
ddProjectsComponents.component('projectView', ProjectViewComponent);
ddProjectsComponents.component('projectSearch', ProjectSearchComponent);

export default ddProjectsComponents;