import angular from 'angular';

import { ProjectRootComponent } from './project-root/project-root.component';
import { ProjectListingComponent } from './project-listing/project-listing.component';
import { ProjectViewComponent } from './project-view/project-view.component';
import { ProjectSearchComponent } from './project-search/project-search.component';
import { CurationDirectoryComponent } from './curation-directory/curation-directory.component';
import { PublicationPreviewComponent } from './publication-preview/publication-preview.component';
import { PublicationPreviewSimComponent } from './publication-preview/publication-preview-sim.component';
import { PublicationPreviewHybSimComponent } from './publication-preview/publication-preview-hyb-sim.component';
import { PublicationPreviewOtherComponent } from './publication-preview/publication-preview-other.component';
import { PublicationPreviewFieldReconComponent } from './publication-preview/publication-preview-field-recon.component';
import {
    PipelineSelectionExpComponent,
    PipelineSelectionSimComponent,
    PipelineSelectionHybSimComponent,
    PipelineSelectionFieldComponent
} from './pipeline-selection/pipeline-selection.component';
import { PipelineSelectionOtherComponent } from './pipeline-selection/pipeline-selection-other.component';
import { PipelineProjectComponent } from './pipeline-project/pipeline-project.component';
import {
    PipelineExperimentComponent,
    PipelineSimulationComponent,
    PipelineHybridComponent,
    PipelineFieldComponent,
} from './pipeline-primary-entity/pipeline-primary-entity.component';
import { PipelineOtherComponent } from './pipeline-other/pipeline-other.component';
import {
    PipelineSubEntityExpComponent,
    PipelineSubEntitySimComponent,
    PipelineSubEntityHybSimComponent,
    PipelineSubEntityFieldComponent
} from './pipeline-sub-entity/pipeline-sub-entity.component';
import { PipelineAuthorsComponent } from './pipeline-authors/pipeline-authors.component';
import { PipelineTeamComponent } from './pipeline-team/pipeline-team.component';
import { PipelineLicensesComponent } from './pipeline-licenses/pipeline-licenses.component';
import { ProjectTreeComponent } from '../../../projects/components/project-tree/project-tree.component';
import {
    PipelinePublishComponent,
    PipelinePrivacyPublishComponent
} from './pipeline-publish/pipeline-publish.component';
import { ManageProjectTypeComponent } from '../../../projects/components/manage-project-type/manage-project-type.component.js';
import { ManageCategoriesComponent } from '../../../projects/components/manage-categories/manage-categories.component.js';
import { ManageExperimentsComponent } from '../../../projects/components/manage-experiments/manage-experiments.component';
import { ManageHybridSimComponent } from '../../../projects/components/manage-hybrid-simulations/manage-hybrid-simulations.component';
import { ManageSimulationComponent } from '../../../projects/components/manage-simulations/manage-simulations.component';
import { ManageFieldReconMissionsComponent } from '../../../projects/components/manage-field-recon/missions/manage-field-recon-missions.component.js';
import { ManageFieldReconCollectionsComponent } from '../../../projects/components/manage-field-recon/collections/manage-field-recon-collections.component.js';
import { ManageFieldReconReportsComponent } from '../../../projects/components/manage-field-recon/reports/manage-field-recon-reports.component.js';
import { PublishedCitationComponent } from '../../../projects/components/publication-citation/publication-citation.component.js';
import { AuthorInformationModalComponent } from './publication-preview/modals/author-information-modal.component';

let ddProjectsComponents = angular.module('dd.components.projects', []);

ddProjectsComponents.component('projectRoot', ProjectRootComponent);
ddProjectsComponents.component('projectListing', ProjectListingComponent);
ddProjectsComponents.component('projectView', ProjectViewComponent);
ddProjectsComponents.component('projectSearch', ProjectSearchComponent);
ddProjectsComponents.component('curationDirectory', CurationDirectoryComponent);
ddProjectsComponents.component('publicationPreview', PublicationPreviewComponent);
ddProjectsComponents.component('publicationPreviewSim', PublicationPreviewSimComponent);
ddProjectsComponents.component('publicationPreviewHybSim', PublicationPreviewHybSimComponent);
ddProjectsComponents.component('publicationPreviewOther', PublicationPreviewOtherComponent);
ddProjectsComponents.component('publicationPreviewFieldRecon', PublicationPreviewFieldReconComponent);
ddProjectsComponents.component('pipelineSelectExp', PipelineSelectionExpComponent);
ddProjectsComponents.component('pipelineSelectSim', PipelineSelectionSimComponent);
ddProjectsComponents.component('pipelineSelectHybSim', PipelineSelectionHybSimComponent);
ddProjectsComponents.component('pipelineSelectField', PipelineSelectionFieldComponent);

ddProjectsComponents.component('pipelineSelectOther', PipelineSelectionOtherComponent);
ddProjectsComponents.component('pipelineProject', PipelineProjectComponent);
ddProjectsComponents.component('pipelineExperiment', PipelineExperimentComponent);
ddProjectsComponents.component('pipelineSimulation', PipelineSimulationComponent);
ddProjectsComponents.component('pipelineHybrid', PipelineHybridComponent);
ddProjectsComponents.component('pipelineOther', PipelineOtherComponent);
ddProjectsComponents.component('pipelineField', PipelineFieldComponent);
ddProjectsComponents.component('pipelineSubEntityExp', PipelineSubEntityExpComponent);
ddProjectsComponents.component('pipelineSubEntitySim', PipelineSubEntitySimComponent);
ddProjectsComponents.component('pipelineSubEntityHybSim', PipelineSubEntityHybSimComponent);
ddProjectsComponents.component('pipelineSubEntityField', PipelineSubEntityFieldComponent);
ddProjectsComponents.component('pipelineAuthors', PipelineAuthorsComponent);
ddProjectsComponents.component('pipelineTeam', PipelineTeamComponent);
ddProjectsComponents.component('pipelineLicenses', PipelineLicensesComponent);
ddProjectsComponents.component('projectTree', ProjectTreeComponent);
ddProjectsComponents.component('pipelinePublishModal', PipelinePublishComponent);
ddProjectsComponents.component('pipelinePrivacyPublishModal', PipelinePrivacyPublishComponent);
ddProjectsComponents.component('manageProjectType', ManageProjectTypeComponent);
ddProjectsComponents.component('manageCategories', ManageCategoriesComponent);
ddProjectsComponents.component('manageExperimentsModal', ManageExperimentsComponent);
ddProjectsComponents.component('manageHybridSimulationsModal', ManageHybridSimComponent);
ddProjectsComponents.component('manageSimulationsModal', ManageSimulationComponent);
ddProjectsComponents.component('fieldReconMissionsModal', ManageFieldReconMissionsComponent);
ddProjectsComponents.component('fieldReconCollectionsModal', ManageFieldReconCollectionsComponent);
ddProjectsComponents.component('fieldReconReportsModal', ManageFieldReconReportsComponent);
ddProjectsComponents.component('publishedCitationModal', PublishedCitationComponent);
ddProjectsComponents.component('authorInformationModal', AuthorInformationModalComponent);

export default ddProjectsComponents;
