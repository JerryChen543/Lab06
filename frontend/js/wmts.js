import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

export const MapStyles = {
    Amap: {
        satellite: 'satellite',
        road: 'road'
    }
};

export function getTileLayer(provider, style) {
    let url = '';

    if (provider === 'Amap') {
        if (style === 'satellite') {
            url = 'https://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}';
        } else if (style === 'road') {
            url = 'https://webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=7&x={x}&y={y}&z={z}';
        }
    }

    return new TileLayer({
        source: new XYZ({
            url: url,
            crossOrigin: 'anonymous'
        }),
        visible: true
    });
}

