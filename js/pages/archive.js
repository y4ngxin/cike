/**
 * 📜 修炼档案（成长可见）
 * 修为段位 / 五艺进度与修为拆解 / 修炼印记墙 / 修炼日历热力图
 * 只呈现事实，不做评判——"看见自己"是这一页唯一的任务。
 */

window.ArchivePage = {
    render: function(container) {
        const store = window.CiKeStore;
        const skills = window.CiKeSkillsData || [];
        const rank = store.getXpRank();
        const badges = store.getBadges();
        const unlockedCount = badges.filter(b => b.unlocked).length;
        const calendar = store.getTrainingCalendar(112);
        const stats = store._collectStats();
        const xpMaxAll = store.getMaxXp();

        let html = `
            <div class="archive-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 40px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <button id="btn-arch-back" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--color-text-light); padding: 4px 8px 4px 0;">←</button>
                    <span style="font-size: 14px; color: var(--color-text-light);">返回五艺大厅</span>
                </div>

                <!-- 修为总览 -->
                <div class="card" style="padding: 20px; margin-bottom: 18px; border-top: 4px solid var(--color-accent);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div>
                            <div style="font-size: 12px; color: var(--color-text-light); margin-bottom: 2px;">当前修为段位</div>
                            <div style="font-size: 26px; font-weight: bold; color: var(--color-accent); line-height: 1.2;">${rank.name}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 22px; font-weight: bold;">${rank.xp}</div>
                            <div style="font-size: 11px; color: var(--color-text-light);">/ ${xpMaxAll.xp} 修为</div>
                        </div>
                    </div>
                    <div style="height: 7px; background: #E8E2DB; border-radius: 99px; overflow: hidden; margin: 12px 0;">
                        <div style="height: 100%; width: ${Math.round(rank.ratio * 100)}%; background: linear-gradient(90deg, var(--color-accent) 0%, #5B8C6F 100%); border-radius: 99px;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--color-text-light);">
                        <span>初识</span><span>筑基</span><span>精进</span><span>通达</span><span>圆融</span>
                    </div>
                    <div style="display: flex; gap: 16px; margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--color-border); font-size: 12px; color: var(--color-text-light);">
                        <span>📗 通关 ${stats.units} 单元</span>
                        <span>🎯 答对 ${stats.correct} 题</span>
                        <span>🔁 回炉 ${stats.reviewed} 次</span>
                    </div>
                </div>

                <!-- 五艺进度拆解 -->
                <div style="margin-bottom: 22px;">
                    <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0;">🏛️ 五艺修为拆解</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${skills.map(s => {
                            const prog = store.getSkillProgress(s.id);
                            const done = (prog.completedUnits || []).length;
                            const total = s.units.length;
                            const pct = Math.round((done / total) * 100);
                            const mastered = store.isSkillMastered(s.id);
                            const level = store.calculateLevel(done, total, mastered);
                            const xp = store.getSkillXp(s.id);
                            return `
                                <div class="card" style="padding: 13px 14px; margin-bottom: 0; border-left: 4px solid ${s.color};">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px;">
                                        <span style="font-size: 14px; font-weight: bold;">${s.icon} ${s.title}</span>
                                        <span style="font-size: 11px; color: ${s.color}; font-weight: 600;">${mastered ? '🏆 ' : ''}${level} · ${xp} 修为</span>
                                    </div>
                                    <div style="height: 5px; background: #EFEAE4; border-radius: 99px; overflow: hidden;">
                                        <div style="height: 100%; width: ${pct}%; background: ${s.color}; border-radius: 99px;"></div>
                                    </div>
                                    <div style="font-size: 11px; color: var(--color-text-light); margin-top: 5px;">已修 ${done} / ${total} 单元</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 修炼印记 -->
                <div style="margin-bottom: 22px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
                        <h3 style="font-size: 16px; font-weight: bold; margin: 0;">🏅 修炼印记</h3>
                        <span style="font-size: 12px; color: var(--color-text-light);">${unlockedCount} / ${badges.length}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        ${badges.map(b => `
                            <div class="card" style="padding: 12px 8px; margin-bottom: 0; text-align: center; opacity: ${b.unlocked ? '1' : '0.42'}; background: ${b.unlocked ? 'linear-gradient(135deg, rgba(212,165,116,0.12) 0%, rgba(139,111,111,0.08) 100%)' : 'transparent'}; border: 1px solid ${b.unlocked ? 'var(--color-accent)' : 'var(--color-border)'};">
                                <div style="font-size: 22px; filter: ${b.unlocked ? 'none' : 'grayscale(1)'};">${b.unlocked ? b.icon : '🔒'}</div>
                                <div style="font-size: 12px; font-weight: bold; margin-top: 5px; color: ${b.unlocked ? 'var(--color-text)' : 'var(--color-text-light)'};">${b.name}</div>
                                <div style="font-size: 10px; color: var(--color-text-light); margin-top: 3px; line-height: 1.4;">${b.desc}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 修炼日历 -->
                <div style="margin-bottom: 22px;">
                    <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 4px 0;">📅 修炼日历</h3>
                    <div style="font-size: 12px; color: var(--color-text-light); margin-bottom: 12px;">最近 16 周 · 有实质修炼行为的日子会被点亮</div>
                    <div class="card" style="padding: 14px; margin-bottom: 0;">
                        <div style="display: flex; gap: 3px; overflow-x: auto; padding-bottom: 4px;">
                            ${this.renderCalendarWeeks(calendar)}
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 11px; color: var(--color-text-light);">
                            <span>少</span>
                            <span style="width: 11px; height: 11px; background: #EFEAE4; border-radius: 3px; display: inline-block;"></span>
                            <span style="width: 11px; height: 11px; background: #D9C3A5; border-radius: 3px; display: inline-block;"></span>
                            <span style="width: 11px; height: 11px; background: var(--color-accent); border-radius: 3px; display: inline-block;"></span>
                            <span>多</span>
                            <span style="margin-left: auto;">已点亮 ${stats.streak} 天连胜</span>
                        </div>
                    </div>
                </div>

                <button id="btn-arch-review" class="btn btn-secondary" style="width: 100%; padding: 12px; font-size: 13px;">
                    🔁 去复习站回炉
                </button>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container);
    },

    renderCalendarWeeks: function(calendar) {
        // 112 天 = 16 周，按列（周）排布，每列 7 天
        let out = '';
        for (let w = 0; w < 16; w++) {
            let col = '<div style="display: flex; flex-direction: column; gap: 3px; flex: none;">';
            for (let d = 0; d < 7; d++) {
                const item = calendar[w * 7 + d];
                if (!item) { col += '<div style="width: 11px; height: 11px;"></div>'; continue; }
                const bg = item.active ? 'var(--color-accent)' : '#EFEAE4';
                const title = item.date.toLocaleDateString('zh-CN') + (item.active ? ' · 有修炼' : '');
                col += `<div title="${title}" style="width: 11px; height: 11px; background: ${bg}; border-radius: 3px;"></div>`;
            }
            col += '</div>';
            out += col;
        }
        return out;
    },

    bindEvents: function(container) {
        const on = (sel, fn) => { const el = container.querySelector(sel); if (el) el.addEventListener('click', fn); };
        on('#btn-arch-back', () => window.CiKeRouter.navigate('skills'));
        on('#btn-arch-review', () => window.CiKeRouter.navigate('review'));
    }
};
