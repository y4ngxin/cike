/**
 * 专注计时器模块
 * 两种模式：
 *   - free     : 沉浸全屏正向计时（心流无界）+ Web Audio 白噪音 + 走神防打扰速记
 *   - pomodoro : 番茄时钟（倒计时 + 短/长休息循环，每轮自动落库）
 */

window.FocusTimerPage = {
    timerInterval: null,
    elapsedSeconds: 0,
    isPaused: false,
    currentTaskName: '',
    
    render: function(container, params) {
        // 🍅 番茄模式：走独立渲染分支，正向计时逻辑保持原样
        if (params && params.mode === 'pomodoro') {
            return this.renderPomodoro(container, params);
        }

        const store = window.CiKeStore;
        const todayFocus = store.getTodayFocus();
        const taskName = todayFocus ? todayFocus.task : "自由专注";
        this.currentTaskName = taskName;
        
        this.elapsedSeconds = 0;
        this.isPaused = false;

        // 默认白噪音设置
        const settings = store.getSettings();
        const defaultNoise = settings.whiteNoiseDefault || 'none';
        
        // 注入深色沉浸主题
        container.style.backgroundColor = '#1E293B';
        container.style.color = '#FFFFFF';
        container.style.minHeight = '100vh';
        container.style.padding = '30px 20px';
        container.style.boxSizing = 'border-box';
        
        container.innerHTML = `
            <div class="focus-timer-container" style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 85vh; max-width: 400px; margin: 0 auto;">
                
                <!-- 顶部任务与退出 -->
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
                    <button id="btn-timer-exit" style="background: none; border: none; color: #94A3B8; font-size: 14px; cursor: pointer; padding: 6px;">✕ 退出</button>
                    <span style="font-size: 12px; color: #94A3B8; letter-spacing: 1px;">DEEP FOCUS</span>
                    <button id="btn-quick-distract" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #F1F5F9; font-size: 12px; padding: 4px 10px; border-radius: 14px; cursor: pointer;">⚡ 走神便签</button>
                </div>

                <!-- 任务名称 -->
                <div style="text-align: center; margin-top: 20px;">
                    <div style="font-size: 13px; color: #94A3B8; margin-bottom: 6px;">正在投入：</div>
                    <h2 class="timer-task-name" style="font-size: 22px; font-weight: 600; margin: 0; color: #F8FAFC; max-width: 320px; line-height: 1.4;">${taskName}</h2>
                </div>
                
                <!-- 巨幅计时器数字 (正向计时，无压力) -->
                <div style="display: flex; flex-direction: column; align-items: center; margin: 30px 0;">
                    <div class="timer-display" id="timer-display" style="font-size: 72px; font-weight: 300; font-family: -apple-system, BlinkMacSystemFont, monospace; letter-spacing: 2px; color: #FFFFFF;">00:00</div>
                    <span style="font-size: 12px; color: #64748B; margin-top: -6px;">心流无界 · 正向计时</span>
                </div>

                <!-- 白噪音切换胶囊栏 -->
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; gap: 8px; background: rgba(255,255,255,0.06); padding: 4px; border-radius: 20px;">
                        <button class="noise-btn ${defaultNoise === 'none' ? 'active' : ''}" data-noise="none" style="background: ${defaultNoise === 'none' ? 'rgba(255,255,255,0.2)' : 'none'}; border: none; color: white; padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">🔇 静音</button>
                        <button class="noise-btn ${defaultNoise === 'rain' ? 'active' : ''}" data-noise="rain" style="background: ${defaultNoise === 'rain' ? 'rgba(255,255,255,0.2)' : 'none'}; border: none; color: white; padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">🌧️ 雨声</button>
                        <button class="noise-btn ${defaultNoise === 'waves' ? 'active' : ''}" data-noise="waves" style="background: ${defaultNoise === 'waves' ? 'rgba(255,255,255,0.2)' : 'none'}; border: none; color: white; padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">🌊 海浪</button>
                        <button class="noise-btn ${defaultNoise === 'white' ? 'active' : ''}" data-noise="white" style="background: ${defaultNoise === 'white' ? 'rgba(255,255,255,0.2)' : 'none'}; border: none; color: white; padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">📻 白噪</button>
                    </div>
                </div>
                
                <!-- 控制按钮 -->
                <div class="timer-controls" id="timer-controls" style="display: flex; gap: 16px; width: 100%;">
                    <button id="btn-pause-resume" class="btn" style="flex: 1; background: rgba(255,255,255,0.12); color: white; border: none; padding: 14px; border-radius: 24px; font-size: 16px; font-weight: 500;">⏸ 暂停</button>
                    <button id="btn-finish" class="btn" style="flex: 1; background: #5B8C6F; color: white; border: none; padding: 14px; border-radius: 24px; font-size: 16px; font-weight: 600;">✅ 完成专注</button>
                </div>
                
                <!-- 结算完成弹窗 -->
                <div class="timer-completion-overlay card" id="completion-overlay" style="display: none; background: #FFFFFF; color: #3D3530; width: 100%; padding: 24px; border-radius: 16px; box-sizing: border-box; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                    <h3 style="margin: 0 0 10px 0; font-size: 20px; font-weight: bold; text-align: center;">🎉 专注圆满完成</h3>
                    <div style="text-align: center; margin-bottom: 16px;">
                        <span style="font-size: 14px; color: #666;">本次投入时长：</span>
                        <strong id="final-time" style="font-size: 24px; color: #D4A574;"></strong>
                    </div>
                    
                    <div class="mood-selector" style="margin-bottom: 16px;">
                        <div style="font-size: 13px; color: #666; margin-bottom: 8px;">此刻的身心感受：</div>
                        <div class="mood-options" style="display: flex; justify-content: space-around; font-size: 24px;">
                            <span class="focus-mood-opt" data-mood="😤" style="cursor: pointer; opacity: 0.4;">😤</span>
                            <span class="focus-mood-opt" data-mood="😐" style="cursor: pointer; opacity: 0.4;">😐</span>
                            <span class="focus-mood-opt" data-mood="🙂" style="cursor: pointer; opacity: 1;">🙂</span>
                            <span class="focus-mood-opt" data-mood="😊" style="cursor: pointer; opacity: 0.4;">😊</span>
                            <span class="focus-mood-opt" data-mood="🔥" style="cursor: pointer; opacity: 0.4;">🔥</span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <textarea id="focus-reflection" style="width: 100%; border: 1px solid #E8E2DB; border-radius: 8px; padding: 10px; font-family: inherit; font-size: 14px; min-height: 75px; box-sizing: border-box; resize: none;" placeholder="写下一句收获或完成成果（将自动同步沉淀至镜）..."></textarea>
                    </div>
                    
                    <button id="btn-save-session" class="btn btn-primary" style="width: 100%; padding: 12px; border-radius: 10px; background: #2C3E6B; color: white; border: none; font-size: 15px; font-weight: bold;">保存历程并返回</button>
                </div>
            </div>
        `;
        
        this.bindEvents(container, taskName);
        this.startTimer(container.querySelector('#timer-display'));

        // 如果用户有默认白噪音，自动播放
        if (defaultNoise !== 'none' && window.CiKeAudio) {
            window.CiKeAudio.play(defaultNoise);
        }
    },
    
    formatTime: function(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },
    
    startTimer: function(displayEl) {
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.elapsedSeconds++;
                if (displayEl) {
                    displayEl.textContent = this.formatTime(this.elapsedSeconds);
                }
            }
        }, 1000);
    },
    
    cleanup: function(container) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        // 番茄钟运行态复位，避免离开页面后残留计时
        this.pomoPhaseEndsAt = null;
        this.pomoAwaitingChoice = true;
        if (window.CiKeAudio) {
            window.CiKeAudio.stop();
        }
        if (container) {
            container.style.backgroundColor = '';
            container.style.color = '';
            container.style.minHeight = '';
            container.style.padding = '';
            container.style.boxSizing = '';
        }
    },
    
    bindEvents: function(container, taskName) {
        let selectedMood = '🙂';
        
        // 退出按钮
        container.querySelector('#btn-timer-exit').addEventListener('click', () => {
            if (this.elapsedSeconds > 60) {
                if (confirm('已专注了一段时间，是否确定放弃并退出？')) {
                    this.cleanup(container);
                    window.CiKeRouter.navigate('focus');
                }
            } else {
                this.cleanup(container);
                window.CiKeRouter.navigate('focus');
            }
        });

        // 走神便签功能：不中断计时，记下杂念
        const btnDistract = container.querySelector('#btn-quick-distract');
        btnDistract.addEventListener('click', () => {
            const note = prompt('脑海里突然冒出的杂念是什么？先记下来，安心继续专注：');
            if (note && note.trim()) {
                window.CiKeStore.addDistractionNote(note.trim(), taskName);
                alert('已快速存入便签，现在心无旁骛继续投入吧。');
            }
        });

        // 切换白噪音
        container.querySelectorAll('.noise-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll('.noise-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'none';
                });
                const target = e.target;
                target.classList.add('active');
                target.style.background = 'rgba(255,255,255,0.2)';
                const noiseType = target.getAttribute('data-noise');
                if (window.CiKeAudio) {
                    window.CiKeAudio.play(noiseType);
                }
            });
        });
        
        // 暂停与继续
        const btnPauseResume = container.querySelector('#btn-pause-resume');
        btnPauseResume.addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            btnPauseResume.textContent = this.isPaused ? "▶️ 继续" : "⏸ 暂停";
            if (this.isPaused && window.CiKeAudio) {
                window.CiKeAudio.stop();
            } else if (!this.isPaused && window.CiKeAudio) {
                const activeBtn = container.querySelector('.noise-btn.active');
                const noiseType = activeBtn ? activeBtn.getAttribute('data-noise') : 'none';
                window.CiKeAudio.play(noiseType);
            }
        });
        
        // 点击完成专注
        const btnFinish = container.querySelector('#btn-finish');
        btnFinish.addEventListener('click', () => {
            this.isPaused = true;
            if (window.CiKeAudio) {
                window.CiKeAudio.stop();
            }

            container.querySelector('#timer-controls').style.display = 'none';
            container.querySelector('#timer-display').style.display = 'none';
            container.querySelector('.timer-task-name').style.display = 'none';
            container.querySelector('.noise-btn').parentElement.parentElement.style.display = 'none';
            
            const overlay = container.querySelector('#completion-overlay');
            overlay.style.display = 'block';
            container.querySelector('#final-time').textContent = this.formatTime(this.elapsedSeconds);
        });
        
        // 心情选项
        const moodOptions = container.querySelectorAll('.focus-mood-opt');
        moodOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                moodOptions.forEach(o => o.style.opacity = '0.4');
                e.target.style.opacity = '1';
                selectedMood = e.target.getAttribute('data-mood');
            });
        });
        
        // 保存专注记录
        const btnSave = container.querySelector('#btn-save-session');
        btnSave.addEventListener('click', () => {
            const reflection = container.querySelector('#focus-reflection').value.trim();
            
            window.CiKeStore.addFocusSession({
                task: taskName,
                duration: this.elapsedSeconds,
                mood: selectedMood,
                reflection: reflection
            });

            // 标记今日一事为已完成
            const todayFocus = window.CiKeStore.getTodayFocus();
            if (todayFocus && todayFocus.task === taskName) {
                window.CiKeStore.completeTodayFocus();
            }
            
            this.cleanup(container);
            window.CiKeRouter.navigate('focus');
        });
    },

    // ==========================================================
    // 🍅 番茄时钟模式 (Pomodoro)
    // 倒计时 + 短休/长休循环；每完成一个番茄自动落库，结束时可选复盘
    // ==========================================================

    renderPomodoro: function(container, params) {
        const store = window.CiKeStore;
        const cfg = store.getPomodoroSettings();
        const todayFocus = store.getTodayFocus();

        this.pomoTask = todayFocus ? todayFocus.task : '自由专注';
        this.pomoWork = Math.max(1, parseInt(params.duration, 10) || cfg.workMinutes);
        this.pomoShort = cfg.shortBreak;
        this.pomoLong = cfg.longBreak;
        this.pomoRounds = cfg.roundsBeforeLongBreak;

        // 运行态初始化
        this.isPaused = false;
        this.pomoRunRounds = 0;
        this.pomoRoundInCycle = 0;
        this.pomoFocusSecondsTotal = 0;
        this.pomoLastSessionId = null;
        this.pomoAwaitingChoice = false;
        this.pomoPhase = 'focus';
        this.pomoPhaseTotal = 0;
        this.pomoRemaining = 0;
        this.pomoPhaseEndsAt = null;

        const settings = store.getSettings();
        const defaultNoise = settings.whiteNoiseDefault || 'none';
        this.pomoNoise = defaultNoise;

        // 注入深色沉浸主题
        container.style.backgroundColor = '#1E293B';
        container.style.color = '#FFFFFF';
        container.style.minHeight = '100vh';
        container.style.padding = '30px 20px';
        container.style.boxSizing = 'border-box';

        container.innerHTML = `
            <div class="focus-timer-container" style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 85vh; max-width: 400px; margin: 0 auto;">

                <!-- 顶部操作栏 -->
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
                    <button id="btn-pomo-exit" style="background: none; border: none; color: #94A3B8; font-size: 14px; cursor: pointer; padding: 6px;">✕ 退出</button>
                    <span style="font-size: 12px; color: #D9584A; letter-spacing: 1px;">🍅 POMODORO</span>
                    <button id="btn-pomo-distract" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #F1F5F9; font-size: 12px; padding: 4px 10px; border-radius: 14px; cursor: pointer;">⚡ 走神便签</button>
                </div>

                <!-- 任务名称 -->
                <div style="text-align: center; margin-top: 16px;">
                    <div style="font-size: 13px; color: #94A3B8; margin-bottom: 6px;">正在投入：</div>
                    <h2 style="font-size: 20px; font-weight: 600; margin: 0; color: #F8FAFC; max-width: 320px; line-height: 1.4;">${this.pomoTask}</h2>
                </div>

                <!-- 倒计时主体 -->
                <div style="display: flex; flex-direction: column; align-items: center; margin: 24px 0 10px; width: 100%;">
                    <div id="pomo-phase-label" style="font-size: 13px; font-weight: 600; margin-bottom: 10px; color: #D9584A;">🍅 专注中</div>
                    <div id="pomo-display" style="font-size: 72px; font-weight: 300; font-family: -apple-system, BlinkMacSystemFont, monospace; letter-spacing: 2px; color: #FFFFFF;">--:--</div>
                    <div style="width: 240px; max-width: 80%; height: 6px; background: rgba(255,255,255,0.12); border-radius: 99px; overflow: hidden; margin-top: 16px;">
                        <div id="pomo-progress" style="width: 0%; height: 100%; background: #D9584A; border-radius: 99px; transition: width 0.3s linear;"></div>
                    </div>
                    <div id="pomo-dots" style="display: flex; gap: 6px; margin-top: 14px;"></div>
                    <div id="pomo-run-stats" style="font-size: 12px; color: #64748B; margin-top: 10px; text-align: center;"></div>
                </div>

                <!-- 白噪音 -->
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 8px; background: rgba(255,255,255,0.06); padding: 4px; border-radius: 20px;">
                        <button class="noise-btn ${defaultNoise === 'none' ? 'active' : ''}" data-noise="none" style="background: ${defaultNoise === 'none' ? 'rgba(255,255,255,0.2)' : 'none'}; border: none; color: white; padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">🔇 静音</button>
                        <button class="noise-btn ${defaultNoise === 'rain' ? 'active' : ''}" data-noise="rain" style="background: ${defaultNoise === 'rain' ? 'rgba(255,255,255,0.2)' : 'none'}; border: none; color: white; padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">🌧️ 雨声</button>
                        <button class="noise-btn ${defaultNoise === 'waves' ? 'active' : ''}" data-noise="waves" style="background: ${defaultNoise === 'waves' ? 'rgba(255,255,255,0.2)' : 'none'}; border: none; color: white; padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">🌊 海浪</button>
                        <button class="noise-btn ${defaultNoise === 'white' ? 'active' : ''}" data-noise="white" style="background: ${defaultNoise === 'white' ? 'rgba(255,255,255,0.2)' : 'none'}; border: none; color: white; padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">📻 白噪</button>
                    </div>
                </div>

                <!-- 控制按钮 -->
                <div id="pomo-controls" style="display: flex; gap: 10px; width: 100%;">
                    <button id="btn-pomo-pause" class="btn" style="flex: 1.2; background: rgba(255,255,255,0.12); color: white; border: none; padding: 14px; border-radius: 24px; font-size: 15px; font-weight: 500;">⏸ 暂停</button>
                    <button id="btn-pomo-skip" class="btn" style="flex: 1.2; background: rgba(255,255,255,0.08); color: #CBD5E1; border: none; padding: 14px; border-radius: 24px; font-size: 15px;">⏭ 跳过</button>
                    <button id="btn-pomo-finish" class="btn" style="flex: 1; background: #5B8C6F; color: white; border: none; padding: 14px; border-radius: 24px; font-size: 15px; font-weight: 600;">✅ 结束</button>
                </div>

                <!-- 阶段结算浮层 -->
                <div id="pomo-phase-overlay" style="display: none; background: #FFFFFF; color: #3D3530; width: 100%; padding: 22px; border-radius: 16px; box-sizing: border-box; box-shadow: 0 10px 25px rgba(0,0,0,0.35); margin-top: 12px;"></div>

                <!-- 结束小结浮层 -->
                <div id="pomo-summary" style="display: none; background: #FFFFFF; color: #3D3530; width: 100%; padding: 22px; border-radius: 16px; box-sizing: border-box; box-shadow: 0 10px 25px rgba(0,0,0,0.35); margin-top: 12px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 19px; font-weight: bold; text-align: center;">🍅 本次番茄小结</h3>
                    <div style="text-align: center; margin-bottom: 16px;">
                        <div id="pomo-summary-count" style="font-size: 26px; font-weight: bold; color: #D9584A;"></div>
                        <div id="pomo-summary-time" style="font-size: 13px; color: #666; margin-top: 4px;"></div>
                    </div>

                    <div id="pomo-summary-mood-wrap" style="margin-bottom: 16px;">
                        <div style="font-size: 13px; color: #666; margin-bottom: 8px;">为最后一个番茄记录心境：</div>
                        <div style="display: flex; justify-content: space-around; font-size: 24px;">
                            <span class="pomo-mood-opt" data-mood="😤" style="cursor: pointer; opacity: 0.4;">😤</span>
                            <span class="pomo-mood-opt" data-mood="😐" style="cursor: pointer; opacity: 0.4;">😐</span>
                            <span class="pomo-mood-opt" data-mood="🙂" style="cursor: pointer; opacity: 1;">🙂</span>
                            <span class="pomo-mood-opt" data-mood="😊" style="cursor: pointer; opacity: 0.4;">😊</span>
                            <span class="pomo-mood-opt" data-mood="🔥" style="cursor: pointer; opacity: 0.4;">🔥</span>
                        </div>
                    </div>

                    <div id="pomo-summary-reflect-wrap" style="margin-bottom: 16px;">
                        <textarea id="pomo-reflection" style="width: 100%; border: 1px solid #E8E2DB; border-radius: 8px; padding: 10px; font-family: inherit; font-size: 14px; min-height: 70px; box-sizing: border-box; resize: none;" placeholder="写下一句收获（可选，将同步沉淀至镜）..."></textarea>
                    </div>

                    <button id="btn-pomo-save" class="btn btn-primary" style="width: 100%; padding: 12px; border-radius: 10px; background: #2C3E6B; color: white; border: none; font-size: 15px; font-weight: bold;">保存并返回</button>
                    <button id="btn-pomo-discard" style="width: 100%; margin-top: 8px; background: none; border: none; color: #999; font-size: 13px; padding: 8px; cursor: pointer;">直接返回</button>
                </div>
            </div>
        `;

        this.bindPomodoroEvents(container, defaultNoise);
        this.startFocusPhase(container);
    },

    /** 进入专注阶段 */
    startFocusPhase: function(container) {
        this.pomoPhase = 'focus';
        this.pomoPhaseTotal = this.pomoWork * 60;
        this.pomoRemaining = this.pomoPhaseTotal;
        this.pomoPhaseEndsAt = Date.now() + this.pomoPhaseTotal * 1000;
        this.pomoAwaitingChoice = false;
        this.isPaused = false;

        const pauseBtn = container.querySelector('#btn-pomo-pause');
        if (pauseBtn) pauseBtn.textContent = '⏸ 暂停';
        const skipBtn = container.querySelector('#btn-pomo-skip');
        if (skipBtn) skipBtn.textContent = '⏭ 跳过本番茄';

        const overlay = container.querySelector('#pomo-phase-overlay');
        if (overlay) overlay.style.display = 'none';
        const controls = container.querySelector('#pomo-controls');
        if (controls) controls.style.display = 'flex';

        this.updatePomodoroLabels(container);
        this.updatePomodoroDisplay(container);
        this.ensurePomodoroTicker(container);
        this.resumePomodoroNoise(container);
    },

    /** 进入休息阶段 */
    startBreakPhase: function(container, minutes) {
        this.pomoPhase = 'break';
        this.pomoBreakMinutes = minutes;
        this.pomoPhaseTotal = minutes * 60;
        this.pomoRemaining = this.pomoPhaseTotal;
        this.pomoPhaseEndsAt = Date.now() + this.pomoPhaseTotal * 1000;
        this.pomoAwaitingChoice = false;
        this.isPaused = false;

        const pauseBtn = container.querySelector('#btn-pomo-pause');
        if (pauseBtn) pauseBtn.textContent = '⏸ 暂停';
        const skipBtn = container.querySelector('#btn-pomo-skip');
        if (skipBtn) skipBtn.textContent = '⏭ 跳过休息';

        const overlay = container.querySelector('#pomo-phase-overlay');
        if (overlay) overlay.style.display = 'none';
        const controls = container.querySelector('#pomo-controls');
        if (controls) controls.style.display = 'flex';

        this.updatePomodoroLabels(container);
        this.updatePomodoroDisplay(container);
        this.ensurePomodoroTicker(container);

        // 休息时保持安静
        if (window.CiKeAudio) window.CiKeAudio.stop();
    },

    /** 计时心跳：基于时间戳计算剩余量，避免后台标签页节流导致漂移 */
    ensurePomodoroTicker: function(container) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.isPaused || this.pomoAwaitingChoice) return;
            const remain = this.getPomodoroRemaining();
            this.pomoRemaining = remain;
            this.updatePomodoroDisplay(container);
            if (remain <= 0) this.onPomodoroPhaseEnd(container);
        }, 250);
    },

    getPomodoroRemaining: function() {
        if (this.pomoPhaseEndsAt) {
            return Math.max(0, Math.round((this.pomoPhaseEndsAt - Date.now()) / 1000));
        }
        return this.pomoRemaining || 0;
    },

    updatePomodoroDisplay: function(container) {
        const display = container.querySelector('#pomo-display');
        const bar = container.querySelector('#pomo-progress');
        const remain = this.getPomodoroRemaining();
        if (display) display.textContent = this.formatTime(remain);
        if (bar && this.pomoPhaseTotal > 0) {
            const pct = Math.min(100, Math.max(0, ((this.pomoPhaseTotal - remain) / this.pomoPhaseTotal) * 100));
            bar.style.width = pct.toFixed(1) + '%';
        }
    },

    updatePomodoroLabels: function(container) {
        const label = container.querySelector('#pomo-phase-label');
        const dots = container.querySelector('#pomo-dots');
        const stats = container.querySelector('#pomo-run-stats');
        const bar = container.querySelector('#pomo-progress');

        if (label) {
            if (this.pomoPhase === 'focus') {
                label.style.color = '#D9584A';
                label.textContent = `🍅 专注中 · 第 ${this.pomoRunRounds + 1} 个番茄`;
            } else {
                label.style.color = '#7FB3D5';
                label.textContent = `☕ 休息中 · ${this.pomoBreakMinutes} 分钟`;
            }
        }
        if (bar) bar.style.background = this.pomoPhase === 'focus' ? '#D9584A' : '#7FB3D5';

        if (dots) {
            let html = '';
            for (let i = 0; i < this.pomoRounds; i++) {
                const done = i < this.pomoRoundInCycle;
                html += `<span style="width: 9px; height: 9px; border-radius: 50%; display: inline-block; background: ${done ? '#D9584A' : 'rgba(255,255,255,0.22)'};"></span>`;
            }
            dots.innerHTML = html;
        }
        if (stats) {
            const mins = Math.round(this.pomoFocusSecondsTotal / 60);
            stats.textContent = this.pomoRunRounds > 0
                ? `本次已完成 ${this.pomoRunRounds} 个番茄 · ${mins} 分钟`
                : '完成一个番茄后将自动记入专注历程';
        }
    },

    /** 阶段自然结束 */
    onPomodoroPhaseEnd: function(container) {
        this.pomoAwaitingChoice = true;
        this.pomoRemaining = 0;
        if (window.CiKeAudio) window.CiKeAudio.stop();

        if (this.pomoPhase === 'focus') {
            // 一个完整番茄落库
            const session = window.CiKeStore.addFocusSession({
                task: this.pomoTask,
                duration: this.pomoPhaseTotal,
                mood: '🙂',
                reflection: '',
                isPomodoro: true,
                pomodoroMinutes: Math.round(this.pomoPhaseTotal / 60)
            });
            this.pomoLastSessionId = session ? session.id : null;

            this.pomoRunRounds++;
            this.pomoFocusSecondsTotal += this.pomoPhaseTotal;
            this.pomoRoundInCycle = this.pomoRunRounds % this.pomoRounds;

            const isLongBreak = this.pomoRunRounds % this.pomoRounds === 0;
            const breakMinutes = isLongBreak ? this.pomoLong : this.pomoShort;

            if (window.CiKeAudio) window.CiKeAudio.chime('focus-done');
            this.updatePomodoroLabels(container);

            this.showPhaseOverlay(container, {
                title: `🍅 第 ${this.pomoRunRounds} 个番茄完成`,
                desc: isLongBreak
                    ? `完成了一轮完整循环，给自己 ${breakMinutes} 分钟长休息吧。`
                    : `休息 ${breakMinutes} 分钟，让大脑整理一下刚才的收获。`,
                primaryLabel: `☕ 休息 ${breakMinutes} 分钟`,
                onPrimary: () => this.startBreakPhase(container, breakMinutes),
                secondaryLabel: '🍅 直接下一个番茄',
                onSecondary: () => this.startFocusPhase(container)
            });
        } else {
            if (window.CiKeAudio) window.CiKeAudio.chime('break-done');
            this.updatePomodoroLabels(container);
            this.showPhaseOverlay(container, {
                title: '☕ 休息结束',
                desc: `准备好开始第 ${this.pomoRunRounds + 1} 个番茄了吗？`,
                primaryLabel: '🍅 开始下一个番茄',
                onPrimary: () => this.startFocusPhase(container),
                secondaryLabel: null
            });
        }
    },

    showPhaseOverlay: function(container, opts) {
        const overlay = container.querySelector('#pomo-phase-overlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <h3 style="margin: 0 0 10px 0; font-size: 19px; font-weight: bold; text-align: center;">${opts.title}</h3>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: #666; text-align: center; line-height: 1.6;">${opts.desc}</p>
            <button id="pomo-overlay-primary" style="width: 100%; padding: 12px; border-radius: 10px; background: #D9584A; color: white; border: none; font-size: 15px; font-weight: 600; cursor: pointer;">${opts.primaryLabel}</button>
            ${opts.secondaryLabel ? `<button id="pomo-overlay-secondary" style="width: 100%; margin-top: 8px; padding: 11px; border-radius: 10px; background: #F0EAE3; color: #3D3530; border: none; font-size: 14px; cursor: pointer;">${opts.secondaryLabel}</button>` : ''}
            <button id="pomo-overlay-stop" style="width: 100%; margin-top: 10px; background: none; border: none; color: #999; font-size: 13px; padding: 6px; cursor: pointer;">✅ 结束本次番茄</button>
        `;
        overlay.style.display = 'block';

        const controls = container.querySelector('#pomo-controls');
        if (controls) controls.style.display = 'none';

        overlay.querySelector('#pomo-overlay-primary').addEventListener('click', () => {
            this.hidePhaseOverlay(container);
            opts.onPrimary();
        });
        const secondary = overlay.querySelector('#pomo-overlay-secondary');
        if (secondary && opts.onSecondary) {
            secondary.addEventListener('click', () => {
                this.hidePhaseOverlay(container);
                opts.onSecondary();
            });
        }
        overlay.querySelector('#pomo-overlay-stop').addEventListener('click', () => {
            this.hidePhaseOverlay(container);
            this.showSummary(container);
        });
    },

    hidePhaseOverlay: function(container) {
        const overlay = container.querySelector('#pomo-phase-overlay');
        if (overlay) overlay.style.display = 'none';
        const controls = container.querySelector('#pomo-controls');
        if (controls) controls.style.display = 'flex';
    },

    /** 结束本次番茄，展示小结与复盘入口 */
    showSummary: function(container) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (window.CiKeAudio) window.CiKeAudio.stop();
        this.isPaused = true;
        this.pomoAwaitingChoice = true;

        const totalMin = Math.round(this.pomoFocusSecondsTotal / 60);
        const countEl = container.querySelector('#pomo-summary-count');
        const timeEl = container.querySelector('#pomo-summary-time');
        if (countEl) countEl.textContent = `${this.pomoRunRounds} 个番茄`;
        if (timeEl) timeEl.textContent = totalMin > 0 ? `累计专注 ${totalMin} 分钟` : '本次还没有完成完整的番茄';

        const moodWrap = container.querySelector('#pomo-summary-mood-wrap');
        const reflectWrap = container.querySelector('#pomo-summary-reflect-wrap');
        if (this.pomoRunRounds === 0) {
            if (moodWrap) moodWrap.style.display = 'none';
            if (reflectWrap) reflectWrap.style.display = 'none';
        }

        const controls = container.querySelector('#pomo-controls');
        if (controls) controls.style.display = 'none';
        const summary = container.querySelector('#pomo-summary');
        if (summary) summary.style.display = 'block';
    },

    bindPomodoroEvents: function(container, defaultNoise) {
        let selectedMood = '🙂';

        // 退出
        container.querySelector('#btn-pomo-exit').addEventListener('click', () => {
            if (this.pomoRunRounds > 0) {
                if (!confirm('本次已有完成的番茄，确定退出吗？（已完成的番茄已自动保存）')) return;
            }
            this.cleanup(container);
            window.CiKeRouter.navigate('focus');
        });

        // 走神便签（不中断番茄计时）
        container.querySelector('#btn-pomo-distract').addEventListener('click', () => {
            const note = prompt('脑海里突然冒出的杂念是什么？先记下来，安心继续专注：');
            if (note && note.trim()) {
                window.CiKeStore.addDistractionNote(note.trim(), this.pomoTask);
                alert('已快速存入便签，现在心无旁骛继续投入吧。');
            }
        });

        // 白噪音切换
        container.querySelectorAll('.noise-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll('.noise-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'none';
                });
                const target = e.currentTarget;
                target.classList.add('active');
                target.style.background = 'rgba(255,255,255,0.2)';
                this.pomoNoise = target.getAttribute('data-noise');
                // 仅在专注阶段播放，休息时保持安静
                if (this.pomoPhase === 'focus' && window.CiKeAudio) {
                    window.CiKeAudio.play(this.pomoNoise);
                }
            });
        });

        // 暂停 / 继续
        const btnPause = container.querySelector('#btn-pomo-pause');
        btnPause.addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                this.pomoRemaining = this.getPomodoroRemaining();
                this.pomoPhaseEndsAt = null;
                btnPause.textContent = '▶️ 继续';
                if (window.CiKeAudio) window.CiKeAudio.stop();
            } else {
                this.pomoPhaseEndsAt = Date.now() + this.pomoRemaining * 1000;
                btnPause.textContent = '⏸ 暂停';
                this.resumePomodoroNoise(container);
            }
        });

        // 跳过当前阶段（不计入番茄数）
        container.querySelector('#btn-pomo-skip').addEventListener('click', () => {
            const isFocus = this.pomoPhase === 'focus';
            const msg = isFocus
                ? '跳过当前番茄？跳过不会计入番茄数。'
                : '结束这次休息，直接开始下一个番茄？';
            if (!confirm(msg)) return;
            this.hidePhaseOverlay(container);
            this.pomoAwaitingChoice = false;
            if (isFocus) {
                this.startBreakPhase(container, this.pomoShort);
            } else {
                this.startFocusPhase(container);
            }
        });

        // 结束本次 → 小结
        container.querySelector('#btn-pomo-finish').addEventListener('click', () => {
            this.showSummary(container);
        });

        // 心情选择
        const moods = container.querySelectorAll('.pomo-mood-opt');
        moods.forEach(opt => {
            opt.addEventListener('click', (e) => {
                moods.forEach(o => o.style.opacity = '0.4');
                e.currentTarget.style.opacity = '1';
                selectedMood = e.currentTarget.getAttribute('data-mood');
            });
        });

        // 保存并返回
        container.querySelector('#btn-pomo-save').addEventListener('click', () => {
            const reflectionEl = container.querySelector('#pomo-reflection');
            const reflection = reflectionEl ? reflectionEl.value.trim() : '';

            if (this.pomoLastSessionId) {
                window.CiKeStore.updateFocusSessionReflection(this.pomoLastSessionId, reflection, selectedMood);
            }
            if (this.pomoRunRounds > 0) {
                const todayFocus = window.CiKeStore.getTodayFocus();
                if (todayFocus && todayFocus.task === this.pomoTask) {
                    window.CiKeStore.completeTodayFocus();
                }
            }
            this.cleanup(container);
            window.CiKeRouter.navigate('focus');
        });

        // 直接返回
        container.querySelector('#btn-pomo-discard').addEventListener('click', () => {
            if (this.pomoRunRounds > 0) {
                const todayFocus = window.CiKeStore.getTodayFocus();
                if (todayFocus && todayFocus.task === this.pomoTask) {
                    window.CiKeStore.completeTodayFocus();
                }
            }
            this.cleanup(container);
            window.CiKeRouter.navigate('focus');
        });
    },

    /** 恢复当前选中的白噪音（仅专注阶段） */
    resumePomodoroNoise: function(container) {
        if (!window.CiKeAudio) return;
        if (this.pomoPhase !== 'focus') return;
        const active = container.querySelector('.noise-btn.active');
        const type = this.pomoNoise || (active ? active.getAttribute('data-noise') : 'none');
        if (type && type !== 'none') window.CiKeAudio.play(type);
    }
};
