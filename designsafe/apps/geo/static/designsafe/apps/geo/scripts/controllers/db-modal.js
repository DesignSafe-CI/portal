export default class DBModalCtrl {

  constructor ($scope, $uibModalInstance) {
    'ngInject';
    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
  }

  ok () {
    this.$uibModalInstance.close();
  };

  cancel () {
    this.$uibModalInstance.dismiss('cancel');
  };
}
