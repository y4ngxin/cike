// 🔥 炬 · 专注 模块 (Focus Page)
window.FocusPage = {
    render: function(container) {
        const store = window.CiKeStore;
        const todayFocus = store.getTodayFocus();
        const sessions = store.getFocusSessions();
        const stats7Days = store.getLast7DaysFocusStats();
        
        const todayStr = new Date().toDateString();
        const todaySessions = sessions.filter(s => new Date(s.completedAt).toDateString() === todayStr);
        const totalMinutesToday = Math.round(todaySessions.reduce((total, s) => total + s.duration, 0) / 60);

        // 找7天中的最高分钟数作为柱状图参考基准
        const maxMinutes = Math.max(...stats7Days.map(d => d.minutes), 60);

        let html = `
            <div class="focus-page-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 50px;">
                <div class="page-header" style="margin-bottom: 16px;">
                    <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">🔥 炬 · 专注</h2>
                    <p class="subtitle" style="color: var(--color-text-light); font-size: 14px; margin: 0;">一次只做一件事，把心流倾注于当下</p>
                </div>
                
                <!-- 今日一事卡片 -->
                <div class="focus-today card" style="border-left: 4px solid var(--color-accent); padding: 18px; margin-bottom: 18px;">
                    <div style="font-size: 12px; color: var(--color-accent); font-weight: bold; margin-bottom: 4px;">⭐ 今日专注锚点</div>
        `;

        if (todayFocus && !todayFocus.completed) {
            html += `
                <p class="focus-task-name" style="font-size: 20px; font-weight: bold; margin: 8px 0 16px 0; color: #332B25;">${todayFocus.task}</p>
                <button id="btn-start-focus" class="btn btn-primary btn-large" style="width: 100%; padding: 14px; font-size: 16px; border-radius: 12px;">🔥 开始沉浸专注</button>
            `;
        } else if (todayFocus && todayFocus.completed) {
            html += `
                <p style="color: #5B8C6F; font-size: 16px; font-weight: bold; margin: 8px 0;">🎉 今日目标已达成：${todayFocus.task}</p>
                <button id="btn-start-free-focus" class="btn btn-secondary" style="width: 100%; padding: 10px; margin-top: 8px; border-radius: 8px; font-size: 13px;">开启自由专注时段</button>
            `;
        } else {
            html += `
                <p class="empty-state" style="padding: 10px 0; margin: 0; font-size: 14px; color: #888;">还没有设定今天的重点</p>
                <button id="btn-set-focus" class="btn btn-secondary" style="margin-top: 10px; width: 100%; border-radius: 8px; font-size: 13px;">设定专注任务</button>
            `;
        }

        // 7天专注趋势柱状图
        html += `
            </div>
            
            <div class="card" style="padding: 16px; margin-bottom: 18px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
                    <span style="font-size: 15px; font-weight: bold;">📊 近 7 日专注节奏</span>
                    <span style="font-size: 12px; color: var(--color-accent); font-weight: 600;">今日累计：${totalMinutesToday} 分钟</span>
                </div>

                <div class="bar-chart" style="display: flex; align-items: flex-end; justify-content: space-between; height: 110px; padding: 10px 0 0 0;">
        `;

        stats7Days.forEach(day => {
            const heightPercent = Math.max(Math.round((day.minutes / maxMinutes) * 80), 4);
            const isToday = day.label === '今天';
            html += `
                <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                    <span style="font-size: 10px; color: ${day.minutes > 0 ? 'var(--color-accent)' : '#CCC'}; margin-bottom: 4px;">${day.minutes > 0 ? day.minutes + 'm' : ''}</span>
                    <div style="width: 18px; height: ${heightPercent}px; background: ${isToday ? 'var(--color-accent)' : '#D0C8BF'}; border-radius: 4px 4px 0 0; transition: height 0.4s ease;"></div>
                    <span style="font-size: 11px; color: ${isToday ? 'var(--color-accent)' : '#888'}; margin-top: 6px; font-weight: ${isToday ? 'bold' : 'normal'};">${day.label}</span>
                </div>
            `;
        });

        html += `
                </div>
            </div>

            <!-- 最近专注会话记录 -->
            <div class="recent-sessions">
                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">⏳ 专注历程 (${sessions.length})</h3>
                <div class="sessions-list" style="display: flex; flex-direction: column; gap: 10px;">
        `;

        if (sessions.length === 0) {
            html += `<p class="empty-state" style="padding: 20px; text-align: center; color: #999; background: white; border-radius: 12px;">还没有专注记录。点击上方按钮开始第一次专注吧。</p>`;
        } else {
            sessions.slice(0, 5).forEach(session => {
                const dateStr = new Date(session.completedAt).toLocaleString('zh-CN');
                const mins = Math.round(session.duration / 60);
                html += `
                    <div class="session-card card" style="margin-bottom: 0; padding: 14px; border-radius: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <h4 style="margin: 0; font-size: 15px; font-weight: bold; color: #332B25;">${session.task}</h4>
                            <span style="font-size: 13px; font-weight: bold; color: #5B8C6F;">${mins} 分钟 ${session.mood || ''}</span>
                        </div>
                        <div style="font-size: 11px; color: #999; margin-bottom: ${session.reflection ? '6px' : '0'};">${dateStr}</div>
                        ${session.reflection ? `<p style="font-size: 13px; color: #555; margin: 4px 0 0 0; line-height: 1.5; font-style: italic; background: #FAF6F1; padding: 6px 10px; border-radius: 6px;">“${session.reflection}”</p>` : ''}
                    </div>
                `;
            });
        }

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container);
    },

    bindEvents: function(container) {
        const btnStart = container.querySelector('#btn-start-focus');
        if (btnStart) {
            btnStart.addEventListener('click', () => window.CiKeRouter.navigate('focus-timer'));
        }

        const btnFree = container.querySelector('#btn-start-free-focus');
        if (btnFree) {
            btnFree.addEventListener('click', () => window.CiKeRouter.navigate('focus-timer'));
        }

        const btnSet = container.querySelector('#btn-set-focus');
        if (btnSet) {
            btnSet.addEventListener('click', () => {
                const task = prompt('今天要专注完成的一件事是什么？');
                if (task && task.trim()) {
                    window.CiKeStore.setTodayFocus({ task: task.trim() });
                    this.render(container);
                }
            });
        }
    }
};
