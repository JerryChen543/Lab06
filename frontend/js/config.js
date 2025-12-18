/** 后端WEB服务接口 */
export const WebService = {
    /** 服务url */
    url: "http://127.0.0.1:5000/api/",  //代理服务转发地址
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
