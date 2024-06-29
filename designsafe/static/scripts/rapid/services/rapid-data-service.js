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

    get_open_topography_center_view() {
        const url = "/api/proxy/?url=" + encodeURIComponent("https://portal.opentopography.org/geoserver/OPENTOPO/wfs?SERVICE=WFS&VERSION=1.3.0&REQUEST=GetFeature&TYPENAME=OPENTOPO:datasets_center_view&OUTPUTFORMAT=application/json&CQL_FILTER=host=%27OpenTopography%27%20and%20is_global=false&propertyName=id,geometry");
        return this.$http.get(url).then((resp) => {
            return resp.data.features;
        }).catch((err) => {
            console.error('Error fetching center view Opentopo data:', err);
        });
    }

    get_open_topography_datasets_view() {
        const url = "/api/proxy/?url=" + encodeURIComponent("https://portal.opentopography.org/geoserver/OPENTOPO/wfs?SERVICE=WFS&VERSION=1.3.0&REQUEST=GetFeature&TYPENAME=OPENTOPO:datasets_view&OUTPUTFORMAT=application/json&CQL_FILTER=host=%27OpenTopography%27%20and%20is_global=false&propertyName=id,projectname,url,product_available,start_date,end_date,collection_platform,released_date,ordering,is_restricted");
        return this.$http.get(url).then((resp) => {
            return resp.data.features;
        }).catch((err) => {
            console.error('Error fetching datasets of Opentopo data:', err);
        });
    }

    // combine_open_topography_data(center_view_data, datasets_view_data) {
    //     let combinedData = center_view_data.map(center_view_item => {
    //         let matching_dataset = datasets_view_data.find(dataset_item => dataset_item.properties.id === center_view_item.properties.id);
    //         if (matching_dataset) {
    //             return {
    //                 ...center_view_item,
    //                 properties: {
    //                     ...center_view_item.properties,
    //                     ...matching_dataset.properties
    //                 }
    //             };
    //         }
    //         return center_view_item;
    //     });
    //     console.log(combinedData);
    //     return combinedData;
    // }

    combine_open_topography_data(center_view_data, datasets_view_data) {
        let combinedData = center_view_data.map(center_view_item => {
            let matching_dataset = datasets_view_data.find(dataset_item => dataset_item.properties.id === center_view_item.properties.id);
            if (matching_dataset) {
                return {
                    // Mapping properties to match the event data structure
                    datasets: [{
                        url: matching_dataset.properties.url,
                        doi: matching_dataset.properties.id,
                        id: matching_dataset.properties.id,
                        title: matching_dataset.properties.projectname,
                    }],
                    event_type: "opentopography", // Need to change 
                    title: matching_dataset.properties.projectname,
                    location_description: "", // No description provided in OpenTopo data, keeping it empty
                    location: {
                        lat: center_view_item.geometry.coordinates[1],
                        lon: center_view_item.geometry.coordinates[0]
                    },
                    created_date: matching_dataset.properties.released_date || "", // Assuming released_date as created_date
                    event_date: matching_dataset.properties.start_date || "", // Assuming start_date as event_date
                    end_date: matching_dataset.properties.end_date || "" // Adding end_date if required
                };
            }
            return null;
        }).filter(item => item !== null); // Filtering out any unmatched items
        return combinedData;
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
