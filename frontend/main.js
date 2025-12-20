import './style.css';
import $ from 'jquery';
import { Map, View } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import { MapInfo } from './js/config';
import { getTileLayer, MapStyles } from './js/wmts';
import { registerEvent } from './js/control';

/* ==============================
   1️⃣ 初始化地图
================================ */
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

/* ==============================
   2️⃣ 创建 GeoJSON 矢量图层（对接 Flask）
================================ */
function createGeoJsonLayer(options) {
    const {
        title,
        url,
        style
    } = options;

    return new VectorLayer({
        title,
        source: new VectorSource({
            url,
            format: new GeoJSON()
        }),
        style,
        visible: true
    });
}

/* ==============================
   3️⃣ 加载业务数据图层
================================ */
function loadDataLayers(map) {

    const layersConfig = [
        {
            title: '建筑图层',
            url: 'http://127.0.0.1:5000/shp-to-geojson/building',
            style: {
                'fill-color': 'rgba(0, 0, 255, 0.3)',
                'stroke-color': '#0033ff',
                'stroke-width': 1
            }
        },
        {
            title: '道路图层',
            url: 'http://127.0.0.1:5000/shp-to-geojson/road',
            style: {
                'stroke-color': '#ff0000',
                'stroke-width': 2
            }
        },
        {
            title: '校园边界',
            url: 'http://127.0.0.1:5000/shp-to-geojson/boundary',
            style: {
                'fill-color': 'rgba(0, 255, 0, 0.2)',
                'stroke-color': '#00aa00',
                'stroke-width': 2
            }
        }
    ];

    layersConfig.forEach(cfg => {
        const layer = createGeoJsonLayer(cfg);
        map.addLayer(layer);

        // 数据加载完成后自动缩放
        layer.getSource().on('change', () => {
            if (layer.getSource().getState() === 'ready') {
                const extent = layer.getSource().getExtent();
                map.getView().fit(extent, {
                    padding: [40, 40, 40, 40]
                });
            }
        });
    });
}

/* ==============================
   4️⃣ 图层列表 UI（复选框控制）
================================ */
function updateDataLayersList(map) {
    const $layersList = $('#layers-list');
    $layersList.empty();

    map.getLayers().forEach(layer => {

        const title = layer.get('title');
        if (!title) return; // 跳过底图

        const $layerItem = $('<div>').addClass('layer-item');

        const $checkbox = $('<input>')
            .attr('type', 'checkbox')
            .addClass('layer-checkbox')
            .prop('checked', layer.getVisible())
            .on('change', function () {
                layer.setVisible(this.checked);
            });

        const $layerName = $('<span>')
            .addClass('layer-name')
            .text(title);

        $layerItem.append($checkbox).append($layerName);
        $layersList.append($layerItem);
    });
}

/* ==============================
   5️⃣ 主流程
================================ */
const map = initMap();
loadDataLayers(map);
updateDataLayersList(map);
registerEvent(map);
