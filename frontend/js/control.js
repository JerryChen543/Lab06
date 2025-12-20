export function registerEvent(map) {
    // 简单示例：点击地图显示坐标
    map.on('click', function(evt) {
        const coord = evt.coordinate;
        const info = document.getElementById('layers-list');
        info.innerHTML = `点击坐标: [${coord[0].toFixed(2)}, ${coord[1].toFixed(2)}]`;
    });
}

