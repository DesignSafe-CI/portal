export default class LayerGroup {

  constructor (label, fg) {
    this.label = label;
    this.feature_group = fg;
    console.log(this.feature_group)
  }

  add_feature (f) {
    this.feature_group.push(f);
  }
}
