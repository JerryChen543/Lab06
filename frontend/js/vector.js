import { Style, Stroke, Fill } from "ol/style";
import { Vector } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { GeoJSON } from "ol/format";
import { WebService, MapLayersData } from "./config";

export function getVectorLayer(layerName) {
    const data = MapLayersData.find(layer => layer.name === layerName);
    if (!data) {
        console.error(`图层 ${layerName} 不存在`);
        return null;
    }

    const source = new VectorSource({
        url: WebService.url + data.url,
        format: new GeoJSON(),
    });

    return new Vector({
        source: source,
        style: getVectorLayerStyle(data)
    });
}

function getVectorLayerStyle(data) {
    if (!data || !data.style) {
        return null;
    }

    switch (data.geomType) {
        case 0:
            return new Style({
                zIndex: data.style.zIndex || 0,
            });
        case 1:
            return new Style({
                stroke: data.style.stroke ? new Stroke({
                    color: data.style.stroke.color,
                    width: data.style.stroke.width
                }) : null,
                zIndex: data.style.zIndex || 0,
            });
        case 2:
            return new Style({
                fill: data.style.fill ? new Fill({
                    color: data.style.fill.color
                }) : null,
                stroke: data.style.stroke ? new Stroke({
                    color: data.style.stroke.color,
                    width: data.style.stroke.width
                }) : null,
                zIndex: data.style.zIndex || 0,
            });
        default:
            return null;
    }
}