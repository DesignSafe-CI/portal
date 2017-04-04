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
        title: 'Tejas Flood',
        event_date: new Date(2016, 1, 1),
        event_type: 'flood',
        location_description: 'Central Texas',
        main_image_url: '/static/designsafe/apps/rapid/images/example_event.jpeg',
        location: {
          lat: 30.0,
          lon: -100.0,
        },
        datasets: [
          {
            doi: 'doi:123dfsf345',
            href: 'www.designsafe-ci.org/data/browser',
            title: 'Lidar of stuff'
          },
          {
            doi: 'doi:123dfsf345',
            href: 'www.designsafe-ci.org/data/browser',
            title: 'Imagery of things'
          },
          {
            doi: 'doi:123dfsf345',
            href: 'www.designsafe-ci.org/data/browser',
            title: 'Dog pictures and other words for a long title'
          }
        ]
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
        title: 'Japan Tsunami',
        event_date: new Date(2015, 1, 1),
        event_type: 'tsunami',
        location_description: 'Fukushima Japan',
        location: {
          lat: 37.75,
          lon: 140.4676,
        }
      },
      {
        title: 'Oso Landslide',
        event_date: new Date(2015, 1, 1),
        event_type: 'landslide',
        location_description: 'Oso Washington',
        location: {
          lat: 48.27,
          lon: -121.92,
        }
      },
      {
        title: 'Hurricane Katrina',
        event_date: new Date(2015, 1, 1),
        event_type: 'hurricane',
        location_description: 'US Gulf Coast',
        location: {
          lat: 29.27,
          lon: -90.92,
        }
      },
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

  search (events, filter_options) {
    let tmp = _.filter(events, (item)=>{
      let f1 = true;
      if (filter_options.event_type) {
        f1 = item.event_type == filter_options.event_type.event_type;
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
