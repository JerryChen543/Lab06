import './style.css';
import $ from 'jquery';
import { Map, View } from 'ol';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';


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
        style,
        dataProjection = 'EPSG:4326' // ⭐ 默认是 4326
    } = options;

    return new VectorLayer({
        title,
        source: new VectorSource({
            url,
            format: new GeoJSON({
                dataProjection: dataProjection,
                featureProjection: 'EPSG:3857'
            })
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
    dataProjection: 'EPSG:3857',
    style: createStyle({
        fillColor: 'rgba(255, 255, 0, 0.5)',
        strokeColor: '#ff0000',
        strokeWidth: 1
      })
    },

    {
    title: '道路图层',
    url: 'http://127.0.0.1:5000/shp-to-geojson/road',
    dataProjection: 'EPSG:4326',
    style: createStyle({
        strokeColor: '#0000ff',
        strokeWidth: 2
    })
    },

    {
    title: '校园边界',
    url: 'http://127.0.0.1:5000/shp-to-geojson/boundary',
    dataProjection: 'EPSG:4326',
    style: createStyle({
        strokeColor: '#ff00ff',
        strokeWidth: 2
    })
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
   样式工厂函数
================================ */
function createStyle(options) {
    const { fillColor, strokeColor, strokeWidth } = options;

    return new Style({
        fill: fillColor
            ? new Fill({ color: fillColor })
            : null,
        stroke: new Stroke({
            color: strokeColor,
            width: strokeWidth
        })
    });
}


/* ==============================
 12.21  Step 1：浏览功能（建筑列表）
================================ */
function initBrowseFunction(map) {

    const $btnBrowse = $('#btnBrowse');
    const $table = $('#buildingTable');
    const $tbody = $('#buildingTable tbody');

    $btnBrowse.on('click', function () {

        $tbody.empty();

        // 1️⃣ 找到建筑图层
        let buildingLayer = null;
        map.getLayers().forEach(layer => {
            if (layer.get('title') === '建筑图层') {
                buildingLayer = layer;
            }
        });

        if (!buildingLayer) {
            alert('未找到建筑图层');
            return;
        }

        // 2️⃣ 读取要素
        const features = buildingLayer.getSource().getFeatures();

        if (features.length === 0) {
            alert('建筑图层暂无数据');
            return;
        }

        // 3️⃣ 填充表格
        features.forEach(feature => {

            const id = feature.getId() ?? '—';
            const name = feature.get('Name') ?? '未命名';

            const $tr = $('<tr>');
            $tr.append($('<td>').text(id));
            $tr.append($('<td>').text(name));

            $tbody.append($tr);
        });

        // 4️⃣ 显示表格
        $table.show();
    });
}


/* ==============================
   5️⃣ 主流程
================================ */
const map = initMap();
loadDataLayers(map);
updateDataLayersList(map);
registerEvent(map);
initBrowseFunction(map);






