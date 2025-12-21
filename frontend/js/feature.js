import { Draw, Select, Modify } from 'ol/interaction';
import { Vector } from 'ol/source';

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
        // TODO: 发送绘制的要素到后端
        console.log(feature.getGeometry());
    });
    
    return drawInteraction;
}