/**
 * 「此刻」路由系统
 * 基于 hash 的 SPA 路由，支持参数解析、生命周期与底部导航联动
 */

window.CiKeRouter = (function() {

    // 路由表：hash → { pageId, hideNav, renderer }
    const routes = {
        'home':               { pageId: 'page-home',               hideNav: false, renderer: null },
        'mirror':             { pageId: 'page-mirror',             hideNav: false, renderer: null },
        'direction':          { pageId: 'page-direction',          hideNav: false, renderer: null },
        'skills':             { pageId: 'page-skills',             hideNav: false, renderer: null },
        'plan':               { pageId: 'page-plan',               hideNav: false, renderer: null },
        'focus':              { pageId: 'page-focus',              hideNav: false, renderer: null },
        
        // 详情与子页面（隐藏底部导航）
        'skill-detail':       { pageId: 'page-skill-detail',       hideNav: true,  renderer: null },
        'unit-learning':      { pageId: 'page-unit-learning',      hideNav: true,  renderer: null },
        'morning-checkin':    { pageId: 'page-morning-checkin',    hideNav: true,  renderer: null },
        'evening-reflection': { pageId: 'page-evening-reflection', hideNav: true,  renderer: null },
        'new-record':         { pageId: 'page-new-record',         hideNav: true,  renderer: null },
        'goal-detail':        { pageId: 'page-goal-detail',        hideNav: true,  renderer: null },
        'new-goal':           { pageId: 'page-new-goal',           hideNav: true,  renderer: null },
        'focus-timer':        { pageId: 'page-focus-timer',        hideNav: true,  renderer: null },
        'settings':           { pageId: 'page-settings',           hideNav: true,  renderer: null },
    };

    let currentRoute = null;
    let currentParams = {};
    let previousRoute = null;

    /** 注册页面渲染器 */
    function register(routeKey, rendererObj) {
        if (routes[routeKey]) {
            routes[routeKey].renderer = rendererObj;
        }
    }

    /** 初始化路由 */
    function init() {
        window.addEventListener('hashchange', handleHashChange);
        handleInitialRoute();
    }

    /** 处理首次加载路由 */
    function handleInitialRoute() {
        let hash = window.location.hash.substring(1);
        if (!hash || hash === '') {
            // 检查是否已完成今天的晨间打卡
            const morningCheckin = window.CiKeStore.getTodayCheckin('morning');
            if (!morningCheckin) {
                navigate('morning-checkin');
            } else {
                navigate('home');
            }
        } else {
            handleHashChange();
        }
    }

    /** 解析当前 Query 字符串 */
    function parseParams(queryStr) {
        const params = {};
        if (!queryStr) return params;
        queryStr.split('&').forEach(pair => {
            const [k, v] = pair.split('=');
            if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });
        return params;
    }

    /** 处理 hash 变化 */
    function handleHashChange() {
        let fullHash = window.location.hash.substring(1) || 'home';
        const [routeKey, queryStr] = fullHash.split('?');
        const params = parseParams(queryStr);

        if (routes[routeKey]) {
            showPage(routeKey, params);
        } else {
            navigate('home');
        }
    }

    /** 显示页面并触发渲染 */
    function showPage(routeKey, params = {}) {
        // 清理前一个页面
        if (currentRoute && currentRoute !== routeKey) {
            const prevRoute = routes[currentRoute];
            if (prevRoute && prevRoute.renderer && typeof prevRoute.renderer.cleanup === 'function') {
                const prevContainer = document.getElementById(prevRoute.pageId);
                prevRoute.renderer.cleanup(prevContainer);
            }
        }

        previousRoute = currentRoute;
        currentRoute = routeKey;
        currentParams = params;
        const routeConfig = routes[routeKey];

        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });

        // 显示目标页面
        const targetPage = document.getElementById(routeConfig.pageId);
        if (targetPage) {
            targetPage.style.display = 'block';

            // 触发页面渲染，传递 params
            if (routeConfig.renderer) {
                if (typeof routeConfig.renderer.render === 'function') {
                    routeConfig.renderer.render(targetPage, params);
                }
            }
        }

        // 底部导航展示控制与高亮
        const bottomNav = document.getElementById('bottom-nav');
        if (routeConfig.hideNav) {
            bottomNav.style.display = 'none';
        } else {
            bottomNav.style.display = 'flex';
            updateActiveNav(routeKey);
        }

        // 页面置顶滚动
        window.scrollTo(0, 0);
    }

    /** 更新导航栏高亮 */
    function updateActiveNav(routeKey) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-route') === routeKey) {
                item.classList.add('active');
            }
        });
    }

    /** 导航到指定路由（支持携带参数字符串） */
    function navigate(route) {
        window.location.hash = route;
    }

    /** 返回上一页 */
    function goBack() {
        if (previousRoute) {
            navigate(previousRoute);
        } else {
            navigate('home');
        }
    }

    return {
        init,
        register,
        navigate,
        navigateTo: navigate,  // 别名兼容
        goBack,
        getCurrentRoute: () => currentRoute,
        getParams: () => currentParams
    };
})();
