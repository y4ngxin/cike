/**
 * 🧩 「此刻」通用 UI 组件层 (CiKe UI Kit)
 *
 * 用应用内浮层替代浏览器原生 alert / confirm / prompt，统一「温暖人文」的质感。
 * 全部 API 返回 Promise，样式沿用设计系统 CSS 变量，自动适配米白 / 暗夜主题。
 *
 *   CiKeUI.toast('已保存', 'success');
 *   const ok    = await CiKeUI.confirm({ title: '删除', message: '确定删除吗？', danger: true });
 *   const text  = await CiKeUI.prompt({ title: '今日一事', placeholder: '今天最想做成的一件事' });
 *   const vals  = await CiKeUI.form({ title: '番茄参数', fields: [ { key: 'workMinutes', label: '专注时长', type: 'number', min: 1, max: 180 } ] });
 *
 * 约定：取消 / 点遮罩 / 按 Esc 一律返回 null（confirm 返回 false）。
 */
window.CiKeUI = (function () {
    'use strict';

    const raf = window.requestAnimationFrame
        ? window.requestAnimationFrame.bind(window)
        : function (cb) { return setTimeout(cb, 16); };

    let toastWrap = null;

    function ensureToastWrap() {
        if (toastWrap && document.body.contains(toastWrap)) return toastWrap;
        toastWrap = document.createElement('div');
        toastWrap.className = 'cike-toast-wrap';
        document.body.appendChild(toastWrap);
        return toastWrap;
    }

    /**
     * 顶部轻提示
     * @param {string} message
     * @param {'info'|'success'|'warn'|'error'} [type]
     * @param {number} [duration] 毫秒，默认 2200
     */
    function toast(message, type, duration) {
        if (message == null || message === '') return null;
        type = type || 'info';
        duration = typeof duration === 'number' ? duration : 2200;

        const wrap = ensureToastWrap();
        const node = document.createElement('div');
        node.className = 'cike-toast';
        node.setAttribute('data-type', type);
        node.setAttribute('role', 'status');
        node.textContent = String(message);
        wrap.appendChild(node);

        raf(() => node.classList.add('show'));

        const timer = setTimeout(() => {
            node.classList.remove('show');
            setTimeout(() => node.remove(), 260);
        }, duration);

        return {
            close() { clearTimeout(timer); node.classList.remove('show'); setTimeout(() => node.remove(), 260); }
        };
    }

    /**
     * 打开浮层，返回控制器。close(result) 触发 onClose(result)。 */
    function openOverlay(escapeResult) {
        const overlay = document.createElement('div');
        overlay.className = 'cike-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'cike-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        let settled = false;
        let onClose = null;

        function onKey(e) {
            if (e.key === 'Escape') close(escapeResult);
        }

        function close(result) {
            if (settled) return;
            settled = true;
            document.removeEventListener('keydown', onKey);
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 240);
            if (onClose) onClose(result);
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(escapeResult);
        });
        document.addEventListener('keydown', onKey);
        raf(() => overlay.classList.add('show'));

        return {
            overlay, dialog, close,
            setOnClose(fn) { onClose = fn; },
            isSettled() { return settled; }
        };
    }

    function addTitle(dialog, title) {
        if (!title) return;
        const h = document.createElement('div');
        h.className = 'cike-dialog-title';
        h.textContent = title;
        dialog.appendChild(h);
    }

    function addMessage(dialog, message) {
        if (!message) return;
        const p = document.createElement('div');
        p.className = 'cike-dialog-msg';
        p.textContent = message;
        dialog.appendChild(p);
    }

    function addActions(dialog, opts) {
        const bar = document.createElement('div');
        bar.className = 'cike-dialog-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn cike-btn-ghost';
        cancelBtn.textContent = opts.cancelText || '取消';

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'btn ' + (opts.danger ? 'cike-btn-danger' : 'btn-primary');
        confirmBtn.textContent = opts.confirmText || '确定';

        bar.appendChild(cancelBtn);
        bar.appendChild(confirmBtn);
        dialog.appendChild(bar);
        return { confirmBtn, cancelBtn };
    }

    /** 确认框 → Promise<boolean> */
    function confirm(opts) {
        opts = opts || {};
        return new Promise((resolve) => {
            const inst = openOverlay(false);
            addTitle(inst.dialog, opts.title);
            addMessage(inst.dialog, opts.message);
            const { confirmBtn, cancelBtn } = addActions(inst.dialog, opts);
            cancelBtn.addEventListener('click', () => inst.close(false));
            confirmBtn.addEventListener('click', () => inst.close(true));
            inst.setOnClose(resolve);
            setTimeout(() => { try { confirmBtn.focus(); } catch (e) {} }, 30);
        });
    }

    /** 输入框 → Promise<string|null> */
    function prompt(opts) {
        opts = opts || {};
        return new Promise((resolve) => {
            const inst = openOverlay(null);
            addTitle(inst.dialog, opts.title);
            addMessage(inst.dialog, opts.message);

            const field = document.createElement('div');
            field.className = 'cike-field';

            const input = document.createElement(opts.multiline ? 'textarea' : 'input');
            if (!opts.multiline) input.type = 'text';
            input.value = opts.defaultValue != null ? String(opts.defaultValue) : '';
            input.placeholder = opts.placeholder || '';
            if (opts.multiline) input.rows = opts.rows || 4;

            const err = document.createElement('div');
            err.className = 'cike-field-error';
            err.textContent = opts.errorText || '这一项不能为空';

            field.appendChild(input);
            field.appendChild(err);
            inst.dialog.appendChild(field);

            const { confirmBtn, cancelBtn } = addActions(inst.dialog, opts);

            function submit() {
                const val = input.value.trim();
                if (opts.required && !val) {
                    field.classList.add('invalid');
                    try { input.focus(); } catch (e) {}
                    return;
                }
                inst.close(val === '' ? null : val);
            }

            cancelBtn.addEventListener('click', () => inst.close(null));
            confirmBtn.addEventListener('click', submit);
            input.addEventListener('input', () => field.classList.remove('invalid'));
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !opts.multiline) { e.preventDefault(); submit(); }
            });
            inst.setOnClose(resolve);
            setTimeout(() => { try { input.focus(); } catch (e) {} }, 30);
        });
    }

    /**
     * 多字段表单 → Promise<object|null>
     * fields: [{ key, label, type:'text'|'number', value, placeholder, hint, error, required, min, max }]
     */
    function form(opts) {
        opts = opts || {};
        const fields = opts.fields || [];

        return new Promise((resolve) => {
            const inst = openOverlay(null);
            addTitle(inst.dialog, opts.title);
            addMessage(inst.dialog, opts.message);

            const controls = [];
            fields.forEach((f) => {
                const field = document.createElement('div');
                field.className = 'cike-field';

                if (f.label) {
                    const lab = document.createElement('label');
                    lab.textContent = f.label;
                    field.appendChild(lab);
                }

                const input = document.createElement('input');
                input.type = f.type === 'number' ? 'number' : 'text';
                if (f.type === 'number') {
                    if (f.min != null) input.min = f.min;
                    if (f.max != null) input.max = f.max;
                    input.inputMode = 'numeric';
                }
                input.value = f.value != null ? String(f.value) : '';
                input.placeholder = f.placeholder || '';
                field.appendChild(input);

                if (f.hint) {
                    const hint = document.createElement('div');
                    hint.className = 'cike-field-hint';
                    hint.textContent = f.hint;
                    field.appendChild(hint);
                }

                const err = document.createElement('div');
                err.className = 'cike-field-error';
                err.textContent = f.error || '请填写有效值';
                field.appendChild(err);

                inst.dialog.appendChild(field);
                input.addEventListener('input', () => field.classList.remove('invalid'));
                controls.push({ f, input, field });
            });

            const { confirmBtn, cancelBtn } = addActions(inst.dialog, opts);

            function submit() {
                const result = {};
                let ok = true;
                controls.forEach(({ f, input, field }) => {
                    const raw = input.value.trim();
                    if (f.type === 'number') {
                        const n = Number(raw);
                        const bad = raw === '' || isNaN(n) ||
                            (f.min != null && n < f.min) || (f.max != null && n > f.max);
                        if (bad) { field.classList.add('invalid'); ok = false; return; }
                        result[f.key] = n;
                    } else {
                        if (f.required && raw === '') { field.classList.add('invalid'); ok = false; return; }
                        result[f.key] = raw;
                    }
                });
                if (!ok) {
                    const firstBad = controls.find(c => c.field.classList.contains('invalid'));
                    if (firstBad) { try { firstBad.input.focus(); } catch (e) {} }
                    return;
                }
                inst.close(result);
            }

            cancelBtn.addEventListener('click', () => inst.close(null));
            confirmBtn.addEventListener('click', submit);
            inst.dialog.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); submit(); }
            });
            inst.setOnClose(resolve);
            setTimeout(() => { if (controls[0]) { try { controls[0].input.focus(); } catch (e) {} } }, 30);
        });
    }

    return { toast, confirm, prompt, form };
})();
