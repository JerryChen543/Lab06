import './style.css';
import { Map, View } from 'ol';
import { MapInfo } from './js/config';
import { getTileLayer, MapStyles } from './js/wmts';

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

// 初始化地图底图
const map = initMap();
