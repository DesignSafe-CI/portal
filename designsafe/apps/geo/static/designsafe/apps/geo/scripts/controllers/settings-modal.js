export default class SettingsModalCtrl {

  constructor ($scope, $uibModalInstance, GeoSettingsService) {
    'ngInject';
    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
    this.GeoSettingsService = GeoSettingsService;
    this.settings = GeoSettingsService.settings;
  }

  ok () {
    this.GeoSettingsService.settings = this.settings;
    this.$uibModalInstance.close(this.settings);
  };

  // cancel () {
  //   this.$uibModalInstance.dismiss('cancel');
  // };
}
