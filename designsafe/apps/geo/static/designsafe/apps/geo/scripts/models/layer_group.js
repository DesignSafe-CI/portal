export default class LayerGroup {

  constructor (label, fg) {
    this.label = label;
    this.feature_group = fg;
    this.show = true;
    this.show_contents = true;
  }

  num_features () {
    return this.feature_group.getLayers().length;
  }

  get_feature_type (f) {
    // debugger
    if (f.options.image_src) {
      return 'Image';
    } else if (f instanceof L.Marker) {
      return 'Point';
    } else if (f instanceof L.Polygon) {
      return 'Polygon';
    } else {
      return 'Path';
    }
  }
}
