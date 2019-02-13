import angular from 'angular';

import { ProjectRootComponent } from './project-root/project-root.component';
import { ProjectListingComponent } from './project-listing/project-listing.component';
import { ProjectDataComponent } from './project-data/project-data.component';
import { ProjectViewComponent } from './project-view/project-view.component';
import { ProjectSearchComponent } from './project-search/project-search.component';
import { CurationDirectoryComponent } from './curation-directory/curation-directory.component';
import { PublicationPreviewComponent } from './publication-preview/publication-preview.component';
import { PublicationPreviewSimComponent } from './publication-preview/publication-preview-sim.component';
import { PipelineSelectionComponent } from './pipeline-selection/pipeline-selection.component';
import { PipelineSelectionSimComponent } from './pipeline-selection/pipeline-selection-sim.component';
import { PipelineProjectComponent } from './pipeline-project/pipeline-project.component';
import { PipelineExperimentComponent } from './pipeline-experiment/pipeline-experiment.component';
import { PipelineSimulationComponent } from './pipeline-simulation/pipeline-simulation.component';
import { PipelineCategoriesComponent } from './pipeline-categories/pipeline-categories.component';
import { PipelineCategoriesSimComponent } from './pipeline-categories/pipeline-categories-sim.component';
import { PipelineAuthorsComponent } from './pipeline-authors/pipeline-authors.component';
import { PipelineLicensesComponent } from './pipeline-licenses/pipeline-licenses.component';
import { ProjectTreeComponent } from '../../../projects/components/project-tree/project-tree.component';

let ddProjectsComponents = angular.module('dd.components.projects', []);

ddProjectsComponents.component('projectRoot', ProjectRootComponent);
ddProjectsComponents.component('projectListing', ProjectListingComponent);
ddProjectsComponents.component('projectData', ProjectDataComponent);
ddProjectsComponents.component('projectView', ProjectViewComponent);
ddProjectsComponents.component('projectSearch', ProjectSearchComponent);
ddProjectsComponents.component('curationDirectory', CurationDirectoryComponent);
ddProjectsComponents.component('publicationPreview', PublicationPreviewComponent);
ddProjectsComponents.component('publicationPreviewSim', PublicationPreviewSimComponent);
ddProjectsComponents.component('pipelineSelect', PipelineSelectionComponent);
ddProjectsComponents.component('pipelineSelectSim', PipelineSelectionSimComponent);
ddProjectsComponents.component('pipelineProject', PipelineProjectComponent);
ddProjectsComponents.component('pipelineExperiment', PipelineExperimentComponent);
ddProjectsComponents.component('pipelineSimulation', PipelineSimulationComponent);
ddProjectsComponents.component('pipelineCategories', PipelineCategoriesComponent);
ddProjectsComponents.component('pipelineCategoriesSim', PipelineCategoriesSimComponent);
ddProjectsComponents.component('pipelineAuthors', PipelineAuthorsComponent);
ddProjectsComponents.component('pipelineLicenses', PipelineLicensesComponent);
ddProjectsComponents.component('projectTree', ProjectTreeComponent);

export default ddProjectsComponents;
