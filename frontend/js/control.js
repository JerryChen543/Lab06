import $ from 'jquery';
import { initEditPopup } from './popup.js';
import { newFeatures, editFeatures, getFeatureProperties } from './feature.js';

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

    // 初始化编辑弹窗
    initEditPopup();

    // 新建、编辑、删除按钮按下切换active状态
    const featureManagementBtns =
        [$('#btn-new'), $('#btn-edit'), $('#btn-delete')];
    function unselectAllToolButtons() {

        featureManagementBtns.forEach($btn => {
            $btn.removeClass('active');
        });

        // 移除交互
        interaction && map.removeInteraction(interaction);
        interaction = null;
    }
    function selectCurrentToolButton($btn) {
        const active = !$btn.hasClass('active');
        // 先取消所有工具按钮的选中状态
        unselectAllToolButtons();
        // 再切换当前工具按钮的选中状态
        if (active) {
            $btn.addClass('active');
        } else {
            $btn.removeClass('active');
        }
        return active;
    }

    let interaction = null;
    const selectedLayer = map.getLayers().getArray()
        .filter(layer => layer.get('title') === '建筑图层')[0];
    // 新建要素按钮
    $('#btn-new').on('click', function () {
        // 选中当前按钮
        const active = selectCurrentToolButton($(this));
        if (!active) return;

        // 添加绘制交互
        interaction = newFeatures(map,
            selectedLayer.getSource());
    });

    // 编辑要素按钮
    $('#btn-edit').on('click', function () {
        // 选中当前按钮
        const active = selectCurrentToolButton($(this));
        if (!active) return;

        // 添加编辑交互
        interaction = editFeatures(map,
            selectedLayer.getSource());
    });

    // 删除要素按钮
    $('#btn-delete').on('click', function () {
        // 选中当前按钮
        const active = selectCurrentToolButton($(this));
        // TODO: 删除要素
    });

    // 右键点击地图时，取消当前启用的工具
    $('#map').on('contextmenu', function (e) {
        e.preventDefault();
        unselectAllToolButtons();
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

    // 获取建筑图层的数据源，更新表头
    const jmdLayerSource = jmdLayer.getSource();
    const properties = getFeatureProperties(jmdLayerSource);
    const featureKeys = Object.keys(properties);
    const $header = $('<tr>');
    featureKeys.forEach(key => {
        if (key == "geometry") return;
        $header.append($('<th>').text(key));
    });
    $('#jmd-table thead').append($header);

    // 遍历建筑图层中的要素，更新表格
    const jmdFeatures = jmdLayerSource.getFeatures();
    jmdFeatures.forEach(feature => {
        const $row = $('<tr>');
        const values = [];
        featureKeys.forEach(key => {
            if (key == "geometry") return;
            values.push(feature.get(key));
        });

        // 跳过有属性值为null的要素
        if (values.some(value => value === null)) return;

        values.forEach(value => {
            $row.append($('<td>').text(value));
        });
        $row.appendTo('#jmd-table-body');
    });
}