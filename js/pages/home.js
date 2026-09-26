/**
 * 🏠 首页 · 「今日」仪表盘
 *
 * 首页回答三个问题（3 秒内）：
 *   1. 今天该做什么？   → ⭐ 今日一事（绝对主角，可直接内联设定）
 *   2. 走到哪一步了？   → 🔄 日循环三环进度（晨间三问 → 一次专注 → 晚间回顾）
 *   3. 坚持多久了？     → 🌱 连续天数（温柔展示，不施压）
 *
 * 产品核心是一条日循环，首页就是这条循环的入口与仪表盘。
 */
window.HomePage = {
    // 日循环三环的图标
    LOOP_ICONS: { morning: '☀️', focus: '🔥', evening: '🌙' },
    // 今日一事来源标注
    SOURCE_LABELS: {
        morning: '☀️ 来自晨间三问',
        plan: '📐 来自计划看板',
        skills: '🏛️ 来自五艺修炼',
        goal: '🧭 来自北极星蓝图',
        manual: ''
    },

    render: function(container) {
        const store = window.CiKeStore;
        const today = new Date();
        const hour = today.getHours();

        let greeting = '你好';
        if (hour >= 5 && hour < 12) greeting = '上午好';
        else if (hour >= 12 && hour < 18) greeting = '下午好';
        else greeting = '晚上好';

        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 ${days[today.getDay()]}`;

        const todayFocus = store.getTodayFocus();
        const loop = store.getDailyLoop();
        const streak = store.getStreak();
        const records = store.getRecords();
        const recentRecords = records.slice(0, 3);
        const activeSkillData = store.getActiveSkillUnit();

        // 连续天数徽章（温柔语气）
        const streakChip = streak.days > 0
            ? `<div style="text-align: right; font-size: 12px; color: var(--color-accent); background: rgba(212,165,116,0.14); padding: 6px 10px; border-radius: 12px; white-space: nowrap; flex: none;">${streak.todayActive ? '🔥' : '🌱'} 连续第 ${streak.days} 天</div>`
            : '';

        let html = `
            <div class="page-header home-header">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 12px;">
                    <div>
                        <h2 style="font-size: 28px; margin-bottom: 8px;">${greeting}，</h2>
                        <p class="date-display" style="color: var(--color-text-light); margin: 0;">${dateStr}</p>
                    </div>
                    ${streakChip}
                </div>
            </div>

            <hr class="divider" style="border: none; border-top: 1px solid var(--color-border); margin: 24px 0;">

            <!-- 🔄 今日日循环 -->
            ${this.renderDailyLoop(loop)}

            <hr class="divider" style="border: none; border-top: 1px solid var(--color-border); margin: 24px 0;">

            <!-- ⭐ 今日一事 -->
            <div class="card focus-card" style="border-left: 4px solid var(--color-accent);">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <h3 style="margin: 0;">⭐ 今日一事</h3>
                    <span style="font-size: 11px; color: var(--color-text-light);">一次只做一件事</span>
                </div>
                ${this.renderTodayFocus(todayFocus)}
            </div>
        `;

        // 🏛️ 今日修炼卡片
        if (activeSkillData && activeSkillData.skill && activeSkillData.unit) {
            const { skill, unit, unitProg } = activeSkillData;
            let stepBadge = "📖 知·理解";
            if (unitProg.know && !unitProg.observe) stepBadge = "👁️ 观·觉察";
            else if (unitProg.observe && !unitProg.practice) stepBadge = "🤸 行·实操";
            else if (unitProg.practice && !unitProg.reflect) stepBadge = "🪞 省·反思";
            else if (unitProg.reflect) stepBadge = "✅ 已通关";

            html += `
                <div class="card skill-home-card" style="border-left: 4px solid ${skill.color};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <h3 style="margin: 0; font-size: 16px; font-weight: bold;">🏛️ 今日修炼</h3>
                        <span style="font-size: 12px; background: rgba(0,0,0,0.06); color: ${skill.color}; padding: 2px 8px; border-radius: 10px; font-weight: 600;">${stepBadge}</span>
                    </div>
                    <p style="margin: 4px 0 6px 0; font-size: 15px; font-weight: bold; color: var(--color-text);">
                        ${skill.icon} ${skill.title} · 单元 ${unit.unitNumber}：${unit.title}
                    </p>
                    <div style="font-size: 13px; color: var(--color-text-light); margin-bottom: 12px; line-height: 1.4;">
                        ${unit.know.title}
                    </div>
                    <button id="btn-home-learn" class="btn" style="background: ${skill.color}; color: white; border: none; padding: 10px; border-radius: 8px; font-size: 14px; width: 100%;">
                        继续修炼 →
                    </button>
                </div>

                <hr class="divider" style="border: none; border-top: 1px solid var(--color-border); margin: 24px 0;">
            `;
        }

        // 💭 最近记录
        html += `
            <div class="recent-records-section">
                <h3 style="margin-bottom: 16px;">💭 最近记录</h3>
                <div class="records-list">
        `;

        if (recentRecords.length === 0) {
            html += `<p class="empty-state">还没有记录。想到什么，随手记下就好。</p>`;
        } else {
            recentRecords.forEach(record => {
                const icon = record.type === 'thought' ? '💭' : (record.type === 'action' ? '⚡' : '❓');
                const contentStr = record.content.length > 28 ? record.content.substring(0, 28) + '...' : record.content;
                html += `
                    <div class="record-item-small" style="display: flex; align-items: center; margin-bottom: 12px; background: var(--color-card-bg); padding: 12px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <span class="record-icon" style="margin-right: 12px;">${icon}</span>
                        <span class="record-content-preview" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px;">${contentStr}</span>
                        <span class="record-time" style="font-size: 12px; color: var(--color-text-light); margin-left: 8px;">${this.timeAgo(record.createdAt)}</span>
                    </div>
                `;
            });
            html += `<a href="#mirror" class="link-action" style="color: var(--color-accent); text-decoration: none; display: block; text-align: center; margin-top: 16px;">查看全部 →</a>`;
        }

        html += `
                </div>
            </div>
        `;

        // 晚上 6 点后提示晚间回顾（若三环未齐）
        if (hour >= 18 && !loop.evening) {
            html += `
                <hr class="divider" style="border: none; border-top: 1px solid var(--color-border); margin: 24px 0;">
                <div class="evening-prompt">
                    <button id="btn-evening-reflection" class="btn" style="width: 100%; background: var(--color-border); border: none; padding: 16px; border-radius: 12px; color: var(--color-text); font-size: 16px;">🌙 该做今天的回顾了</button>
                </div>
            `;
        }

        container.innerHTML = html;
        this.bindEvents(container, activeSkillData);
    },

    /** 🔄 日循环三环进度条 */
    renderDailyLoop: function(loop) {
        const icons = this.LOOP_ICONS;
        const stepsHtml = loop.steps.map((s, idx) => {
            const ring = `
                <button class="loop-step" data-route="${s.route}" style="flex: 1; background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0;">
                    <span style="width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid ${s.done ? 'var(--color-success)' : 'var(--color-border)'}; background: ${s.done ? 'rgba(91,140,111,0.14)' : 'transparent'}; color: ${s.done ? 'var(--color-success)' : 'var(--color-text-light)'};">${s.done ? '✓' : icons[s.key]}</span>
                    <span style="font-size: 11px; color: ${s.done ? 'var(--color-success)' : 'var(--color-text-light)'}; font-weight: ${s.done ? '600' : '400'};">${s.label}</span>
                </button>
            `;
            const connector = idx < loop.steps.length - 1
                ? `<span style="flex: none; width: 18px; height: 2px; background: var(--color-border); margin-top: 20px;"></span>`
                : '';
            return ring + connector;
        }).join('');

        const footer = loop.allDone
            ? `<div style="margin-top: 14px; padding: 10px 12px; border-radius: 10px; background: rgba(91,140,111,0.1); font-size: 13px; color: var(--color-success); text-align: center;">今天的三环都亮了 —— 好好休息一下吧。</div>`
            : `<div style="margin-top: 14px; font-size: 12px; color: var(--color-text-light); text-align: center;">还有 ${loop.total - loop.doneCount} 环，今天就走完这一圈了</div>`;

        return `
            <div class="card" style="padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
                    <span style="font-size: 15px; font-weight: bold;">🔄 今日日循环</span>
                    <span style="font-size: 12px; color: var(--color-accent); font-weight: 600;">${loop.doneCount} / ${loop.total}</span>
                </div>
                <div style="display: flex; align-items: flex-start;">
                    ${stepsHtml}
                </div>
                ${footer}
            </div>
        `;
    },

    /** ⭐ 今日一事区块（含内联设定） */
    renderTodayFocus: function(todayFocus) {
        // 未完成
        if (todayFocus && !todayFocus.completed) {
            const sourceLabel = this.SOURCE_LABELS[todayFocus.source] || '';
            return `
                <p class="focus-task-name" style="font-size: 19px; margin: 14px 0 6px 0; color: var(--color-text);">${todayFocus.task}</p>
                ${sourceLabel ? `<div style="font-size: 11px; color: var(--color-text-light); margin-bottom: 14px;">${sourceLabel}</div>` : '<div style="margin-bottom: 14px;"></div>'}
                <button id="btn-home-focus" class="btn btn-primary" style="width: 100%;">🔲 开始专注</button>
                <button id="btn-home-focus-change" style="width: 100%; background: none; border: none; color: var(--color-text-light); font-size: 12px; margin-top: 8px; cursor: pointer;">换一件事</button>
            `;
        }

        // 已完成
        if (todayFocus && todayFocus.completed) {
            return `
                <p style="color: var(--color-success); font-size: 16px; font-weight: bold; margin: 14px 0 4px 0;">🎉 今日目标已完成</p>
                <p style="font-size: 14px; color: var(--color-text-light); margin: 0 0 14px 0;">${todayFocus.task}</p>
                <button id="btn-home-focus-change" style="width: 100%; background: none; border: 1px solid var(--color-border); color: var(--color-text); font-size: 13px; padding: 8px; border-radius: 8px; cursor: pointer;">再定一件想做的事</button>
            `;
        }

        // 尚未设定 —— 内联输入（替代原生 prompt）
        return `
            <p style="margin: 12px 0 10px 0; font-size: 13px; color: var(--color-text-light);">今天还没有定下重点。写下一件事，今天就有了着力点。</p>
            <div style="display: flex; gap: 8px;">
                <input id="home-focus-input" type="text" placeholder="今天最想做成的一件事…" style="flex: 1; margin-bottom: 0; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--color-border); font-size: 14px; box-sizing: border-box;">
                <button id="btn-home-focus-set" class="btn btn-primary" style="width: auto; flex: none; padding: 0 18px; min-height: auto; border-radius: 10px; font-size: 14px;">定下</button>
            </div>
        `;
    },

    timeAgo: function(timestamp) {
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
        if (seconds < 60) return '刚刚';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
        return `${Math.floor(seconds / 86400)}天前`;
    },

    bindEvents: function(container, activeSkillData) {
        const store = window.CiKeStore;

        // 日循环三环跳转
        container.querySelectorAll('.loop-step').forEach(btn => {
            btn.addEventListener('click', () => {
                const route = btn.getAttribute('data-route');
                if (route) window.CiKeRouter.navigate(route);
            });
        });

        // 开始专注
        const btnFocus = container.querySelector('#btn-home-focus');
        if (btnFocus) {
            btnFocus.addEventListener('click', () => window.CiKeRouter.navigate('focus-timer'));
        }

        // 今日一事 · 内联设定
        const btnSet = container.querySelector('#btn-home-focus-set');
        const inputFocus = container.querySelector('#home-focus-input');
        if (btnSet && inputFocus) {
            const submit = () => {
                const task = inputFocus.value.trim();
                if (!task) {
                    window.CiKeUI.toast('写下一件事，今天才有着力点', 'warn');
                    return;
                }
                store.setTodayFocus({ task, source: 'manual' });
                window.CiKeUI.toast('今日一事已定下', 'success');
                this.render(container);
            };
            btnSet.addEventListener('click', submit);
            inputFocus.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); submit(); }
            });
        }

        // 换一件事（重新打开内联输入）
        const btnChange = container.querySelector('#btn-home-focus-change');
        if (btnChange) {
            btnChange.addEventListener('click', () => {
                store.clearTodayFocus();
                this.render(container);
            });
        }

        // 继续修炼
        const btnLearn = container.querySelector('#btn-home-learn');
        if (btnLearn && activeSkillData) {
            btnLearn.addEventListener('click', () => {
                window.CiKeRouter.navigate(`unit-learning?skill=${activeSkillData.skill.id}&unit=${activeSkillData.unit.unitNumber}`);
            });
        }

        // 晚间回顾
        const btnEvening = container.querySelector('#btn-evening-reflection');
        if (btnEvening) {
            btnEvening.addEventListener('click', () => window.CiKeRouter.navigate('evening-reflection'));
        }
    }
};
