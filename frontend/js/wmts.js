import TileLayer from "ol/layer/Tile";
import { XYZ } from 'ol/source';

/** 地图样式的枚举值 */
export const MapStyles = {
    'Amap': {
        'satellite': 'satellite',
        'road': 'road',
        'map': 'map',
    }
}

/** 决定WMTS地图样式的参数style的可选值 */
const MapStyleStrings = {
    'Amap': {
        'satellite': '6',
        'road': '8',
        'map': '7',
    }
}

/** 图层标题翻译 */
const MapServiceTranslator = {
    'service': {
        'Amap': '高德地图',
    },
    'Amap': {
        'satellite': '卫星',
        'road': '路网',
        'map': '地图',
    }
}

/** WMTS接口URL */
export const TileService = {
    'Amap': (
        style,
        notation,
        english
    ) =>
        `https://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=${english ? 'en' : 'zh_cn'}&size=1&scl=${notation ? 2 : 1}&style=${MapStyleStrings.Amap[style]}`
}

export function getTileLayer(
    service = 'Amap',           // 地图服务
    style = MapStyles.Amap.map, // 地图样式，MapStyles[<service>]的枚举值
    notation = false,           // 是否使用注记
    english = false             // 使用英文注记
) {
    const url = TileService[service](style, notation, english);
    return new TileLayer({
        source: new XYZ({
            url: url,
            subdomains: ['1', '2', '3', '4']
        }),
        title: `${MapServiceTranslator[service][style]}@${MapServiceTranslator.service[service]}`,
    });
}

/**
 * From config.js
 */

/** 地图服务信息 */
export const MapServiceOld = {
    'Google': {
        image: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        road: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        map: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    },
    'Amap': {
        image: "https://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
        road: "https://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=2&style=8&ltype=11",
        map: "https://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7",
    },
    'Tencent': {
        map: "http://rt0.map.gtimg.com/tile?z={z}&x={x}&y={-y}&type=vector&styleid=3&version=628",
    }
}

/** 互联网底图列表 */
export const BaseMaps = [
    {
        name: '谷歌影像',
        url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    },
    {
        name: '谷歌道路',
        url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
    },
    {
        name: '谷歌地图',
        url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
    },
    {
        name: '高德影像',
        url: "https://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}"
    },
    {
        name: '高德地图',
        url: "https://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=2&style=8&ltype=11"
    },
    {
        name: '腾讯地图',
        url: "http://rt0.map.gtimg.com/tile?z={z}&x={x}&y={-y}&type=vector&styleid=3&version=628"
    }
];