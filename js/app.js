/**
 * 「此刻」(CiKe) 主入口
 * 负责模块编排、路由注册、离线 PWA 注册与全局主题初始化
 */

document.addEventListener('DOMContentLoaded', () => {

    // ========== 1. 工具函数库 ==========
    window.CiKeUtils = {
        formatDate(timestamp) {
            const d = new Date(timestamp);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        },

        getGreeting() {
            const hour = new Date().getHours();
            if (hour < 5)  return '夜深了，注意休息';
            if (hour < 11) return '早安，新的一天';
            if (hour < 14) return '中午好，稍作歇息';
            if (hour < 18) return '下午好，继续保持';
            if (hour < 22) return '晚上好，放慢脚步';
            return '夜深了，回归内心的平静';
        },

        getRelativeTime(timestamp) {
            const diff = Date.now() - timestamp;
            const minutes = Math.floor(diff / 60000);
            if (minutes < 1) return '刚刚';
            if (minutes < 60) return `${minutes}分钟前`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}小时前`;
            const days = Math.floor(hours / 24);
            if (days < 30) return `${days}天前`;
            return this.formatDate(timestamp);
        }
    };

    // ========== 2. 包装渲染器 ==========
    function wrapSelfContainedRenderer(module) {
        return {
            render(container, params) {
                if (module && typeof module.render === 'function') {
                    module.render(container, params);
                }
            }
        };
    }

    const router = window.CiKeRouter;
    const store = window.CiKeStore;

    // ========== 3. 注册全量页面模块 ==========
    
    // 🏠 首页
    if (window.HomePage) router.register('home', window.HomePage);

    // 🪞 镜 · 记录模块
    if (window.CiKeMorningCheckin) router.register('morning-checkin', wrapSelfContainedRenderer(window.CiKeMorningCheckin));
    if (window.CiKeEveningReflection) router.register('evening-reflection', wrapSelfContainedRenderer(window.CiKeEveningReflection));
    if (window.CiKeMirror) router.register('mirror', wrapSelfContainedRenderer(window.CiKeMirror));
    if (window.CiKeNewRecord) router.register('new-record', wrapSelfContainedRenderer(window.CiKeNewRecord));

    // 🧭 路 · 方向模块
    if (window.DirectionPage) router.register('direction', window.DirectionPage);
    if (window.GoalDetailPage) router.register('goal-detail', window.GoalDetailPage);
    if (window.NewGoalPage) router.register('new-goal', window.NewGoalPage);

    // 🏛️ 修 · 五艺模块
    if (window.SkillsPage) router.register('skills', window.SkillsPage);
    if (window.SkillDetailPage) router.register('skill-detail', window.SkillDetailPage);
    if (window.UnitLearningPage) router.register('unit-learning', window.UnitLearningPage);

    // 📐 图 · 计划看板模块
    if (window.PlanPage) router.register('plan', window.PlanPage);

    // 🔥 炬 · 专注模块
    if (window.FocusPage) router.register('focus', window.FocusPage);
    if (window.FocusTimerPage) router.register('focus-timer', window.FocusTimerPage);

    // ⚙️ 设置与数据主权中心
    if (window.SettingsPage) router.register('settings', window.SettingsPage);

    // ========== 4. 初始化主题与偏好 ==========
    const currentSettings = store.getSettings();
    store.applyTheme(currentSettings.theme);

    // ========== 5. 启动路由 ==========
    router.init();

    // ========== 6. 注册 PWA Service Worker (离线加速) ==========
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
            console.log('[PWA] Service Worker 注册成功:', reg.scope);
        }).catch((err) => {
            console.log('[PWA] Service Worker 注册被跳过或未支持:', err);
        });
    }

    console.log('「此刻」(CiKe) v1.0.0 正式发布版已就绪 🚀');
});
