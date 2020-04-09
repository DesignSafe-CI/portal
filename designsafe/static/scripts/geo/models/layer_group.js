export default class LayerGroup {

    constructor (label, fg) {
        this.label = label;
        this.feature_group = fg;
        this.show = true;
        this.show_contents = true;
    }

    numFeatures () {
        return this.feature_group.getLayers().length;
    }

    getFeatureType (f) {
    // debugger
        if (f.options.thumb_src) {
            return 'Image';
        } else if (f instanceof L.Marker) {
            return 'Point';
        } else if (f instanceof L.Polygon) {
            return 'Polygon';
        } 
        return 'Path';
    
    }
}
