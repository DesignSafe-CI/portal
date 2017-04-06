
export default class MapProject {

  constructor (name) {
    this.name = name;
    this.layer_groups = [];
    this.description = null;
  }

  clear() {
    this.layer_groups.forEach( (lg) => {
      console.log(lg)
      lg.feature_group.clearLayers();
    });
  }


  to_json() {
    let out = {
      "type": "FeatureCollection",
      "features": [],
      "ds_map": true,
      "name": this.name,
      "description": this.description
    };
    this.layer_groups.forEach( (lg) => {
      let tmp = {
        "type": "FeatureCollection",
        "features": [],
        "label": lg.label
      };
      lg.feature_group.getLayers().forEach( (feature) => {
        let json = feature.toGeoJSON();
        console.log(feature, json)
        let opts = _.clone(feature.options);
        delete opts.icon;
        let opt_keys = ['label', 'color', 'fillColor', 'description', 'image_src', 'thumb_src'];

        //add in any options
        if (feature.options.image_src) {
          json.properties.image_src = feature.options.image_src;
        }
        if (feature.options.thumb_src) {
          json.properties.thumb_src = feature.options.thumb_src;
        }
        for (let key in opts) {
          json.properties[key] = opts[key];
        };
        tmp.features.push(json);
      });
      out.features.push(tmp);
    });
    return out;
  }

}
