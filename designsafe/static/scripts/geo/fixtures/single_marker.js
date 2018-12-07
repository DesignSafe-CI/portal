let map = {
    type: 'FeatureCollection',
    features: [{
        type: 'Feature',
        properties: {
            color: '#ff0000',
            fillColor: '#71c4ff',
            fillOpacity: 0.5
        },
        geometry: {
            type: 'Point',
            coordinates: [null, null]
        },
        layer_group_index: 0
    }],
    ds_map: true,
    name: 'New Map',
    description: null,
    num_layers: 1,
    layer_groups: ['New Group']
};
export default map;
