import './style.css';
import $ from 'jquery';
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

// 加载地图图层列表函数
function updateDataLayersList() {
    const $layersList = $('#layers-list');
    $layersList.empty();

    // 获取所有图层并添加到列表
    map.getLayers().forEach(layer => {
        const $layerItem = $('<div>')
            .addClass('layer-item');

        const $checkbox = $('<input>')
            .attr('type', 'checkbox')
            .addClass('layer-checkbox')
            .prop('checked', layer.getVisible());

        // 监听复选框变化，控制图层可见性
        $checkbox.on('change', function () {
            layer.setVisible(this.checked);
        });

        const $layerName = $('<span>').addClass('layer-name')
            // 设置图层名称
            .text(getLayerName(layer));

        $layerItem.append($checkbox);
        $layerItem.append($layerName);
        $layersList.append($layerItem);
    });
}

// 获取图层名称函数
function getLayerName(layer) {
    // 根据图层类型设置名称
    if (layer.get('title')) {
        return layer.get('title');
    } else if (layer.getSource && layer.getSource().getUrls) {
        return '瓦片图层';
    } else {
        return '矢量图层';
    }
}

// 初始化地图底图
const map = initMap();
// 加载GeoJSON数据
loadDataLayers(map);
// 加载地图图层列表
updateDataLayersList()

import { registerEvent } from './js/control';
registerEvent(map);