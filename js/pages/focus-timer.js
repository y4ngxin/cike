/**
 * 专注计时器模块 (沉浸全屏 + Web Audio 白噪音 + 走神防打扰速记)
 */

window.FocusTimerPage = {
    timerInterval: null,
    elapsedSeconds: 0,
    isPaused: false,
    currentTaskName: '',
    
    render: function(container) {
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
    }
};
