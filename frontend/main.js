import './style.css';
import $ from 'jquery';
import { Map, View } from 'ol';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
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
    let hasFitted = false;   // ⭐ 只定位一次
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

        // 数据加载完成后不在自动缩放
       layer.getSource().on('change', () => {
    if (
        !hasFitted &&
        layer.getSource().getState() === 'ready'
    ) {
        const extent = layer.getSource().getExtent();
        map.getView().fit(extent, {
            padding: [40, 40, 40, 40]
        });

        hasFitted = true;   // ⭐ 之后不再自动缩放
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
  新建功能（Create）
================================ */
function initCreateFunction(map) {

    const $btnCreate = $('#btnCreate');
    let drawInteraction = null;

    $btnCreate.on('click', function () {

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

        // 2️⃣ 防止重复添加 Draw
        if (drawInteraction) {
            map.removeInteraction(drawInteraction);
            drawInteraction = null;
        }

        // 3️⃣ 创建绘制交互（Polygon）
        drawInteraction = new Draw({
            source: buildingLayer.getSource(),
            type: 'Polygon'
        });

        map.addInteraction(drawInteraction);

        // 4️⃣ 监听绘制完成
        drawInteraction.once('drawend', function (evt) {

            // 停止绘制
            map.removeInteraction(drawInteraction);
            drawInteraction = null;

            // 获取新要素
            const feature = evt.feature;

            // 5️⃣ 输入建筑名称
            const name = prompt('请输入建筑名称');
            if (!name) {
                alert('建筑名称不能为空');
                return;
            }

            feature.set('Name', name);

            // 6️⃣ 转为 GeoJSON（坐标系转换）
           const geojson = new GeoJSON().writeFeatureObject(feature);


            // 7️⃣ 发送给 Flask 后端
            fetch('http://127.0.0.1:5000/add-feature/building', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(geojson)
            })
            .then(res => res.json())
            .then(() => {
                alert('新增建筑成功');
                //buildingLayer.getSource().refresh();
            })
            .catch(() => {
                alert('新增建筑失败');
            });
        });
    });
}

/* ==============================
  编辑功能（Step 1：选中建筑）
================================ */
/* ==============================
  编辑功能（Step 2：几何编辑 Modify）
================================ */
/* ==============================
  编辑功能（完整：Select + Modify + Save）
================================ */
function initEditFunction(map) {

    const $btnEdit = $('#btnEdit');
    const $btnSave = $('#btnEditSave');

    let selectInteraction = null;
    let modifyInteraction = null;

    let buildingLayer = null;
    let currentFeature = null;
    let hasGeometryChanged = false;

    // 进入编辑模式
    $btnEdit.on('click', function () {

        map.getLayers().forEach(layer => {
            if (layer.get('title') === '建筑图层') {
                buildingLayer = layer;
            }
        });

        if (!buildingLayer) {
            alert('未找到建筑图层');
            return;
        }

        if (selectInteraction) map.removeInteraction(selectInteraction);
        if (modifyInteraction) map.removeInteraction(modifyInteraction);

        selectInteraction = new Select({ layers: [buildingLayer] });
        modifyInteraction = new Modify({
            features: selectInteraction.getFeatures()
        });

        map.addInteraction(selectInteraction);
        map.addInteraction(modifyInteraction);

        selectInteraction.on('select', function (evt) {
            currentFeature = evt.selected[0];
            hasGeometryChanged = false;
        });

        modifyInteraction.on('modifyend', function (evt) {
            currentFeature = evt.features.getArray()[0];
            hasGeometryChanged = true;
        });
    });

    // 完成编辑并保存
    $btnSave.on('click', function () {

        if (!currentFeature || !hasGeometryChanged) {
            alert('没有需要保存的修改');
            return;
        }

        const fid = currentFeature.getId() ?? currentFeature.ol_uid;
        const oldName = currentFeature.get('Name') ?? '';
        const newName = prompt('修改建筑名称', oldName);
        if (newName === null) return;

        currentFeature.set('Name', newName);

        const geojson = new GeoJSON().writeFeatureObject(currentFeature);

        fetch(`http://127.0.0.1:5000/edit-feature/building/${fid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                geometry: geojson.geometry,
                properties: { Name: newName }
            })
        })
        .then(() => {
            alert('建筑修改成功');
            buildingLayer.getSource().refresh();
            hasGeometryChanged = false;
            currentFeature = null;
        });
    });
}

/* ==============================
  删除功能（Select + DELETE）
================================ */
function initDeleteFunction(map) {

    const $btnDelete = $('#btnDelete');
    let selectInteraction = null;
    let buildingLayer = null;

    $btnDelete.on('click', function () {

        console.log('进入删除模式');

        // 1️⃣ 找到建筑图层
        map.getLayers().forEach(layer => {
            if (layer.get('title') === '建筑图层') {
                buildingLayer = layer;
            }
        });

        if (!buildingLayer) {
            alert('未找到建筑图层');
            return;
        }

        // 2️⃣ 清理旧 Select
        if (selectInteraction) {
            map.removeInteraction(selectInteraction);
            selectInteraction = null;
        }

        // 3️⃣ 创建 Select
        selectInteraction = new Select({
            layers: [buildingLayer]
        });
        map.addInteraction(selectInteraction);

        // 4️⃣ 监听选中
        selectInteraction.on('select', function (evt) {

            const feature = evt.selected[0];
            if (!feature) return;

            const fid = feature.getId() ?? feature.ol_uid;
            const name = feature.get('Name') ?? '未命名';

            const ok = confirm(`确定删除建筑「${name}」吗？`);
            if (!ok) {
                selectInteraction.getFeatures().clear();
                return;
            }

            // 5️⃣ DELETE 到后端
            fetch(`http://127.0.0.1:5000/delete-feature/building/${fid}`, {
                method: 'DELETE'
            })
            .then(res => res.json())
            .then(() => {
                alert('建筑删除成功');
                buildingLayer.getSource().refresh();

                // 删除完成后退出删除模式
                map.removeInteraction(selectInteraction);
                selectInteraction = null;
            })
            .catch(err => {
                console.error(err);
                alert('建筑删除失败');
            });
        });
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
initCreateFunction(map);
initEditFunction(map);
initDeleteFunction(map);




















