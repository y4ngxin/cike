// 🔥 炬 · 专注 模块 (Focus Page)
window.FocusPage = {
    selectedPomoMinutes: 25, // 番茄钟时长选择（默认经典 25 分钟）

    render: function(container) {
        const store = window.CiKeStore;
        const todayFocus = store.getTodayFocus();
        const sessions = store.getFocusSessions();
        const stats7Days = store.getLast7DaysFocusStats();
        const pomo = store.getPomodoroStats();
        const pomoCfg = store.getPomodoroSettings();
        
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

        // 🍅 番茄时钟卡片
        let roundDots = '';
        for (let i = 0; i < pomoCfg.roundsBeforeLongBreak; i++) {
            roundDots += `<span style="width: 9px; height: 9px; border-radius: 50%; display: inline-block; background: ${i < pomo.roundInCycle ? '#D9584A' : 'var(--color-border)'};"></span>`;
        }
        const pomoDurations = [
            { min: 25, label: '25 分' },
            { min: 45, label: '45 分' },
            { min: 0, label: '自定义' }
        ];
        const pomoChips = pomoDurations.map(d => {
            const isActive = d.min === this.selectedPomoMinutes;
            return `<button class="pomo-dur-chip" data-min="${d.min}" style="flex: 1; padding: 8px 4px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid ${isActive ? '#D9584A' : 'var(--color-border)'}; background: ${isActive ? 'rgba(217,88,74,0.1)' : 'transparent'}; color: ${isActive ? '#D9584A' : 'var(--color-text-light)'};">${d.label}</button>`;
        }).join('');

        html += `
            </div>

            <!-- 🍅 番茄时钟 -->
            <div class="card pomodoro-card" style="padding: 18px; margin-bottom: 18px; border-left: 4px solid #D9584A;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                    <span style="font-size: 15px; font-weight: bold;">🍅 番茄时钟</span>
                    <button id="btn-pomo-config" style="background: none; border: none; color: var(--color-text-light); font-size: 12px; cursor: pointer; padding: 2px;">⚙️ 参数</button>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div>
                        <span style="font-size: 28px; font-weight: bold; color: #D9584A;">${pomo.todayCount}</span>
                        <span style="font-size: 13px; color: var(--color-text-light);"> 个番茄 · 累计 ${pomo.todayMinutes} 分钟</span>
                    </div>
                    <div style="display: flex; gap: 5px; align-items: center; flex: none;">${roundDots}</div>
                </div>

                <div style="font-size: 12px; color: var(--color-text-light); line-height: 1.6; background: rgba(217,88,74,0.07); padding: 8px 10px; border-radius: 8px; margin-bottom: 12px;">
                    ${pomoCfg.workMinutes} 分钟专注 + ${pomoCfg.shortBreak} 分钟短休，每 ${pomoCfg.roundsBeforeLongBreak} 轮长休 ${pomoCfg.longBreak} 分钟。<br>
                    每完成一个番茄自动记入专注历程，结束时可写复盘同步到「🪞 镜」。
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 12px;">${pomoChips}</div>

                <button id="btn-start-pomodoro" class="btn" style="width: 100%; background: #D9584A; color: white; border: none; padding: 13px; border-radius: 12px; font-size: 15px; font-weight: 600;">🍅 开始番茄钟</button>
                <div style="font-size: 11px; color: var(--color-text-light); margin-top: 8px; text-align: center;">
                    更习惯不限时的沉浸？<a href="#focus-timer" style="color: var(--color-accent); text-decoration: none;">开启正向计时 →</a>
                </div>
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
            btnSet.addEventListener('click', async () => {
                const task = await window.CiKeUI.prompt({
                    title: '⭐ 今日一事',
                    message: '一次只做一件事。今天最想做成的是哪一件？',
                    placeholder: '例如：完成 Figma 第 6 课',
                    confirmText: '就做它',
                    required: true,
                    errorText: '写下一件事，今天才有着力点'
                });
                if (task) {
                    window.CiKeStore.setTodayFocus({ task });
                    window.CiKeUI.toast('今日一事已定下', 'success');
                    this.render(container);
                }
            });
        }

        // 🍅 番茄钟时长选择
        container.querySelectorAll('.pomo-dur-chip').forEach(chip => {
            chip.addEventListener('click', async () => {
                const min = parseInt(chip.getAttribute('data-min'), 10);
                if (min === 0) {
                    const input = await window.CiKeUI.prompt({
                        title: '自定义专注时长',
                        message: '输入 1 - 180 之间的整数（分钟）',
                        defaultValue: this.selectedPomoMinutes,
                        confirmText: '确定'
                    });
                    if (input === null) return;
                    const val = parseInt(input, 10);
                    if (!val || val < 1 || val > 180) {
                        window.CiKeUI.toast('请输入 1 - 180 之间的整数', 'warn');
                        return;
                    }
                    this.selectedPomoMinutes = val;
                } else {
                    this.selectedPomoMinutes = min;
                }
                this.render(container);
            });
        });

        // 🍅 开始番茄钟
        const btnPomo = container.querySelector('#btn-start-pomodoro');
        if (btnPomo) {
            btnPomo.addEventListener('click', () => {
                window.CiKeRouter.navigate(`focus-timer?mode=pomodoro&duration=${this.selectedPomoMinutes}`);
            });
        }

        // ⚙️ 番茄钟参数
        const btnConfig = container.querySelector('#btn-pomo-config');
        if (btnConfig) {
            btnConfig.addEventListener('click', async () => {
                const store = window.CiKeStore;
                const cur = store.getPomodoroSettings();

                const vals = await window.CiKeUI.form({
                    title: '⚙️ 番茄钟参数',
                    message: '调好节奏，让专注更顺。',
                    confirmText: '保存',
                    fields: [
                        { key: 'workMinutes', label: '每个番茄的专注时长（分钟）', type: 'number', value: cur.workMinutes, min: 1, max: 180, error: '请输入 1 - 180 之间的整数' },
                        { key: 'shortBreak', label: '短休息时长（分钟）', type: 'number', value: cur.shortBreak, min: 1, max: 60, error: '请输入 1 - 60 之间的整数' },
                        { key: 'longBreak', label: '长休息时长（分钟）', type: 'number', value: cur.longBreak, min: 1, max: 120, error: '请输入 1 - 120 之间的整数' },
                        { key: 'roundsBeforeLongBreak', label: '每几轮番茄后进入长休息', type: 'number', value: cur.roundsBeforeLongBreak, min: 1, max: 12, error: '请输入 1 - 12 之间的整数' }
                    ]
                });
                if (!vals) return;

                store.savePomodoroSettings(vals);
                this.selectedPomoMinutes = store.getPomodoroSettings().workMinutes;
                window.CiKeUI.toast('番茄参数已保存', 'success');
                this.render(container);
            });
        }
    }
};
