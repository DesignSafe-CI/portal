import angular from 'angular';

import { ProjectListingComponent } from './project-listing/project-listing.component';
import { ProjectViewComponent } from './project-view/project-view.component';
import { CurationDirectoryComponent } from './curation-directory/curation-directory.component';
import { PublicationPreviewComponent } from './publication-preview/publication-preview.component';
import { PublicationPreviewSimComponent } from './publication-preview/publication-preview-sim.component';
import { PublicationPreviewHybSimComponent } from './publication-preview/publication-preview-hyb-sim.component';
import { PublicationPreviewOtherComponent } from './publication-preview/publication-preview-other.component';
import { PublicationPreviewFieldReconComponent } from './publication-preview/publication-preview-field-recon.component';
import { PipelineStartComponent } from './pipeline-start/pipeline-start.component';
import {
    VersionOtherSelectionComponent,
    VersionOtherCitationComponent
} from './pipeline-version/pipeline-version-other.component';
import {
    VersionExperimentSelectionComponent,
    VersionFieldReconSelectionComponent,
    VersionCitationComponent
} from './pipeline-version/pipeline-version.component';
import { VersionChangesComponent } from './pipeline-version/pipeline-version-changes.component';
import { AmendExperimentComponent, AmendFieldReconComponent, AmendSimulationComponent } from './pipeline-amend/pipeline-amend.component';
import { AmendOtherComponent } from './pipeline-amend/pipeline-amend-other.component';
import { AmendCitationComponent } from './pipeline-amend/pipeline-amend-citation.component';
import {
    PipelineSelectionExpComponent,
    PipelineSelectionSimComponent,
    PipelineSelectionHybSimComponent,
    PipelineSelectionFieldComponent,
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
    PipelineSubEntityFieldComponent,
} from './pipeline-sub-entity/pipeline-sub-entity.component';
import { PipelineAuthorsComponent } from './pipeline-authors/pipeline-authors.component';
import { PipelineTeamComponent } from './pipeline-team/pipeline-team.component';
import { PipelineLicensesComponent } from './pipeline-licenses/pipeline-licenses.component';
import {
    PipelinePublishComponent,
    PipelinePrivacyPublishComponent,
} from './pipeline-publish/pipeline-publish.component';
import { HazmapperMapsComponent } from './_common/hazmapper-maps/hazmapper-maps.component';
import {
    ManageProjectComponent,
    AmendProjectComponent,
} from '../../../projects/components/manage-project/manage-project.component';
import { ManageAuthorsComponent } from '../../../projects/components/manage-authors/manage-authors.component.js';
import { ManageProjectTypeComponent } from '../../../projects/components/manage-project-type/manage-project-type.component.js';
import { ManageCategoriesComponent } from '../../../projects/components/manage-categories/manage-categories.component.js';
import { ManageExperimentsComponent } from '../../../projects/components/manage-experiments/manage-experiments.component';
import { ManageHybridSimComponent } from '../../../projects/components/manage-hybrid-simulations/manage-hybrid-simulations.component';
import { ManageSimulationComponent } from '../../../projects/components/manage-simulations/manage-simulations.component';
import { ManageFieldReconMissionsComponent } from '../../../projects/components/manage-field-recon/missions/manage-field-recon-missions.component.js';
import { ManageFieldReconDocumentsComponent } from '../../../projects/components/manage-field-recon/documents/manage-field-recon-documents.component.js';
import { ManageFieldReconCollectionsComponent } from '../../../projects/components/manage-field-recon/collections/manage-field-recon-collections.component.js';
import { AmendEntityComponent } from '../../../projects/components/amend-entity-modal/amend-entity.component.js';
import { ProjectTreeComponent } from '../../../projects/components/project-tree/project-tree.component';
import { AuthorInformationModalComponent } from './publication-preview/modals/author-information-modal.component';
import { PublicationDownloadModalComponent } from '../../../projects/components/publication-download/publication-download.component.js';
import { PublishedDataModalComponent } from '../../../projects/components/published-data-modal/published-data-modal.component';
import { ConfirmMessageComponent } from '../../../projects/components/confirm-message/confirm-message.component';
import { FileCategorySelectorComponent } from '../../../projects/components/file-category-selector/file-category-selector';
import { FileCategoriesComponent } from '../../../projects/components/file-categories/file-categories.component';
import { PublicationMetricsComponent } from '../../../projects/components/publication-metrics/publication-metrics.component.js';
import { EntityMetricsComponent } from '../../../projects/components/publication-metrics/entity-metrics.component';
import LeaveFeedbackModalComponent from '../../../projects/components/leave-feedback-modal/leave-feedback-modal.component';

