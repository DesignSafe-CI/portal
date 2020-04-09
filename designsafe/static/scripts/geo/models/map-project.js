import * as GeoUtils from '../utils/geo-utils';
import angular from 'angular';

export default class MapProject {

    constructor (name) {
        this.name = name;
        this.layer_groups = [];
        this.description = null;
    }

    clear() {
        this.layer_groups.forEach( (lg) => {
            lg.feature_group.clearLayers();
        });
    }

    getBounds() {
        let bounds = [];
        this.layer_groups.forEach( (lg) => {
            bounds.push(lg.feature_group.getBounds());
        });
        return bounds;
    }

    numFeatures() {
        let total = 0;
        this.layer_groups.forEach( (lg) => {
            total += lg.numFeatures();
        });
        return total;
    }

    toJson() {
        let out = {
            type: 'FeatureCollection',
            features: [],
            ds_map: true,
            name: this.name,
            description: this.description,
            num_layers: this.layer_groups.length,
            layer_groups: []
        };
        this.layer_groups.forEach( (lg, lg_idx) => {
            out.layer_groups.push(lg.label);
            lg.feature_group.getLayers().forEach( (feature) => {
                let json = feature.toGeoJSON();
                // These are all the keys in the options object that we need to
                // re-create the layers in the application after loading.


                for (let key in feature.options) {
                    if (GeoUtils.RESERVED_KEYS.indexOf(key) !== -1) {
                        json.properties[key] = feature.options[key];
                    }
                }
                json.layer_group_index = lg_idx;

                //this strips out all the $$angular cruft
                json = JSON.parse(angular.toJson(json));
                out.features.push(json);
            });
        });
        return out;
    }

}
