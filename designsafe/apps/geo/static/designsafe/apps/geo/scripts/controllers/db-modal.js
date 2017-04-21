export default class DBModalCtrl {

  constructor ($scope, $uibModalInstance, filename) {
    'ngInject';
    this.$scope = $scope;
    this.$uibModalInstance = $uibModalInstance;
    this.selected = null;
    this.saveas = {filename: filename}
  }

  ok () {
    console.log(this.saveas.filename)
    this.$uibModalInstance.close({selected:this.selected, saveas:this.saveas.filename});
  };

  cancel () {
    this.$uibModalInstance.dismiss('cancel');
  };
}
