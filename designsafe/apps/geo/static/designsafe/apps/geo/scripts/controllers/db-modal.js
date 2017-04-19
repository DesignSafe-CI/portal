export default class DBModalCtrl {

  constructor ($scope, $uibModalInstance, saveas) {
    'ngInject';
    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
    this.selected = null;
    this.saveas = saveas;
  }

  ok () {
    this.$uibModalInstance.close(this.selected);
  };

  cancel () {
    this.$uibModalInstance.dismiss('cancel');
  };
}
