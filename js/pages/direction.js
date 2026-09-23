// 🧭 路 · 方向 模块
window.DirectionPage = {
    render: function(container) {
        const goals = window.CiKeStore.getGoals();
        
        let html = `
            <div class="direction-page-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 50px;">
                <div class="page-header" style="margin-bottom: 16px;">
                    <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">🧭 路 · 方向</h2>
                    <p class="subtitle" style="color: var(--color-text-light); font-size: 14px; margin: 0;">你最重要的方向（最多3个，少即是多）</p>
                </div>
                <div class="goals-list" style="display: flex; flex-direction: column; gap: 14px;">
        `;

        if (goals.length === 0) {
            html += `
                <div class="empty-state card" style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 36px; margin-bottom: 10px;">🧭</div>
                    <p style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">还没有设定方向</p>
                    <p style="font-size: 13px; color: var(--color-text-light);">人生如同航海，先找到你的北极星。</p>
                </div>
            `;
        } else {
            goals.forEach(goal => {
                const entriesCount = goal.entries ? goal.entries.length : 0;
                const createdDate = new Date(goal.createdAt).toLocaleDateString('zh-CN');
                
                html += `
                    <div class="goal-card card" data-id="${goal.id}" style="cursor: pointer; border-left: 4px solid var(--color-accent); padding: 16px; margin-bottom: 0; transition: transform 0.2s;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                            <h3 class="goal-title" style="margin: 0; font-size: 18px; font-weight: bold;">${goal.title}</h3>
                            <span style="font-size: 12px; color: var(--color-accent); font-weight: 600;">方向日记 (${entriesCount}) →</span>
                        </div>
                        <p class="goal-why" style="font-size: 13px; color: var(--color-text-light); margin: 6px 0 10px 0; line-height: 1.5; font-style: italic;">“${goal.why}”</p>
                        <div class="goal-meta" style="display: flex; justify-content: space-between; font-size: 12px; color: #999;">
                            <span>已记录 ${entriesCount} 篇足迹</span>
                            <span>创建于 ${createdDate}</span>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;

        if (goals.length < 3) {
            html += `
                <div class="action-bar" style="margin-top: 20px;">
                    <button id="btn-add-goal" class="btn btn-primary">+ 设定新方向 (${goals.length}/3)</button>
                </div>
            `;
        } else {
            html += `
                <div class="max-goals-msg card" style="text-align: center; padding: 14px; margin-top: 20px; background: #F8F4EF; border: 1px dashed var(--color-border);">
                    <p style="margin: 0; font-size: 13px; color: var(--color-text-light);">三个方向，足够了。专注于此，勿生贪念。</p>
                </div>
            `;
        }

        html += `</div>`;

        container.innerHTML = html;
        this.bindEvents(container);
    },

    bindEvents: function(container) {
        const btnAddGoal = container.querySelector('#btn-add-goal');
        if (btnAddGoal) {
            btnAddGoal.addEventListener('click', () => {
                window.CiKeRouter.navigate('new-goal');
            });
        }

        const goalCards = container.querySelectorAll('.goal-card');
        goalCards.forEach(card => {
            card.addEventListener('click', () => {
                const goalId = card.getAttribute('data-id');
                window.CiKeRouter.navigate(`goal-detail?id=${goalId}`);
            });
        });
    }
};
