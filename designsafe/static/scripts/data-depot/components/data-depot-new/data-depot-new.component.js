import _ from 'underscore';
import DataDepotNewTemplate from './data-depot-new.component.html';

class DataDepotNewCtrl {
  constructor($scope, $rootScope, $state, $sce, Django, ProjectService, FileListingService, FileOperationService) {
    'ngInject';
    this.$scope = $scope;
    this.$rootScope = $rootScope
    this.$state = $state;
    this.$sce = $sce;
    this.Django = Django;
    this.ProjectService = ProjectService;
    this.FileListingService = FileListingService;
    this.FileOperationService = FileOperationService;
    
  }
  $onInit() {

    this.test = {
      enabled: this.Django.context.authenticated,
      createFiles: false,
      createProject: this.Django.context.authenticated
    };
    
    // need to watch $rootScope here because this component lives outside the <ui-view/>
    this.$rootScope.$watch('this.$state.current.name', () => {
      this.test.createFiles = this.FileOperationService.getTests([]).upload
    })
    

    const popoverHTML = `
    <span>Our recommended method for bulk data transfer is <a href='https://www.designsafe-ci.org/rw/user-guides/globus-data-transfer-guide/'>using Globus.</a></span>
    `;
    
    this.popoverHTML = this.$sce.trustAsHtml(popoverHTML);

  }



    createFolder($event) {
      if (this.FileOperationService.tests.upload) {
        this.FileOperationService.openMkdirModal({
          api: this.FileListingService.listings.main.params.api,
          scheme: this.FileListingService.listings.main.params.scheme,
          system: this.FileListingService.listings.main.params.system,
          path: this.FileListingService.listings.main.params.path
        });
      } else {
        $event.preventDefault();
        $event.stopPropagation();
      }
    };

    createProject($event) {
      if (this.test.createProject) {
        this.ProjectService.editProject();
      } else {
        $event.preventDefault();
        $event.stopPropagation();
      }
    };

    uploadFiles($event) {
      if (this.FileOperationService.tests.upload) {
        this.FileOperationService.openUploadModal({ directory: false, 
          api: this.FileListingService.listings.main.params.api,
          scheme: this.FileListingService.listings.main.params.scheme,
          system: this.FileListingService.listings.main.params.system,
          path: this.FileListingService.listings.main.params.path});
      } else {
        $event.preventDefault();
        $event.stopPropagation();
      }
    };

    uploadFolders($event) {
      if (this.FileOperationService.tests.upload) {
        this.FileOperationService.openUploadModal({directory: true, 
          api: this.FileListingService.listings.main.params.api,
          scheme: this.FileListingService.listings.main.params.scheme,
          system: this.FileListingService.listings.main.params.system,
          path: this.FileListingService.listings.main.params.path});
      } else {
        $event.preventDefault();
        $event.stopPropagation();
      }
    };

    

  }

export const DataDepotNewComponent = {
    controller: DataDepotNewCtrl,
    controllerAs: '$ctrl',
    template: DataDepotNewTemplate
}
