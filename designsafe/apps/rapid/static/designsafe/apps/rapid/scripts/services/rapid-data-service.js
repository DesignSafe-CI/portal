export default class RapidDataService {
  constructor ($http, $q) {
    'ngInject';
    this.$http = $http;
    this.$q = $q;
  }

  get_events (opts) {
    console.log(opts);
    // return this.$http.get('/rapid/events', opts).then( (resp) => {
    //   console.log(resp);
    // });
    let events = [
      {
        title: 'New Zealand Earthquake',
        event_date: new Date(2015, 1, 1),
        event_type: 'earthquake',
        location_description: 'Central New Zealand',
        location: {
          lat: -38.0,
          lon: 177.0,
        }
      },
      {
        title: 'Tejas Flood',
        event_date: new Date(2016, 1, 1),
        event_type: 'flood',
        location_description: 'Central Texas',
        location: {
          lat: 30.0,
          lon: -100.0,
        }
      },
      {
        title: 'New Zealand Earthquake',
        event_date: new Date(2015, 1, 1),
        event_type: 'earthquake',
        location_description: 'Central New Zealand',
        location: {
          lat: -38.0,
          lon: 177.0,
        }
      },
      {
        title: 'Tejas Flood',
        event_date: new Date(2016, 1, 1),
        event_type: 'flood',
        location_description: 'Central Texas',
        location: {
          lat: 30.0,
          lon: -100.0,
        }
      },
      {
        title: 'New Zealand Earthquake',
        event_date: new Date(2015, 1, 1),
        event_type: 'earthquake',
        location_description: 'Central New Zealand',
        location: {
          lat: -38.0,
          lon: 177.0,
        }
      },
      {
        title: 'Tejas Flood',
        event_date: new Date(2016, 1, 1),
        event_type: 'flood',
        location_description: 'Central Texas',
        location: {
          lat: 30.0,
          lon: -100.0,
        }
      },
      {
        title: 'New Zealand Earthquake',
        event_date: new Date(2015, 1, 1),
        event_type: 'earthquake',
        location_description: 'Central New Zealand',
        location: {
          lat: -38.0,
          lon: 177.0,
        }
      },
      {
        title: 'Tejas Flood',
        event_date: new Date(2016, 1, 1),
        event_type: 'flood',
        location_description: 'Central Texas',
        location: {
          lat: 30.0,
          lon: -100.0,
        }
      }
    ];

    return this.$q( (res, rej) => {
      return res(events);
    });
  }

  get_event_types () {
    return [
      {
        event_type: 'earthquake',
        display: 'Earthquake'
      },
      {
        event_type: 'tsunami',
        display: 'Tsunami'
      },
      {
        event_type: 'flood',
        display: 'Flood'
      },
      {
        event_type: 'hurricane',
        display: 'Hurricane'
      },
    ];
  }
}
