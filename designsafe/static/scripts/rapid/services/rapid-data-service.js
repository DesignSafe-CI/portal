import _ from 'underscore';

export default class RapidDataService {
    constructor ($http, $q) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
    }

    get_events (opts) {
        return this.$http.get('/recon-portal/events', opts).then( (resp) => {
            resp.data.forEach( (d) =>{
                d.created_date = new Date(d.created_date);
                d.event_date = new Date(d.event_date);
            });
            return resp.data;
        });
    }

    get_event_types () {
        return this.$http.get('/recon-portal/event-types').then( (resp) => {
            return resp.data;
        });
    }

    get_opentopo_catalog(minx, miny, maxx, maxy) {
        const url = `https://portal.opentopography.org/API/otCatalog?productFormat=PointCloud&minx=${minx}&miny=${miny}&maxx=${maxx}&maxy=${maxy}&detail=true&outputFormat=json&include_federated=false`;
        return this.$http.get(url).then((resp) => {
            console.log(resp.data);
            return resp.data;
        }).catch((err) => {
            console.error('Error fetching OpenTopography catalog:', err);
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
                f2 = item.title.toLowerCase().indexOf(filter_options.search_text.toLowerCase()) !== -1;
            }
            let f3 = true;
            if (filter_options.start_date) {
                f3 = item.event_date > filter_options.start_date;
            }
            let f4 = true;
            if (filter_options.end_date) {
                f4 = item.event_date < filter_options.end_date;
            }
            return f1 && f2 && f3 && f4;
        });
        return tmp;
    }
}
