/**
 * 页面与交互回归：冷启动 / 晨间三问出口 / 导航结构 / 路页分段
 * 五步顺序门禁（B2）/ 答题即时重想（B5）/ 复习站即时练习（B5）
 * 大厅单口径（B3）/ 首页结构 / focus 单入口（B6）/ 原生弹窗零调用
 */
const fs = require('fs');
const path = require('path');
const { boot, createAssert, sleep, settle, ROOT } = require('./helpers/boot');

module.exports = {
    name: 'pages · 页面与交互',
    run: async () => {
        const A = createAssert();

        // ========== 1. 冷启动与导航结构（B1）==========
        {
            const { window, router, document } = boot();
            await settle(window);
            A.eq('冷启动（无 hash）落首页而非晨间三问', router.getCurrentRoute(), 'home');

            const navItems = [...document.querySelectorAll('.nav-item')].map(i => i.getAttribute('data-route'));
            A.eq('底部导航 5 Tab 顺序', navItems.join(','), 'home,mirror,direction,skills,focus');
            A.ok('导航无 plan 项', !navItems.includes('plan'));

            // #plan 别名重定向
            window.location.hash = 'plan';
            await settle(window);
            A.eq('#plan 重定向到路页', router.getCurrentRoute(), 'direction');
            A.eq('重定向携带计划分段', router.getParams().seg, 'plan');
        }

        // ========== 2. 晨间三问「稍后再说」（B1）==========
        {
            const { window, document } = boot();
            window.CiKeMorningCheckin.render();
            const skip = document.querySelector('#morning-skip');
            A.ok('晨间三问有「稍后再说」出口', !!skip);
            skip.click();
            await settle(window);
            A.eq('点击后回到首页', window.CiKeRouter.getCurrentRoute(), 'home');
        }

        // ========== 3. 路页分段 ==========
        {
            const { window, document, router } = boot();
            window.location.hash = 'direction';
            await settle(window);
            const activeTab = document.querySelector('.direction-seg-btn[aria-selected="true"]');
            A.ok('路页冷启动默认北极星分段', !!activeTab && activeTab.textContent.includes('北极星'));
            const planTab = [...document.querySelectorAll('.direction-seg-btn')].find(t => t.textContent.includes('计划'));
            planTab.click();
            await sleep(20);
            A.ok('切换到计划分段后渲染四象限', document.getElementById('page-direction').innerHTML.includes('四象限'));
        }

        // ========== 4. 五步顺序门禁（B2）==========
        {
            const { window, document, store } = boot();
            const MK = 'meta_learning';
            const container = document.getElementById('page-unit-learning');
            const render = () => window.UnitLearningPage.render(container, { skill: MK, unit: 1 });

            render();
            let html = container.innerHTML;
            A.ok('未读「知」时「练」渲染为锁定卡', !html.includes('id="quiz-area"') && html.includes('🔒'));
            A.ok('未读「知」时观/行/省均锁定', (html.match(/🔒/g) || []).length >= 4);
            A.ok('锁定态不渲染「保存反思」按钮', !html.includes('btn-save-reflect'));
            A.ok('步骤总览渲染 5 个节点', container.querySelectorAll('.step-nav-dot').length === 5);
            A.ok('锁定的总览节点不可点', [...container.querySelectorAll('.step-nav-dot')].filter(b => b.disabled).length >= 3);

            // 完成「知」→ 练解锁，其余仍锁
            store.completeSkillStep(MK, 1, 'know');
            render();
            html = container.innerHTML;
            A.ok('完成「知」后「练」解锁并可作答', html.includes('id="quiz-area"') && container.querySelectorAll('.quiz-opt').length > 0);
            A.ok('练未过时「观」仍锁定', !html.includes('btn-done-observe'));

            // 测验未通过 → 观仍锁
            const quiz = window.CiKeSkillsContent[`${MK}:1`].quiz;
            store.saveQuizResult(MK, 1, quiz.map((q, i) => ({ index: i, correct: false })));
            render();
            A.ok('测验未通过 → 「观」保持锁定', !container.innerHTML.includes('btn-done-observe'));

            // 通过测验 → 观解锁，行仍锁
            store.saveQuizResult(MK, 1, quiz.map((q, i) => ({ index: i, correct: true })));
            render();
            A.ok('测验通过后「观」解锁', container.innerHTML.includes('btn-done-observe'));
            A.ok('观未完成时「行」仍锁定', !container.innerHTML.includes('btn-done-practice'));

            // 观 → 行解锁；行 → 省解锁
            store.completeSkillStep(MK, 1, 'observe');
            render();
            A.ok('完成「观」后「行」解锁', container.innerHTML.includes('btn-done-practice'));
            store.completeSkillStep(MK, 1, 'practice');
            render();
            A.ok('完成「行」后「省」解锁', container.innerHTML.includes('btn-save-reflect'));
        }

        // ========== 5. 答题即时重想（B5 前半）==========
        {
            const { window, document, store } = boot();
            const MK = 'meta_learning';
            store.completeSkillStep(MK, 1, 'know');
            const container = document.getElementById('page-unit-learning');
            window.UnitLearningPage.render(container, { skill: MK, unit: 1 });

            const quiz = window.CiKeSkillsContent[`${MK}:1`].quiz;
            const q0 = quiz[0];
            const correctIdx = q0.type === 'truefalse' ? (q0.answer ? 0 : 1) : q0.answer;
            const wrongIdx = (correctIdx + 1) % (q0.type === 'truefalse' ? 2 : q0.options.length);

            // 选错 → 确认 → 应出现「现在再想一遍」
            container.querySelector(`.quiz-opt[data-idx="${wrongIdx}"]`).click();
            await sleep(10);
            container.querySelector('#btn-quiz-check').click();
            await sleep(10);
            const rethink = container.querySelector('#btn-quiz-rethink');
            A.ok('答错后出现「现在再想一遍」', !!rethink);
            rethink.click();
            await sleep(10);
            A.ok('重想后选项恢复可点', [...container.querySelectorAll('.quiz-opt')].every(b => !b.disabled));
            A.ok('重想后确认按钮回到待作答态', !!container.querySelector('#btn-quiz-check'));

            // 答对则不出现重想按钮
            container.querySelector(`.quiz-opt[data-idx="${correctIdx}"]`).click();
            await sleep(10);
            container.querySelector('#btn-quiz-check').click();
            await sleep(10);
            A.ok('答对时不出现「再想一遍」', !container.querySelector('#btn-quiz-rethink'));
        }

        // ========== 6. 复习站即时练习（B5 后半）==========
        {
            const { window, document, store } = boot();
            const MK = 'meta_learning';
            // 造 3 个未到期队列项（delayDays=1 → 明天才到期）
            store.enqueueReview(MK, 1, 'quiz', 0, 1);
            store.enqueueReview(MK, 1, 'quiz', 1, 1);
            store.enqueueReview(MK, 2, 'quiz', 0, 1);
            A.eq('到期项为 0', store.getDueReviewItems().length, 0);
            A.eq('队列有 3 项', store.getReviewItems().length, 3);

            const RP = window.ReviewPage;
            RP.queue = null; RP.instantMode = false;
            const container = document.getElementById('page-review');
            RP.render(container);
            const instBtn = container.querySelector('#btn-review-instant');
            A.ok('到期 0 且队列非空 → 显示即时练习入口', !!instBtn);

            instBtn.click();
            await sleep(10);
            A.ok('即时练习开始（渲染作答区）', !!container.querySelector('.review-opt, #btn-review-reveal'));
            A.ok('标注「即时练习」且不影响节奏', container.innerHTML.includes('即时练习'));

            // 答一项（回忆卡或选择题，统一走"想起来/答对"路径）
            const itemBefore = store.getReviewItems().find(i => i.id === RP.current.id);
            const dailyBefore = store.getDailyStats().review;
            const okBtn = container.querySelector('#btn-review-ok');
            if (okBtn) {
                container.querySelector('#btn-review-reveal').click(); await sleep(10);
                container.querySelector('#btn-review-ok').click(); await sleep(10);
            } else {
                const resolved = RP.resolve(RP.current);
                container.querySelector(`.review-opt[data-idx="${resolved.correctIndex}"]`).click(); await sleep(10);
                container.querySelector('#btn-review-check').click(); await sleep(10);
                container.querySelector('#btn-review-next').click(); await sleep(10);
            }
            const itemAfter = store.getReviewItems().find(i => i.id === itemBefore.id);
            A.eq('即时练习后档位不变', itemAfter.stage, itemBefore.stage);
            A.eq('即时练习后到期时间不变', itemAfter.dueAt, itemBefore.dueAt);
            A.eq('即时练习计入每日回炉统计', store.getDailyStats().review, dailyBefore + 1);
        }

        // ========== 7. 大厅单口径（B3）与首页结构 ==========
        {
            const { window, document } = boot();
            window.SkillsPage.render(document.getElementById('page-skills'));
            const hall = document.getElementById('page-skills').innerHTML;
            A.ok('大厅不再显示「总进度 %」', !/总进度\s*\d+%/.test(hall));
            A.ok('大厅进度行标注为「修为进度」', hall.includes('修为进度'));
            A.ok('技能卡不再显示单元完成率大数字', !/font-weight: bold; color: #[0-9A-Fa-f]{6};">\d+%<\/span>/.test(hall));

            window.HomePage.render(document.getElementById('page-home'));
            const home = document.getElementById('page-home').innerHTML;
            A.ok('今日一事早于日循环出现', home.indexOf('今日一事') < home.indexOf('日循环'));
            A.ok('首页卡命名为「继续修炼」', home.includes('继续修炼'));
            A.ok('首页无 <hr class="divider">', !home.includes('divider'));
        }

        // ========== 8. focus 单入口（B6）==========
        {
            const { window, document, store } = boot();
            const container = document.getElementById('page-focus');
            // 无今日一事态：应有唯一的不限时入口
            window.FocusPage.render(container);
            let html = container.innerHTML;
            A.ok('番茄卡下不再有重复的正向计时链接', !html.includes('更习惯不限时的沉浸'));
            A.ok('无今日一事时保留唯一不限时入口', html.includes('开始不限时专注'));

            // 有今日一事态：主按钮即沉浸专注，无第二个同动作入口
            store.setTodayFocus({ task: '写周报', source: 'manual' });
            window.FocusPage.render(container);
            html = container.innerHTML;
            A.ok('有今日一事时主按钮为「开始沉浸专注」', html.includes('开始沉浸专注'));
            A.ok('有今日一事时无重复入口', !html.includes('开启正向计时') && !html.includes('更习惯不限时'));
        }

        // ========== 9. settings 版本号（B6）==========
        {
            const { window, document } = boot();
            window.SettingsPage.render(document.getElementById('page-settings'));
            A.ok('设置页版本号读取 CIKE_VERSION',
                document.getElementById('page-settings').innerHTML.includes(`v${window.CIKE_VERSION}`));
        }

        // ========== 10. 原生弹窗零调用（纯 Node 正则扫描）==========
        {
            const callPattern = /(?<![\w.])((?<!function\s)(alert|confirm|prompt))\s*\(/;
            let hits = [];
            const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
                const p = path.join(dir, e.name);
                if (e.isDirectory()) walk(p);
                else if (e.name.endsWith('.js')) {
                    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
                        const t = line.trim();
                        if (t.startsWith('//') || t.startsWith('*')) return;
                        if (/function\s+(alert|confirm|prompt)\s*\(/.test(t)) return;
                        if (callPattern.test(t)) hits.push(`${p}:${i + 1}`);
                    });
                }
            });
            walk(path.join(ROOT, 'js'));
            A.ok(`原生 alert/confirm/prompt 调用为 0${hits.length ? '：' + hits.slice(0, 3).join('；') : ''}`, hits.length === 0);
        }

        return A.summary();
    }
};
