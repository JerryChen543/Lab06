import { Draw, Select, Modify } from 'ol/interaction';
import { Vector } from 'ol/source';
import { GeoJSON } from 'ol/format';
import { addFeature, editFeature } from './api';
import { showEditPopup } from './popup';
import Collection from 'ol/Collection.js';

export function newFeatures(map,
    source = new Vector({ wrapX: true })) {

    const type = source.get("geometryType");
    const fileName = source.get("fileName");

    // 实例化交互绘制类对象
    const drawInteraction = new Draw({
        // 绘制层数据源
        source: source,
        // 绘制图形类型
        type: type ? type : "Point",
    });

    // 并添加到地图容器中
    map.addInteraction(drawInteraction);

    // 绘制结束事件
    drawInteraction.on('drawend', function (event) {
        // 绘制结束后，将绘制的要素添加到选择交互中
        const feature = event.feature;
        let properties = getFeatureProperties(source);
        resetProperties(properties);
        // 显示编辑弹窗
        showEditPopup(properties,
            (newProperties) => {
                // 保存编辑时，更新要素属性
                feature.setProperties(newProperties);
                const json = featureToJSON(feature, newProperties);
                // 发送绘制的要素到后端
                addFeature(json, fileName);
            },
            () => {
                // 取消编辑时，删除绘制的要素
                source.removeFeature(feature);
            });
    });

    return drawInteraction;
}

export function editFeatures(map,
    source = new Vector({ wrapX: true }),
    stashInteraction = (interaction) => { },
    setOnContextMenu = (callback) => { }
) {
    const fileName = source.get("fileName");
    let selectedFeature = null;
    let modifyInteraction = null;

    // 实例化交互选择类对象
    const selectInteraction = selectFeatures(map, source,
        onSelectFeatures);
    stashInteraction(selectInteraction);

    function onSelectFeatures(features) {
        if (features.length === 0) return;
        selectedFeature = features[0];

        // 实例化交互修改类对象
        if (modifyInteraction) {
            map.removeInteraction(modifyInteraction);
        }
        modifyInteraction = new Modify({
            // 修改层数据源
            source: source,
            features: new Collection([selectedFeature]),
        });

        // 并添加到地图容器中
        map.addInteraction(modifyInteraction);
        stashInteraction(modifyInteraction);

        // 在右键事件中，结束要素形状编辑
        setOnContextMenu(() => { onModifyEnd(); });

        function onModifyEnd() {
            const feature = selectedFeature;
            let properties = feature.getProperties();
            
            // 显示属性编辑弹窗
            showEditPopup(properties,
                onFinishEdit, onCancelEdit);

            function onFinishEdit(newProperties) {
                // 保存编辑时，更新要素属性
                feature.setProperties(newProperties);
                const json = featureToJSON(feature, newProperties);
                editFeature(json, fileName);
                map.removeInteraction(modifyInteraction);
                setOnContextMenu(null);
            }

            function onCancelEdit() {
                // 撤销编辑时，刷新要素显示
                source.refresh();
                map.removeInteraction(modifyInteraction);
            }
        }
    }
}

function selectFeatures(map,
    source = new Vector({ wrapX: true }),
    selectFeatureCallback,
) {
    // 实例化交互选择类对象
    const selectInteraction = new Select({
        // 选择层数据源
        source: source,
        // 选择模式：单选
        multiple: false,
    });

    // 并添加到地图容器中
    map.addInteraction(selectInteraction);

    // 选择要素事件
    selectInteraction.on('select', function (event) {
        selectFeatureCallback(event.selected);
    });

    return selectInteraction;
}

function featureToJSON(feature, properties) {
    //获取绘制要素对象JSON字符串
    const json = new GeoJSON().writeFeature(feature);
    let data = JSON.parse(json);  //转为要素对象
    data["properties"] = properties; //添加属性字段
    return JSON.stringify(data);//转为JSON字符串
}

export function getFeatureProperties(source) {
    const features = source.getFeatures();
    if (features.length === 0) {
        return {};
    }

    let properties = {};
    features.forEach(feature => {
        const featureProperties = feature.getProperties();
        Object.keys(featureProperties).forEach(key => {
            properties[key] = featureProperties[key];
        });
    });
    return properties;
}

function resetProperties(properties) {
    // 移除几何属性
    delete properties["geometry"];

    // 将要素属性重置为缺省值
    Object.keys(properties).forEach(key => {
        switch (typeof properties[key]) {
            case 'number':
                properties[key] = 0;
                break;
            case 'string':
                properties[key] = '';
                break;
            case 'boolean':
                properties[key] = false;
                break;
            default:
                properties[key] = null;
                break;
        }
    });

    return properties;
}