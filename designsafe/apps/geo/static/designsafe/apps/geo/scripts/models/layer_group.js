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

}
