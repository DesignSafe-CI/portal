export default class GeoStateService {

  constructor ($scope, $state) {
    'ngInject';
    this.$scope = $scope;
    this.$state = $state;
    this.last_db_path = null;
  }

  
}
