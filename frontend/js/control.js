import $ from 'jquery';

export function registerEvent() {
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