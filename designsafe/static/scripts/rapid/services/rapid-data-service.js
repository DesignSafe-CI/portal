import _ from "underscore";
import * as turf from "@turf/turf";

export default class RapidDataService {
  constructor($http, $q) {
    "ngInject";
    this.$http = $http;
    this.$q = $q;
    this.opentopoData = null;
  }

  get_events(opts) {
    return this.$http.get("/recon-portal/events", opts).then((resp) => {
      resp.data.forEach((d) => {
        d.created_date = new Date(d.created_date);
        d.event_date = new Date(d.event_date);
      });
      return resp.data;
    });
  }

  get_event_types() {
    return this.$http.get("/recon-portal/event-types").then((resp) => {
      return resp.data;
    });
  }

  fetch_opentopo_catalog() {
    if (this.opentopoData) {
      return this.$q.resolve(this.opentopoData);
    }
    // use the below url - to fetch the data using front-end only
    // const url = `https://portal.opentopography.org/API/otCatalog?productFormat=PointCloud&minx=${minx}&miny=${miny}&maxx=${maxx}&maxy=${maxy}&detail=true&outputFormat=json&include_federated=false`;
    // requested with headers set to undefined to avoid cors error
    // return this.$http.get(url, { headers: { 'X-Requested-With': undefined } }).then((resp) => {
    return this.$http
      .get("/recon-portal/opentopo/")
      .then((resp) => {
        this.opentopoData = this.preprocess_data(resp.data);
        return this.opentopoData;
      })
      .catch((err) => {
        console.error("Error fetching OpenTopography catalog:", err);
        return this.$q.reject(err);
      });
  }

  preprocess_data(data) {
    const seenUrls = new Map();
    const result = {
      type: "FeatureCollection",
      features: [],
    };
    const centroidResult = {
      type: "FeatureCollection",
      features: [],
    };

    data.Datasets.forEach(({ Dataset: datasetInfo }) => {
      const {
        url,
        fileFormat,
        spatialCoverage,
        identifier,
        name,
        alternateName,
        dateCreated,
        temporalCoverage,
        keywords,
      } = datasetInfo;

      if (!url) return;

      if (seenUrls.has(url)) {
        const existingFeature = seenUrls.get(url);
        if (fileFormat) {
          existingFeature.properties.productAvailable += `, ${fileFormat}`;
        }
      } else {
        let geometry = {};
        if (spatialCoverage?.geo?.geojson?.features?.[0]?.geometry) {
          geometry = spatialCoverage.geo.geojson.features[0].geometry;
        }

        const feature = {
          type: "Feature",
          properties: {
            id: identifier?.value,
            name,
            host: "OpenTopo",
            url,
            doiUrl: url,
            alternateName,
            dateCreated,
            temporalCoverage,
            keywords,
            productAvailable: fileFormat,
          },
          geometry,
        };
        seenUrls.set(url, feature);
        result.features.push(feature);

        // Generate centroid
        if (
          geometry &&
          (geometry.type === "Polygon" || geometry.type === "MultiPolygon")
        ) {
          const geomShape = turf.centroid(feature);
          const centroidFeature = {
            type: "Feature",
            properties: {
              id: identifier?.value,
              name,
              host: "OpenTopo",
              alternateName,
              doiUrl: url,
              dateCreated,
              keywords,
              temporalCoverage,
              url: `/datasetMetadata?otCollectionID=OT.${identifier?.value.split(".").slice(1).join(".")}`,
              productAvailable: fileFormat,
            },
            geometry: geomShape.geometry,
          };
          centroidResult.features.push(centroidFeature);
        }
      }
    });

    return { original: result, centroids: centroidResult };
  }

  get_opentopo_data() {
    return this.fetch_opentopo_catalog().then((data) => data.centroids);
  }

  get_opentopo_coordinates(doiUrl) {
    return this.fetch_opentopo_catalog().then((data) => {
      const allFeatures = data.original.features;
      return allFeatures.find(
        (feature) => feature.properties.doiUrl === doiUrl,
      );
    });
  }

  searchEvents(events, filter_options) {
    const { event_type, search_text, start_date, end_date } = filter_options;

    return _.filter(events, (item) => {
      const matchesEventType = !event_type || item.event_type === event_type.name;
      const matchesSearchText = !search_text || item.title.toLowerCase().includes(search_text.toLowerCase());
      const matchesStartDate = !start_date || item.event_date > start_date;
      const matchesEndDate = !end_date || item.event_date < end_date;

      return matchesEventType && matchesSearchText && matchesStartDate && matchesEndDate;
    });
  }


  searchOpenTopo(openTopoData, opentopo_filter_options, filter_options) {
    const { search_text } = filter_options;
    const { keyword, ot_start_date, ot_end_date } = opentopo_filter_options;

    return _.filter(openTopoData, (item) => {
      const { name, keywords, temporalCoverage } = item.properties;

      // Filter by search text
      const matchesSearchText = !search_text || name.toLowerCase().includes(search_text.toLowerCase());

      // Filter by keyword
      const matchesKeyword = !keyword || keywords.split(',')
        .some(kw => kw.trim().toLowerCase().startsWith(keyword.toLowerCase()));

      // Parse temporal coverage
      const [start, end] = temporalCoverage.split("/").map(date => new Date(date));
      const startDate = start || new Date();
      const endDate = end || startDate;

      // Filter by date range
      const matchesStartDate = !ot_start_date || startDate > ot_start_date;
      const matchesEndDate = !ot_end_date || endDate < ot_end_date;

      return matchesSearchText && matchesKeyword && matchesStartDate && matchesEndDate;
    });
  }

}
