/** 后端WEB服务接口 */
export const WebService = {
    /** 服务url */
    url: "http://127.0.0.1:5000/",
    upload_url: 'http://127.0.0.1:5000/upload/'
}

/** 地图初始化信息 */
export const MapInfo = {
    /** 投影系 */
    project: "EPSG:3857",
    /** 地图初始中心坐标 */
    center: [12571507.58, 3269277.94],
    /** 地图初始加载层级 */
    zoom: 17,
    envelope: [12570077.00, 3269604.00, 12572269.00, 3271405.00]
}

export const MapInfo2 = {
    /** 投影系 */
    project: "EPSG:4326",
    /** 地图初始中心坐标 */
    center: [112.931327, 28.161222],
    /** 地图初始加载层级 */
    zoom: 16,
    envelope: [112.931000, 28.161000, 112.935000, 28.164000]
}


/** 数据图层列表 */
export const MapLayersData =
    [
        {
            name: '道路图层',
            geomType: 1,
            url: 'data/road',
            visible: true,
            zIndex: 5,
            style: {
                stroke: {
                    color: '#0000FF',
                    width: 2
                }
            }
        },
        {
            name: '建筑图层',
            geomType: 2,
            url: 'data/jmd',
            visible: true,
            zIndex: 6,
            style: {
                stroke: {
                    color: '#FF0000',
                    width: 1
                },
                fill: {
                    color: '#FFFF00',
                    opacity: 0.5
                }
            }
        },
        {
            name: '校园边界',
            geomType: 2,
            url: 'data/boundary',
            visible: true,
            zIndex: 1,
            style: {
                stroke: {
                    color: '#E4007F',
                    width: 2
                },
                fill: null
            }
        }
    ];