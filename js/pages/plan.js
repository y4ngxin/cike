/**
 * 📐 图 · 计划模块 (Plan & Eisenhower Quadrants)
 * 艾森豪威尔四象限行动看板 + 今日一事贯通
 */

window.PlanPage = {
    render: function(container) {
        const store = window.CiKeStore;
        const tasks = store.getPlanTasks();
        const todayFocus = store.getTodayFocus();

        const q1 = tasks.filter(t => t.quadrant === 1);
        const q2 = tasks.filter(t => t.quadrant === 2);
        const q3 = tasks.filter(t => t.quadrant === 3);
        const q4 = tasks.filter(t => t.quadrant === 4);

        let html = `
            <div class="plan-page-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 70px;">
                <div class="page-header" style="margin-bottom: 16px;">
                    <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">📐 图 · 计划</h2>
                    <p class="subtitle" style="color: var(--color-text-light); font-size: 14px; margin: 0;">
                        要事优先：用系统看板把精力倾注在真正影响长远的事情上
                    </p>
                </div>

                <!-- 快捷添加任务输入栏 -->
                <div class="card" style="padding: 14px; margin-bottom: 20px;">
                    <div style="font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #4A403A;">+ 记录待办事项并归类象限</div>
                    <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                        <input type="text" id="plan-input-text" placeholder="准备推进的一件事..." style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--color-border); font-size: 14px; margin-bottom: 0;">
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <select id="plan-select-quadrant" style="flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--color-border); background: white; font-size: 13px; color: var(--color-text);">
                            <option value="2" selected>🟩 第二象限 (重要不紧急·核心)</option>
                            <option value="1">🟥 第一象限 (重要且紧急)</option>
                            <option value="3">🟨 第三象限 (紧急不重要)</option>
                            <option value="4">⬜ 第四象限 (不紧急不重要)</option>
                        </select>
                        <button id="btn-add-plan-task" class="btn btn-primary" style="padding: 8px 16px; min-height: auto; width: auto; font-size: 13px; border-radius: 8px;">添加</button>
                    </div>
                </div>

                <!-- 当前今日一事状态条 -->
                ${todayFocus ? `
                    <div class="card" style="background: #FAF3EB; border: 1px dashed var(--color-accent); padding: 12px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <span style="font-size: 12px; color: var(--color-accent); font-weight: bold;">⭐ 当前今日一事：</span>
                            <span style="font-size: 14px; font-weight: 600; color: #332B25;">${todayFocus.task}</span>
                        </div>
                        <button onclick="window.CiKeRouter.navigate('focus-timer')" class="btn" style="background: var(--color-accent); color: white; padding: 4px 10px; min-height: auto; width: auto; font-size: 12px; border-radius: 6px;">去专注</button>
                    </div>
                ` : ''}

                <!-- 四象限看板列表 -->
                <div class="quadrants-grid" style="display: flex; flex-direction: column; gap: 14px;">
                    <!-- 第二象限 (置顶高亮) -->
                    ${this.renderQuadrantCard(2, '重要不紧急 (人生核心资产)', '#5B8C6F', '#EAF5EF', q2, '如身体锻炼、底层修炼、长期战略，最易被拖延但决定一生')}

                    <!-- 第一象限 -->
                    ${this.renderQuadrantCard(1, '重要且紧急 (当务之急)', '#D9534F', '#FDEDED', q1, '临期火烧眉毛的要事，迅速做完它')}

                    <!-- 第三象限 -->
                    ${this.renderQuadrantCard(3, '紧急不重要 (谨防干扰)', '#F0AD4E', '#FDF8E8', q3, '外界的突发催促，尽量授权、简化或委婉推迟')}

                    <!-- 第四象限 -->
                    ${this.renderQuadrantCard(4, '不紧急不重要 (尽量剔除)', '#999999', '#F5F5F5', q4, '纯粹消耗注意力的无意识打发，果断砍掉')}
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container);
    },

    renderQuadrantCard: function(qNum, title, color, bg, taskList, tip) {
        let taskHtml = '';
        if (taskList.length === 0) {
            taskHtml = `<div style="font-size: 12px; color: #999; text-align: center; padding: 12px 0;">暂无此象限事项</div>`;
        } else {
            taskHtml = taskList.map(t => `
                <div class="plan-task-item" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden;">
                        <input type="checkbox" class="task-checkbox" data-id="${t.id}" ${t.completed ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
                        <span style="font-size: 14px; text-decoration: ${t.completed ? 'line-through' : 'none'}; color: ${t.completed ? '#999' : 'inherit'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.text}</span>
                    </div>
                    <div style="display: flex; gap: 6px; margin-left: 8px;">
                        ${!t.completed ? `
                            <button class="btn-set-focus-task" data-id="${t.id}" title="设为今日一事" style="background: none; border: 1px solid var(--color-border); border-radius: 4px; padding: 2px 6px; font-size: 11px; cursor: pointer; color: var(--color-accent);">⭐ 一事</button>
                        ` : ''}
                        <button class="btn-del-plan-task" data-id="${t.id}" title="删除" style="background: none; border: none; font-size: 12px; cursor: pointer; color: #AAA;">✕</button>
                    </div>
                </div>
            `).join('');
        }

        return `
            <div class="card" style="margin-bottom: 0; border-left: 4px solid ${color}; border-radius: 12px; padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                    <span style="font-size: 15px; font-weight: bold; color: ${color};">第 ${qNum} 象限 · ${title}</span>
                    <span style="font-size: 11px; color: #888;">${taskList.filter(t => t.completed).length}/${taskList.length}</span>
                </div>
                <div style="font-size: 11px; color: #888; margin-bottom: 8px;">${tip}</div>
                <div class="plan-tasks-sublist">
                    ${taskHtml}
                </div>
            </div>
        `;
    },

    bindEvents: function(container) {
        const store = window.CiKeStore;

        // 添加任务
        const btnAdd = container.querySelector('#btn-add-plan-task');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                const input = container.querySelector('#plan-input-text');
                const select = container.querySelector('#plan-select-quadrant');
                const text = input ? input.value.trim() : '';
                if (!text) return;

                store.addPlanTask({
                    text: text,
                    quadrant: select.value
                });

                input.value = '';
                this.render(container);
            });
        }

        // 切换完成勾选
        container.querySelectorAll('.task-checkbox').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                store.togglePlanTask(id);
                this.render(container);
            });
        });

        // 设为今日一事
        container.querySelectorAll('.btn-set-focus-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                store.setPlanTaskAsTodayFocus(id);
                alert('已将该任务设为「⭐ 今日一事」！');
                this.render(container);
            });
        });

        // 删除任务
        container.querySelectorAll('.btn-del-plan-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                store.deletePlanTask(id);
                this.render(container);
            });
        });
    }
};
