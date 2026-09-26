/**
 * 北极星目标详情与方向日记流 (Goal Detail & Direction Diary Page)
 */

window.GoalDetailPage = {
    render: function(container, params) {
        const goalId = (params && params.id) || '';
        const store = window.CiKeStore;
        const goal = store.getGoal(goalId);

        if (!goal) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <p style="color: #888;">未找到该目标或已被删除。</p>
                    <button onclick="window.CiKeRouter.navigate('direction')" class="btn btn-secondary">返回方向列表</button>
                </div>
            `;
            return;
        }

        const entries = goal.entries || [];
        const createdDate = new Date(goal.createdAt).toLocaleDateString('zh-CN');

        // 🗺️ 蓝图拆解数据
        const milestones = goal.milestones || [];
        const doneMs = milestones.filter(m => m.done).length;
        const weekly = store.getWeeklyFocus();
        const isThisWeekly = !!(weekly && weekly.goal.id === goal.id && !weekly.milestone.done);
        const goalTaskCount = store.getGoalPlanTasks(goal.id).length;

        const msListHtml = milestones.length === 0
            ? `<div style="font-size: 12px; color: var(--color-text-light); padding: 12px 0; text-align: center;">还没有拆解阶段。把大方向拆成几个能落地的小阶段吧。</div>`
            : milestones.map(m => `
                <div class="ms-item" style="display: flex; align-items: flex-start; gap: 8px; padding: 9px 0; border-bottom: 1px solid var(--color-border);">
                    <input type="checkbox" class="ms-check" data-id="${m.id}" ${m.done ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px; margin-top: 3px; flex: none;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 14px; line-height: 1.5; color: ${m.done ? 'var(--color-text-light)' : 'var(--color-text)'}; text-decoration: ${m.done ? 'line-through' : 'none'}; word-break: break-word;">${m.text}</div>
                        ${m.focusOfWeek ? `<span style="display: inline-block; font-size: 11px; color: var(--color-accent); background: rgba(212,165,116,0.16); padding: 1px 8px; border-radius: 8px; margin-top: 4px;">🎯 本周聚焦</span>` : ''}
                    </div>
                    <div style="display: flex; gap: 6px; flex: none;">
                        ${!m.done && !m.focusOfWeek ? `<button class="btn-ms-focus" data-id="${m.id}" title="设为本周聚焦" style="background: none; border: 1px solid var(--color-border); border-radius: 6px; padding: 2px 6px; font-size: 11px; cursor: pointer; color: var(--color-accent);">🎯</button>` : ''}
                        <button class="btn-ms-del" data-id="${m.id}" title="删除" style="background: none; border: none; font-size: 12px; cursor: pointer; color: var(--color-text-light); padding: 2px 4px;">✕</button>
                    </div>
                </div>
            `).join('');

        const blueprintHtml = `
            <div class="card" style="padding: 16px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                    <h3 style="font-size: 15px; font-weight: bold; margin: 0;">🗺️ 蓝图拆解</h3>
                    <span style="font-size: 12px; color: var(--color-text-light);">${doneMs}/${milestones.length} 阶段</span>
                </div>
                <p style="font-size: 12px; color: var(--color-text-light); margin: 0 0 8px 0;">大方向 → 阶段 → 本周聚焦 → 今日一事</p>

                <div class="ms-list">${msListHtml}</div>

                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <input id="ms-input" type="text" placeholder="拆出一个能落地的阶段…" style="flex: 1; margin-bottom: 0; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--color-border); font-size: 14px; box-sizing: border-box;">
                    <button id="btn-add-ms" class="btn btn-primary" style="width: auto; flex: none; padding: 0 16px; min-height: auto; border-radius: 10px; font-size: 14px;">添加</button>
                </div>

                ${isThisWeekly ? `
                    <div style="margin-top: 14px; padding: 12px; border-radius: 10px; background: rgba(212,165,116,0.12); border: 1px dashed var(--color-accent);">
                        <div style="font-size: 12px; color: var(--color-accent); font-weight: bold; margin-bottom: 4px;">🎯 本周聚焦</div>
                        <div style="font-size: 14px; color: var(--color-text); margin-bottom: 10px; line-height: 1.5;">${weekly.milestone.text}</div>
                        <button id="btn-weekly-to-today" class="btn btn-primary" style="width: 100%; padding: 10px; font-size: 14px; border-radius: 8px;">→ 设为我今天的今日一事</button>
                    </div>
                ` : ''}

                <div style="margin-top: 12px; text-align: center;">
                    <a href="#direction?seg=plan" style="font-size: 12px; color: var(--color-accent); text-decoration: none;">去「🧭 路 · 计划」把任务挂到这个方向上${goalTaskCount ? `（已关联 ${goalTaskCount} 条）` : ''} →</a>
                </div>
            </div>
        `;

        let html = `
            <div class="goal-detail-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 50px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <button id="btn-back-direction" style="background: none; border: none; font-size: 15px; cursor: pointer; color: var(--color-accent); padding: 4px 0;">← 返回方向列表</button>
                    <button id="btn-del-goal" style="background: none; border: none; font-size: 13px; color: #E74C3C; cursor: pointer;">删除方向</button>
                </div>

                <!-- 目标卡片 -->
                <div class="card" style="border-left: 4px solid var(--color-accent); margin-bottom: 20px;">
                    <div style="font-size: 12px; color: var(--color-accent); font-weight: bold; margin-bottom: 4px;">⭐ 北极星目标</div>
                    <h2 style="font-size: 22px; font-weight: bold; margin: 0 0 10px 0;">${goal.title}</h2>
                    <div style="background: #F4EFEB; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                        <span style="font-size: 12px; font-weight: bold; color: #7A7068;">为什么这件事对我重要：</span>
                        <p style="font-size: 14px; line-height: 1.5; color: #3D3530; margin: 4px 0 0 0; font-style: italic;">“${goal.why}”</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #999;">
                        <span>设立于：${createdDate}</span>
                        <span>累计方向日记：${entries.length} 篇</span>
                    </div>
                </div>

                ${blueprintHtml}

                <!-- 新建方向日记表单 -->
                <div class="card" style="padding: 16px; margin-bottom: 20px;">
                    <h3 style="font-size: 15px; font-weight: bold; margin-top: 0; margin-bottom: 8px;">✏️ 撰写方向日记</h3>
                    <p style="font-size: 12px; color: var(--color-text-light); margin-bottom: 10px;">记录今天你为这个目标做了什么？离它更近了一步吗？</p>
                    <textarea id="goal-entry-input" placeholder="今天我为了这个目标……" style="width: 100%; border: 1px solid var(--color-border); border-radius: 8px; padding: 10px; font-family: inherit; font-size: 14px; min-height: 80px; resize: none; box-sizing: border-box; margin-bottom: 10px;"></textarea>
                    <button id="btn-save-goal-entry" class="btn btn-primary" style="padding: 10px; font-size: 14px; width: 100%;">记录并同步到镜</button>
                </div>

                <!-- 方向日记时间线 -->
                <div>
                    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">📖 历练足迹 (${entries.length})</h3>
                    <div class="entries-list" style="display: flex; flex-direction: column; gap: 10px;">
        `;

        if (entries.length === 0) {
            html += `
                <div style="text-align: center; padding: 30px; color: #999; background: white; border-radius: 12px; border: 1px solid var(--color-border);">
                    <p style="margin: 0; font-size: 13px;">还没有为这个方向记录日记。</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px;">哪怕迈出一小步，也值得诚实记录下来。</p>
                </div>
            `;
        } else {
            entries.forEach(e => {
                const dateStr = new Date(e.createdAt).toLocaleString('zh-CN');
                html += `
                    <div class="card" style="margin-bottom: 0; padding: 14px; border-radius: 12px;">
                        <div style="font-size: 11px; color: #999; margin-bottom: 6px;">${dateStr}</div>
                        <div style="font-size: 14px; line-height: 1.6; color: #332B25; white-space: pre-wrap;">${e.content}</div>
                    </div>
                `;
            });
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container, goal.id);
    },

    bindEvents: function(container, goalId) {
        const store = window.CiKeStore;

        const btnBack = container.querySelector('#btn-back-direction');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                window.CiKeRouter.navigate('direction');
            });
        }

        const btnDel = container.querySelector('#btn-del-goal');
        if (btnDel) {
            btnDel.addEventListener('click', async () => {
                const ok = await window.CiKeUI.confirm({
                    title: '放弃这个方向？',
                    message: '该方向及其历练足迹将被删除，且无法撤销。',
                    confirmText: '放弃删除',
                    cancelText: '保留',
                    danger: true
                });
                if (!ok) return;
                store.deleteGoal(goalId);
                window.CiKeUI.toast('已放弃该方向', 'info');
                window.CiKeRouter.navigate('direction');
            });
        }

        const btnSave = container.querySelector('#btn-save-goal-entry');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const input = container.querySelector('#goal-entry-input');
                const content = input ? input.value.trim() : '';
                if (!content) {
                    window.CiKeUI.toast('写点什么再记录吧', 'warn');
                    return;
                }

                store.addGoalEntry(goalId, content);
                window.CiKeUI.toast('日记已记录，并同步到「🪞 镜」', 'success');
                this.render(container, { id: goalId });
            });
        }

        // ===== 🗺️ 蓝图拆解 =====
        const msInput = container.querySelector('#ms-input');
        const btnAddMs = container.querySelector('#btn-add-ms');
        if (btnAddMs && msInput) {
            const addMs = () => {
                const text = msInput.value.trim();
                if (!text) {
                    window.CiKeUI.toast('先写下一个阶段', 'warn');
                    return;
                }
                store.addGoalMilestone(goalId, text);
                window.CiKeUI.toast('阶段已加入蓝图', 'success');
                this.render(container, { id: goalId });
            };
            btnAddMs.addEventListener('click', addMs);
            msInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); addMs(); }
            });
        }

        container.querySelectorAll('.ms-check').forEach(chk => {
            chk.addEventListener('change', (e) => {
                store.toggleGoalMilestone(goalId, e.target.getAttribute('data-id'));
                this.render(container, { id: goalId });
            });
        });

        container.querySelectorAll('.btn-ms-focus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                store.setMilestoneAsWeeklyFocus(goalId, e.currentTarget.getAttribute('data-id'));
                window.CiKeUI.toast('已设为「本周聚焦」', 'success');
                this.render(container, { id: goalId });
            });
        });

        container.querySelectorAll('.btn-ms-del').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const ok = await window.CiKeUI.confirm({
                    title: '删除这个阶段？',
                    message: '删除后无法恢复。',
                    confirmText: '删除',
                    cancelText: '保留',
                    danger: true
                });
                if (!ok) return;
                store.deleteGoalMilestone(goalId, id);
                this.render(container, { id: goalId });
            });
        });

        const btnWeekly = container.querySelector('#btn-weekly-to-today');
        if (btnWeekly) {
            btnWeekly.addEventListener('click', () => {
                store.setWeeklyFocusAsTodayFocus();
                window.CiKeUI.toast('已设为今日一事，去「炬」开始专注吧', 'success');
            });
        }
    }
};