const ddProjectsComponents = angular.module('dd.components.projects', []);

ddProjectsComponents.component('projectListing', ProjectListingComponent);
ddProjectsComponents.component('projectView', ProjectViewComponent);
ddProjectsComponents.component('curationDirectory', CurationDirectoryComponent);
ddProjectsComponents.component('publicationPreview', PublicationPreviewComponent);
ddProjectsComponents.component('publicationPreviewSim', PublicationPreviewSimComponent);
ddProjectsComponents.component('publicationPreviewHybSim', PublicationPreviewHybSimComponent);
ddProjectsComponents.component('publicationPreviewOther', PublicationPreviewOtherComponent);
ddProjectsComponents.component('publicationPreviewFieldRecon', PublicationPreviewFieldReconComponent);
ddProjectsComponents.component('pipelineStart', PipelineStartComponent);
ddProjectsComponents.component('amendOther', AmendOtherComponent);
ddProjectsComponents.component('amendExperiment', AmendExperimentComponent);
ddProjectsComponents.component('amendFieldRecon', AmendFieldReconComponent);
ddProjectsComponents.component('amendSimulation', AmendSimulationComponent);
ddProjectsComponents.component('amendCitation', AmendCitationComponent);
ddProjectsComponents.component('versionOtherSelection', VersionOtherSelectionComponent);
ddProjectsComponents.component('versionOtherCitation', VersionOtherCitationComponent);
ddProjectsComponents.component('versionExperimentSelection', VersionExperimentSelectionComponent);
ddProjectsComponents.component('versionFieldReconSelection', VersionFieldReconSelectionComponent);
ddProjectsComponents.component('versionCitation', VersionCitationComponent);
ddProjectsComponents.component('versionChanges', VersionChangesComponent);
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
ddProjectsComponents.component('pipelinePublishModal', PipelinePublishComponent);
ddProjectsComponents.component('pipelinePrivacyPublishModal', PipelinePrivacyPublishComponent);
ddProjectsComponents.component('hazmapperMaps', HazmapperMapsComponent);
ddProjectsComponents.component('manageProject', ManageProjectComponent);
ddProjectsComponents.component('amendProject', AmendProjectComponent);
ddProjectsComponents.component('manageAuthors', ManageAuthorsComponent);
ddProjectsComponents.component('manageProjectType', ManageProjectTypeComponent);
ddProjectsComponents.component('manageCategories', ManageCategoriesComponent);
ddProjectsComponents.component('manageExperimentsModal', ManageExperimentsComponent);
ddProjectsComponents.component('manageHybridSimulationsModal', ManageHybridSimComponent);
ddProjectsComponents.component('manageSimulationsModal', ManageSimulationComponent);
ddProjectsComponents.component('fieldReconMissionsModal', ManageFieldReconMissionsComponent);
ddProjectsComponents.component('fieldReconDocumentsModal', ManageFieldReconDocumentsComponent);
ddProjectsComponents.component('fieldReconCollectionsModal', ManageFieldReconCollectionsComponent);
ddProjectsComponents.component('amendEntityModal', AmendEntityComponent);
ddProjectsComponents.component('projectTree', ProjectTreeComponent);
ddProjectsComponents.component('authorInformationModal', AuthorInformationModalComponent);
ddProjectsComponents.component('publicationDownloadModal', PublicationDownloadModalComponent);
ddProjectsComponents.component('publishedDataModal', PublishedDataModalComponent);
ddProjectsComponents.component('confirmMessage', ConfirmMessageComponent);
ddProjectsComponents.component('fileCategorySelector', FileCategorySelectorComponent);
ddProjectsComponents.component('fileCategories', FileCategoriesComponent);
ddProjectsComponents.component('publicationMetricsModal', PublicationMetricsComponent);
ddProjectsComponents.component('entityMetricsModal', EntityMetricsComponent);
ddProjectsComponents.component('leaveFeedbackModal', LeaveFeedbackModalComponent);

export default ddProjectsComponents;
