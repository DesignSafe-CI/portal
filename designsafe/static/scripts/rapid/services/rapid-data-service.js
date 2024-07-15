
import _ from 'underscore';
import * as turf from '@turf/turf';

const globalCache = {};

export default class RapidDataService {
    constructor($http, $q) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
    }

    get_events(opts) {
    return this.$http.get('/recon-portal/events', opts).then((resp) => {
        resp.data.forEach((d) => {
            d.created_date = new Date(d.created_date);
            d.event_date = new Date(d.event_date);
        });
        return resp.data;
    });
    }

    get_event_types() {
    return this.$http.get('/recon-portal/event-types').then((resp) => {
        return resp.data;
    });
    }

    fetch_opentopo_catalog(minx, miny, maxx, maxy) {
    const cacheKey = `opentopo_catalog_${minx}_${miny}_${maxx}_${maxy}`;
    if (globalCache.hasOwnProperty(cacheKey)) {
        console.log("cache hit");
        return this.$q.resolve(globalCache[cacheKey]);
    }

    const url = `https://portal.opentopography.org/API/otCatalog?productFormat=PointCloud&minx=${minx}&miny=${miny}&maxx=${maxx}&maxy=${maxy}&detail=true&outputFormat=json&include_federated=false`;
    console.time('fetch_opentopo_catalog');
    return this.$http.get(url, { headers: { 'X-Requested-With': undefined } }).then((resp) => {
        const processedData = this.preprocess_data(resp.data);
        globalCache[cacheKey] = processedData;
        console.timeEnd('fetch_opentopo_catalog');
        return processedData;
    }).catch((err) => {
        console.error('Error fetching OpenTopography catalog:', err);
        console.timeEnd('fetch_opentopo_catalog');
        return this.$q.reject(err);
    });
    }

    preprocess_data(data) {
    const seenUrls = {};
    const result = {
        "type": "FeatureCollection",
        "features": []
    };
    const centroidResult = {
        "type": "FeatureCollection",
        "features": []
    };

    data.Datasets.forEach(dataset => {
        const datasetInfo = dataset.Dataset;
        const url = datasetInfo.url;
        const fileFormat = datasetInfo.fileFormat;

        if (!url) return;

        if (seenUrls[url]) {
            const existingFeature = seenUrls[url];
            if (fileFormat) {
                existingFeature.properties.productAvailable += `, ${fileFormat}`;
            }
        } else {
            let geometry = {};
            if (datasetInfo.spatialCoverage && datasetInfo.spatialCoverage.geo && datasetInfo.spatialCoverage.geo.geojson) {
                const features = datasetInfo.spatialCoverage.geo.geojson.features;
                if (features && features.length > 0) {
                    geometry = features[0].geometry;
                }
            }
            const feature = {
                "type": "Feature",
                "properties": {
                    "id": datasetInfo.identifier?.value,
                    "name": datasetInfo.name,
                    "host": "OpenTopo",
                    "url": datasetInfo.url,
                    "doiUrl": datasetInfo.url,
                    "alternateName": datasetInfo.alternateName,
                    "dateCreated": datasetInfo.dateCreated,
                    "temporalCoverage": datasetInfo.temporalCoverage,
                    "keywords": datasetInfo.keywords,
                    "productAvailable": fileFormat
                },
                "geometry": geometry
            };
            seenUrls[url] = feature;
            result.features.push(feature);

            // Generate centroid
            if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                const geomShape = turf.centroid(feature);
                const centroidFeature = {
                    "type": "Feature",
                    "properties": {
                        "id": datasetInfo.identifier?.value,
                        "name": datasetInfo.name,
                        "host": "OpenTopo",
                        "alternateName": datasetInfo.alternateName,
                        "doiUrl": datasetInfo.url,
                        "dateCreated": datasetInfo.dateCreated,
                        "keywords": datasetInfo.keywords,
                        "temporalCoverage": datasetInfo.temporalCoverage,
                        "url": `/datasetMetadata?otCollectionID=OT.${datasetInfo.identifier?.value.split('.').slice(1).join('.')}`,
                        "productAvailable": fileFormat
                    },
                    "geometry": geomShape.geometry
                };
                centroidResult.features.push(centroidFeature);
            }
        }
    });

    return { original: result, centroids: centroidResult };
    }

    get_opentopo_data(minx, miny, maxx, maxy) {
    return this.fetch_opentopo_catalog(minx, miny, maxx, maxy).then(data => data.centroids);
    }

    get_opentopo_coordinates(doiUrl) {
    const allFeatures = Object.values(globalCache).flatMap(data => data.original.features);
    return this.$q.resolve(allFeatures.find(feature => feature.properties.doiUrl === doiUrl));
    }

    search(events, filter_options) {
    let tmp = _.filter(events, (item) => {
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
