// 设定新的北极星 模块
window.NewGoalPage = {
    render: function(container) {
        const goals = window.CiKeStore.getGoals();
        
        // 限制最多3个目标
        if (goals.length >= 3) {
            container.innerHTML = `
                <div class="page-header">
                    <button class="btn-back" id="btn-back">← 返回</button>
                    <h2>设定新的北极星</h2>
                </div>
                <div class="empty-state">
                    <p>你已经有3个方向了。</p>
                    <p>请先完成或放弃其中一个，再设定新的方向。</p>
                </div>
            `;
            container.querySelector('#btn-back').addEventListener('click', () => window.CiKeRouter.navigate('direction'));
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <button class="btn-back" id="btn-back">← 返回</button>
                <h2>设定新的北极星</h2>
            </div>
            <div class="form-container">
                <div class="form-group">
                    <label>你想走向哪个方向？</label>
                    <input type="text" id="goal-title" class="input-text" placeholder="例如：掌握前端开发" />
                </div>
                <div class="form-group">
                    <label>为什么这件事对你重要？</label>
                    <textarea id="goal-why" class="textarea" placeholder="写下你的真实动机..."></textarea>
                </div>
                <div class="action-bar">
                    <button id="btn-save-goal" class="btn btn-primary">确定方向</button>
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    bindEvents: function(container) {
        container.querySelector('#btn-back').addEventListener('click', () => {
            window.CiKeRouter.navigate('direction');
        });

        container.querySelector('#btn-save-goal').addEventListener('click', () => {
            const title = container.querySelector('#goal-title').value.trim();
            const why = container.querySelector('#goal-why').value.trim();

            if (!title) {
                alert('请填写方向名称');
                return;
            }

            window.CiKeStore.addGoal({ title, why });
            window.CiKeRouter.navigate('direction');
        });
    }
};
