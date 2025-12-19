import './style.css';
import { Map, View } from 'ol';
import { MapInfo, MapLayersData } from './js/config';
import { getTileLayer, MapStyles } from './js/wmts';
import { getVectorLayer } from './js/vector';

function initMap() {
    const map = new Map({
        target: 'map',
        layers: [
            getTileLayer('Amap', MapStyles.Amap.satellite),
            getTileLayer('Amap', MapStyles.Amap.road),
        ],
        view: new View({
            center: MapInfo.center,
            zoom: MapInfo.zoom,
            maxZoom: 18
        })
    });
    return map;
}

function loadDataLayers(map) {
    ["建筑图层", "道路图层", "校园边界"].forEach(layerName => {
        const layer = getVectorLayer(layerName);
        if (layer) {
            map.addLayer(layer);
        }
    });
}

// 初始化地图底图
const map = initMap();
// 加载GeoJSON数据
loadDataLayers(map);

import { registerEvent } from './js/control';
registerEvent();