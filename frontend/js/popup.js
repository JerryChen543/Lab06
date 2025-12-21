import $ from 'jquery';

// 编辑弹窗相关变量
let saveEdit = null;
let cancelEdit = null;

// 显示编辑弹窗
export function showEditPopup(properties,
    saveEditCallback, cancelEditCallback,
    title = '编辑要素属性') {
    // 存储回调函数
    saveEdit = saveEditCallback;
    cancelEdit = cancelEditCallback;

    const $popup = $('#edit-popup');
    const $overlay = $('#overlay');
    const $form = $('#edit-form');
    const $title = $('#popup-title');

    // 设置弹窗标题
    $title.text(title);

    // 清空表单
    $form.empty();

    // 动态生成表单字段（排除geometry属性）
    for (const [key, value] of Object.entries(properties)) {
        if (key === 'geometry') continue;

        const $formGroup = $('<div>').addClass('form-group');
        const $label = $('<label>').attr('for', `field-${key}`).text(key);
        const $input = $('<input>')
            .attr('type', 'text')
            .attr('id', `field-${key}`)
            .attr('name', key)
            .val(value !== null ? value : '');

        $formGroup.append($label).append($input);
        $form.append($formGroup);
    }

    // 显示弹窗和遮罩层
    $popup.addClass('active');
    $overlay.addClass('active');
}

// 隐藏编辑弹窗
function hideEditPopup() {
    $('#edit-popup').removeClass('active');
    $('#overlay').removeClass('active');
}

// 保存要素属性
function saveFeatureProperties() {
    const $form = $('#edit-form');
    const formData = {};

    // 获取表单数据
    $form.find('input, select, textarea').each(function () {
        const $field = $(this);
        formData[$field.attr('name')] = $field.val();
    });

    // 隐藏弹窗
    hideEditPopup();

    // 更新要素属性
    saveEdit(formData);
}

// 取消保存要素属性
function cancelEditFeatureProperties() {
    // 隐藏弹窗
    hideEditPopup();

    // 调用取消回调函数
    if (cancelEdit) {
        cancelEdit();
    }
}

// 初始化弹窗功能
export function initEditPopup() {
    // 关闭按钮事件
    $('#close-popup').on('click', cancelEditFeatureProperties);

    // 取消按钮事件
    $('#btn-cancel').on('click', cancelEditFeatureProperties);

    // 保存按钮事件
    $('#btn-save').on('click', saveFeatureProperties);

    // 点击遮罩层关闭弹窗
    $('#overlay').on('click', cancelEditFeatureProperties);

    // 点击弹窗内容区域不关闭弹窗
    $('#edit-popup').on('click', function (e) {
        e.stopPropagation();
    });

    // ESC键关闭弹窗
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            cancelEditFeatureProperties();
        }
    });
}