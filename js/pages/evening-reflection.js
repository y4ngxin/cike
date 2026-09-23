// Evening Reflection Page (夜间回顾)
(function() {
    window.CiKeEveningReflection = {
        render: function() {
            const container = document.getElementById('page-evening-reflection');
            if (!container) return;
            
            const today = window.CiKeStore.getTodayStr();
            const checkins = window.CiKeStore ? window.CiKeStore.getCheckins() : [];
            const hasCheckedIn = checkins.some(c => c.type === 'evening' && c.date === today);
            
            if (hasCheckedIn) {
                container.innerHTML = `
                    <div class="cike-empty-state" style="text-align: center; padding: 40px 20px;">
                        <p style="color: var(--cike-text, #3D3530); font-size: 1.1em; margin-bottom: 20px;">你今天已经完成夜间回顾啦，好好休息吧。</p>
                        <button onclick="window.CiKeRouter.navigate('home')" style="background: var(--cike-accent, #D4A574); color: white; border: none; padding: 12px 24px; border-radius: 20px; font-size: 1em;">返回首页</button>
                    </div>
                `;
                return;
            }

            const morningCheckin = window.CiKeStore.getTodayCheckin('morning');
            const topTask = morningCheckin ? morningCheckin.answers.topTask : '今天没有记录想做的事';

            container.innerHTML = `
                <div class="cike-evening-container" style="padding: 24px; max-width: 430px; margin: 0 auto; color: var(--cike-text, #3D3530);">
                    <h1 style="font-size: 24px; margin-bottom: 32px; font-weight: bold;">🌙 今天过得怎么样？</h1>
                    
                    <div class="cike-question" style="margin-bottom: 32px; background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                        <p style="font-size: 15px; color: #666; margin-bottom: 8px;">你早上说想做的事：</p>
                        <p style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">${topTask}</p>
                        
                        <p style="font-size: 15px; color: #666; margin-bottom: 12px;">做到了吗？</p>
                        <div style="display: flex; gap: 12px;">
                            <button class="cike-did-it-btn" data-value="yes" style="flex: 1; padding: 12px; border-radius: 12px; border: 1px solid var(--cike-border, #E8E2DB); background: transparent; font-size: 16px; transition: all 0.2s;">✅ 做到了</button>
                            <button class="cike-did-it-btn" data-value="no" style="flex: 1; padding: 12px; border-radius: 12px; border: 1px solid var(--cike-border, #E8E2DB); background: transparent; font-size: 16px; transition: all 0.2s;">❌ 没有</button>
                        </div>
                    </div>

                    <div class="cike-question" style="margin-bottom: 24px;">
                        <label style="display: block; font-size: 16px; margin-bottom: 12px; font-weight: bold;">今天最有价值的一刻是？</label>
                        <textarea id="evening-q2" rows="3" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--cike-border, #E8E2DB); background: white; font-family: inherit; font-size: 16px; resize: none; box-sizing: border-box;" placeholder="可以是任何微小的瞬间..."></textarea>
                    </div>

                    <div class="cike-question" style="margin-bottom: 32px;">
                        <label style="display: block; font-size: 16px; margin-bottom: 12px; font-weight: bold;">明天想改变什么？</label>
                        <textarea id="evening-q3" rows="3" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--cike-border, #E8E2DB); background: white; font-family: inherit; font-size: 16px; resize: none; box-sizing: border-box;" placeholder="如果可以重来，或是对明天的期许..."></textarea>
                    </div>

                    <button id="evening-submit" style="width: 100%; background: var(--cike-focus, #2C3E6B); color: white; border: none; padding: 16px; border-radius: 16px; font-size: 18px; font-weight: bold; min-height: 56px; cursor: pointer; transition: opacity 0.2s;">结束这一天</button>
                </div>
            `;

            let taskCompleted = null;
            const didItBtns = container.querySelectorAll('.cike-did-it-btn');
            didItBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    didItBtns.forEach(b => {
                        b.style.background = 'transparent';
                        b.style.borderColor = 'var(--cike-border, #E8E2DB)';
                    });
                    const target = e.target.closest('button');
                    taskCompleted = target.getAttribute('data-value') === 'yes';
                    target.style.background = taskCompleted ? '#e8f5ee' : '#fcedee';
                    target.style.borderColor = taskCompleted ? 'var(--cike-success, #5B8C6F)' : '#e57373';
                });
            });

            container.querySelector('#evening-submit').addEventListener('click', () => {
                const bestMoment = container.querySelector('#evening-q2').value.trim();
                const toChange = container.querySelector('#evening-q3').value.trim();
                
                if (taskCompleted === null) {
                    alert('请选择今天想做的事是否做到了。');
                    return;
                }

                if (window.CiKeStore) {
                    window.CiKeStore.saveCheckin({
                        type: 'evening',
                        date: today,
                        answers: { taskCompleted, bestMoment, toChange }
                    });
                }

                if (window.CiKeRouter) {
                    window.CiKeRouter.navigate('home');
                }
            });
        }
    };
})();
