import $ from 'jquery';

export function registerEvent(map) {
    // 点击面板标题或按钮切换面板状态
    $('#panel-header').on('click', togglePanel);
    $('#toggle-panel').on('click', function (e) {
        e.stopPropagation();
        togglePanel();
    });

    // 鼠标悬停在面板上时增加透明度
    $('#panel-container').on('mouseenter', () => {
        $('#panel-container').css('opacity', '0.95');
    });
    $('#panel-container').on('mouseleave', () => {
        $('#panel-container').css('opacity', '0.6');
    });

    // 点击标签页按钮切换标签页
    $('.tab-btn').on('click', function () {
        const tabId = $(this).data('tab');
        switchTab(tabId);
    });

    // 点击建筑信息按钮更新建筑信息
    $('#building-tab-btn').on('click', function () {
        // 更新建筑图层信息
        updateJMDTable(map);
    });
}

function togglePanel() {
    $('#panel-container').toggleClass('expanded');
    $('#toggle-panel').toggleClass('rotated');
}

function switchTab(tabId) {
    // 移除所有标签页的active类
    $('.tab-btn').removeClass('active');
    $('.tab-pane').removeClass('active');

    // 添加当前点击标签页的active类
    $(`#${tabId}-tab`).addClass('active');
    $(`#${tabId}-tab-btn`).addClass('active');
}

function updateJMDTable(map = new Map()) {
    // 清空表格
    $('#jmd-table-body').empty();

    // 获取建筑图层
    const layers = map.getLayers().getArray();
    const jmdLayer = layers
        .filter(layer => layer.get('title') === '建筑图层')[0];
    const jmdFeatures = jmdLayer.getSource().getFeatures();

    // 遍历建筑图层中的特征，更新表格
    jmdFeatures.forEach(feature => {
        const id = feature.getId();
        const properties = feature.getProperties();
        const jmdName = properties['name'];
        if (jmdName) {
            console.log(id, jmdName);
            $('<tr>')
                .append($('<td>').text(id))
                .append($('<td>').text(jmdName))
                .appendTo('#jmd-table-body');
        }
    });
}