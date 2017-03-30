
export default class MapProject {

  constructor (name) {
    this.name = name;
    this.layer_groups = [];
    this.description = null;
  }

  to_json() {
    let out = {
      "type": "FeatureCollection",
      "features": [],
      "ds_map": true,
      "name": this.name
    };
    this.layer_groups.forEach( (lg) => {
      let tmp = {
        "type": "FeatureCollection",
        "features": [],
        "label": lg.label
      };
      lg.feature_group.getLayers().forEach( (feature) => {
        let json = feature.toGeoJSON();
        //add in any options
        json.label = lg.label;
        if (feature.image_src) {
          json.properties.image_src = feature.image_src;
        }
        tmp.features.push(json);
      });
      out.features.push(tmp);
    });
    return out;
  }

}
