export default class RapidDataService {
  constructor ($http, $q) {
    'ngInject';
    this.$http = $http;
    this.$q = $q;
  }

  get_events (opts) {
    console.log(opts);
    return this.$http.get('/rapid/events', opts).then( (resp) => {
      console.log(resp);
      return resp.data;
    });
  }

  get_event_types () {
    return this.$http.get('/rapid/event-types').then( (resp) => {
      return resp.data;
    });
  }

  search (events, filter_options) {
    let tmp = _.filter(events, (item)=>{
      let f1 = true;
      if (filter_options.event_type) {
        f1 = item.event_type == filter_options.event_type.name;
      }
      let f2 = true;
      if (filter_options.search_text) {
        f2 = item.title.substring(0, filter_options.search_text.length).toLowerCase() === filter_options.search_text.toLowerCase();
      }
      return f1 && f2;
    });
    return tmp;
  }
}
