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
            btnDel.addEventListener('click', () => {
                if (confirm('确定要放弃并删除此方向吗？')) {
                    store.deleteGoal(goalId);
                    window.CiKeRouter.navigate('direction');
                }
            });
        }

        const btnSave = container.querySelector('#btn-save-goal-entry');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const input = container.querySelector('#goal-entry-input');
                const content = input ? input.value.trim() : '';
                if (!content) {
                    alert('请输入日记内容。');
                    return;
                }

                store.addGoalEntry(goalId, content);
                alert('日记已记录，并同步沉淀到你的「🪞 镜 · 记录」！');
                this.render(container, { id: goalId });
            });
        }
    }
};
