/**
 * ☀️ 今日修炼（每日 3 个微任务）
 * 把长期目标（"我要提升沟通能力"）拆成每天 yes/no 的决断。
 * 不推送、不催促——只在你打开时呈现。
 */

window.TodayTrainingPage = {
    render: function(container) {
        const store = window.CiKeStore;
        const quests = store.getDailyQuests();
        const streak = store.getStreak();
        const freeze = store.getStreakFreeze();
        const stats = store.getReviewStats();
        const rank = store.getXpRank();

        let html = `
            <div class="today-training-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 40px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <button id="btn-tt-back" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--color-text-light); padding: 4px 8px 4px 0;">←</button>
                    <span style="font-size: 14px; color: var(--color-text-light);">返回五艺大厅</span>
                </div>

                <div style="margin-bottom: 18px;">
                    <h2 style="font-size: 22px; font-weight: bold; margin: 0 0 4px 0;">☀️ 今日修炼</h2>
                    <p style="font-size: 13px; color: var(--color-text-light); margin: 0;">三件小事，做完就算今天没白过。</p>
                </div>

                <!-- 连胜与修为 -->
                <div class="card" style="padding: 16px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 26px; font-weight: bold; color: var(--color-accent); line-height: 1.2;">
                                🔥 ${streak.days}
                            </div>
                            <div style="font-size: 12px; color: var(--color-text-light); margin-top: 2px;">
                                连续修炼天数${streak.todayActive ? ' · 今天已打卡' : (streak.days > 0 ? ' · 今天还没开始' : '')}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 15px; font-weight: bold; color: var(--color-text);">${rank.name}</div>
                            <div style="font-size: 12px; color: var(--color-text-light); margin-top: 2px;">修为 ${rank.xp}</div>
                        </div>
                    </div>
                    <div style="height: 5px; background: #E8E2DB; border-radius: 99px; overflow: hidden; margin-top: 12px;">
                        <div style="height: 100%; width: ${Math.round(rank.ratio * 100)}%; background: var(--color-accent); border-radius: 99px;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <span style="font-size: 12px; color: var(--color-text-light);">🛡️ 补签卡 ${freeze} 张</span>
                        <button id="btn-use-freeze" ${freeze <= 0 ? 'disabled' : ''} style="background: none; border: 1px solid var(--color-border); color: ${freeze <= 0 ? '#BBB' : 'var(--color-accent)'}; padding: 5px 12px; font-size: 12px; border-radius: 8px; cursor: ${freeze <= 0 ? 'default' : 'pointer'};">
                            补签一天
                        </button>
                    </div>
                    <div style="font-size: 11px; color: var(--color-text-light); margin-top: 6px; line-height: 1.5;">
                        补签卡每周自动补 1 张、最多存 3 张，只为让你不必因为一天没做到就放弃。
                    </div>
                </div>

                <!-- 今日三件事 -->
                <div class="card" style="padding: 16px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
                        <span style="font-size: 15px; font-weight: bold;">今日三件小事</span>
                        <span style="font-size: 12px; color: ${quests.allDone ? '#5B8C6F' : 'var(--color-text-light)'};">${quests.doneCount} / ${quests.total}</span>
                    </div>
                    ${quests.items.map(q => `
                        <div style="display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                            <span style="font-size: 16px; flex: none;">${q.done ? '✅' : '⬜'}</span>
                            <div style="flex: 1;">
                                <div style="font-size: 13.5px; color: ${q.done ? 'var(--color-text-light)' : 'var(--color-text)'}; text-decoration: ${q.done ? 'line-through' : 'none'};">${q.label}</div>
                                <div style="height: 4px; background: #EFEAE4; border-radius: 99px; overflow: hidden; margin-top: 6px;">
                                    <div style="height: 100%; width: ${Math.round((q.progress / q.target) * 100)}%; background: ${q.done ? '#5B8C6F' : 'var(--color-accent)'}; border-radius: 99px;"></div>
                                </div>
                            </div>
                            <span style="font-size: 11px; color: var(--color-text-light); flex: none;">${q.progress}/${q.target}</span>
                        </div>
                    `).join('')}
                    ${quests.allDone ? `
                        <div style="margin-top: 14px; background: #E8F5EE; border: 1px solid #B8E2CB; border-radius: 10px; padding: 12px; text-align: center;">
                            <div style="font-size: 18px;">🌿</div>
                            <div style="font-size: 13px; color: #286644; line-height: 1.6; margin-top: 4px;">
                                今天的三件事都做完了。<br>不用再多做，去生活吧。
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- 快捷入口 -->
                <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                    <button id="btn-tt-review" class="btn btn-secondary" style="flex: 1; padding: 12px; font-size: 13px;">
                        🔁 回炉${stats.due > 0 ? ` (${stats.due})` : ''}
                    </button>
                    <button id="btn-tt-skills" class="btn btn-secondary" style="flex: 1; padding: 12px; font-size: 13px;">
                        🏛️ 去修炼
                    </button>
                </div>
                <button id="btn-tt-archive" class="btn btn-secondary" style="width: 100%; padding: 12px; font-size: 13px;">
                    📜 查看修炼档案
                </button>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container);
    },

    bindEvents: function(container) {
        const store = window.CiKeStore;
        const nav = r => window.CiKeRouter.navigate(r);
        const on = (sel, fn) => { const el = container.querySelector(sel); if (el) el.addEventListener('click', fn); };

        on('#btn-tt-back', () => nav('skills'));
        on('#btn-tt-skills', () => nav('skills'));
        on('#btn-tt-archive', () => nav('archive'));
        on('#btn-tt-review', () => nav('review'));

        on('#btn-use-freeze', () => {
            const patched = store.useStreakFreeze();
            if (patched) {
                window.CiKeUI.toast(`已用补签卡点亮 ${patched}，连续的记录接上了`, 'success', 3000);
            } else {
                window.CiKeUI.toast('现在没有需要补签的日子，继续就好', 'info');
            }
            this.render(container);
        });
    }
};
