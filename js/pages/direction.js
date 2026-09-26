// 🧭 路 · 方向与计划
//
// 为什么这两件事在一个入口里：它们是同一条链的两端 ——
//   「北极星」回答「我想去哪」（愿景层，低频，最多 3 个）
//   「计划」回答「这一周怎么走」（执行层，日常，四象限看板）
// 目标详情里已有「蓝图拆解」（大方向 → 阶段 → 本周聚焦 → 今日一事），
// 计划看板正是这条链的落点，因此合并为一个一级入口、页内分段切换。
window.DirectionPage = {
    _seg: 'direction',   // 'direction'（北极星） | 'plan'（计划）

    render: function(container, params) {
        params = params || {};
        if (params.seg === 'plan' || params.seg === 'direction') {
            this._seg = params.seg;
        }

        const isPlan = this._seg === 'plan';
        const body = isPlan ? window.PlanPage.buildBoardHtml() : this.renderGoals();

        container.innerHTML = `
            <div class="direction-page-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 60px;">
                <div class="page-header" style="margin-bottom: 14px;">
                    <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">🧭 路</h2>
                    <p class="subtitle" style="color: var(--color-text-light); font-size: 14px; margin: 0;">先想清楚去哪，再决定这一周怎么走</p>
                </div>
                ${this.renderSegments()}
                <div id="direction-body" role="tabpanel">
                    ${body}
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    /** 顶部分段控件（配色全部走 CSS 变量 + 半透明强调色，亮/暗双主题安全） */
    renderSegments: function() {
        const pill = (key, label) => {
            const on = this._seg === key;
            return `<button type="button" class="direction-seg-btn" data-seg="${key}"
                        role="tab" aria-selected="${on ? 'true' : 'false'}"
                        style="flex: 1; padding: 9px 6px; border: none; border-radius: 9px; font-size: 13px; cursor: pointer;
                               font-weight: ${on ? '600' : '400'};
                               background: ${on ? 'rgba(212,165,116,0.18)' : 'transparent'};
                               color: ${on ? 'var(--color-text)' : 'var(--color-text-light)'};">${label}</button>`;
        };
        return `
            <div role="tablist" style="display: flex; gap: 4px; background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 4px; margin-bottom: 16px;">
                ${pill('direction', '🧭 北极星')}
                ${pill('plan', '📐 计划')}
            </div>
        `;
    },

    /** 北极星视图：方向卡片列表（最多 3 个） */
    renderGoals: function() {
        const goals = window.CiKeStore.getGoals();

        let html = `<div class="goals-list" style="display: flex; flex-direction: column; gap: 14px;">`;

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
                        <div class="goal-meta" style="display: flex; justify-content: space-between; font-size: 12px; color: var(--color-text-light);">
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
                <div class="max-goals-msg card" style="text-align: center; padding: 14px; margin-top: 20px; background: var(--color-bg); border: 1px dashed var(--color-border);">
                    <p style="margin: 0; font-size: 13px; color: var(--color-text-light);">三个方向，足够了。专注于此，勿生贪念。</p>
                </div>
            `;
        }

        return html;
    },

    bindEvents: function(container) {
        // 顶部分段切换：写进 hash，使分段可分享、返回键可用
        container.querySelectorAll('.direction-seg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const seg = btn.getAttribute('data-seg');
                if (seg === this._seg) return;
                window.CiKeRouter.navigate(`direction?seg=${seg}`);
            });
        });

        // 「计划」分段：复用看板交互，重绘范围限定在「路」页内
        if (this._seg === 'plan') {
            window.PlanPage.bindBoardEvents(container, () => this.render(container));
            return;
        }

        // 「北极星」分段：新增方向 / 进入方向详情
        const btnAddGoal = container.querySelector('#btn-add-goal');
        if (btnAddGoal) {
            btnAddGoal.addEventListener('click', () => {
                window.CiKeRouter.navigate('new-goal');
            });
        }

        container.querySelectorAll('.goal-card').forEach(card => {
            card.addEventListener('click', () => {
                const goalId = card.getAttribute('data-id');
                window.CiKeRouter.navigate(`goal-detail?id=${goalId}`);
            });
        });
    }
};
