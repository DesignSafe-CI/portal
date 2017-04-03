export default class RapidDataService {
  constructor ($http) {
    'ngInject';
    this.$http = $http;
  }

  get_events (opts) {
    console.log(opts);
    $http.get('/rapid/events', opts).then( (resp) => {
      console.log(resp);
    });
  }
}
