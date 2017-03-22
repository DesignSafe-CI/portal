export default class DBModalCtrl {

  constructor ($scope, $uibModalInstance) {
    'ngInject';
    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
    this.selected = null;
  }

  ok () {
    this.$uibModalInstance.close(this.selected);
  };

  cancel () {
    this.$uibModalInstance.dismiss('cancel');
  };
}
