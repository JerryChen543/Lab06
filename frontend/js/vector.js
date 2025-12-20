// src/js/vector.js
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';

const layerConfig = {
    '建筑图层': 'building',
    '道路图层': 'road',
    '校园边界': 'boundary'
};

export function getVectorLayer(layerName) {
    const shpName = layerConfig[layerName];
    if (!shpName) return null;

    const source = new VectorSource({
        url: `http://127.0.0.1:5000/shp-to-geojson/${shpName}`,
        format: new GeoJSON()
    });

    const layer = new VectorLayer({
        source,
        visible: true
    });

    // ⭐ 关键：给图层一个 title
    layer.set('title', layerName);

    return layer;
}
