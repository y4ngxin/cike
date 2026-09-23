// Morning Check-in Page (晨间三问)
(function() {
    window.CiKeMorningCheckin = {
        render: function() {
            const container = document.getElementById('page-morning-checkin');
            if (!container) return;
            
            const today = window.CiKeStore.getTodayStr();
            const checkins = window.CiKeStore ? window.CiKeStore.getCheckins() : [];
            const hasCheckedIn = checkins.some(c => c.type === 'morning' && c.date === today);
            
            if (hasCheckedIn) {
                container.innerHTML = `
                    <div class="cike-empty-state" style="text-align: center; padding: 40px 20px;">
                        <p style="color: var(--cike-text, #3D3530); font-size: 1.1em; margin-bottom: 20px;">你今天已经完成晨间打卡啦，去看看今日待办吧。</p>
                        <button onclick="window.CiKeRouter.navigate('home')" style="background: var(--cike-accent, #D4A574); color: white; border: none; padding: 12px 24px; border-radius: 20px; font-size: 1em;">返回首页</button>
                    </div>
                `;
                return;
            }

            const hour = new Date().getHours();
            let greeting = '☀️ 早上好';
            if (hour >= 12 && hour < 18) greeting = '🌤️ 下午好';
            if (hour >= 18) greeting = '🌙 晚上好';

            container.innerHTML = `
                <div class="cike-morning-container" style="padding: 24px; max-width: 430px; margin: 0 auto; color: var(--cike-text, #3D3530);">
                    <h1 style="font-size: 24px; margin-bottom: 32px; font-weight: bold;">${greeting}</h1>
                    
                    <div class="cike-question" style="margin-bottom: 24px;">
                        <label style="display: block; font-size: 16px; margin-bottom: 12px; font-weight: bold;">1. 今天，你最想做成的一件事是什么？</label>
                        <textarea id="morning-q1" rows="3" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--cike-border, #E8E2DB); background: white; font-family: inherit; font-size: 16px; resize: none; box-sizing: border-box;" placeholder="一件哪怕只做了它，今天也不算虚度的事..."></textarea>
                    </div>

                    <div class="cike-question" style="margin-bottom: 24px;">
                        <label style="display: block; font-size: 16px; margin-bottom: 12px; font-weight: bold;">2. 此刻你的状态如何？</label>
                        <div class="cike-mood-selector" style="display: flex; justify-content: space-between; padding: 10px 0;">
                            <button class="cike-mood-btn" data-mood="😤" style="font-size: 32px; background: none; border: none; opacity: 0.5; transition: all 0.2s; padding: 0;">😤</button>
                            <button class="cike-mood-btn" data-mood="😐" style="font-size: 32px; background: none; border: none; opacity: 0.5; transition: all 0.2s; padding: 0;">😐</button>
                            <button class="cike-mood-btn" data-mood="🙂" style="font-size: 32px; background: none; border: none; opacity: 0.5; transition: all 0.2s; padding: 0;">🙂</button>
                            <button class="cike-mood-btn" data-mood="😊" style="font-size: 32px; background: none; border: none; opacity: 0.5; transition: all 0.2s; padding: 0;">😊</button>
                            <button class="cike-mood-btn" data-mood="🔥" style="font-size: 32px; background: none; border: none; opacity: 0.5; transition: all 0.2s; padding: 0;">🔥</button>
                        </div>
                    </div>

                    <div class="cike-question" style="margin-bottom: 32px;">
                        <label style="display: block; font-size: 16px; margin-bottom: 12px; font-weight: bold;">3. 有什么在困扰你？<span style="font-size: 14px; font-weight: normal; color: #888;">（可跳过）</span></label>
                        <textarea id="morning-q3" rows="3" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--cike-border, #E8E2DB); background: white; font-family: inherit; font-size: 16px; resize: none; box-sizing: border-box;" placeholder="写下来，把它留在这里..."></textarea>
                    </div>

                    <button id="morning-submit" style="width: 100%; background: var(--cike-accent, #D4A574); color: white; border: none; padding: 16px; border-radius: 16px; font-size: 18px; font-weight: bold; min-height: 56px; cursor: pointer; transition: opacity 0.2s;">开始这一天</button>
                </div>
            `;

            let selectedMood = null;
            const moodBtns = container.querySelectorAll('.cike-mood-btn');
            moodBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    moodBtns.forEach(b => {
                        b.style.opacity = '0.5';
                        b.style.transform = 'scale(1)';
                    });
                    const target = e.target.closest('button');
                    target.style.opacity = '1';
                    target.style.transform = 'scale(1.2)';
                    selectedMood = target.getAttribute('data-mood');
                });
            });

            container.querySelector('#morning-submit').addEventListener('click', () => {
                const topTask = container.querySelector('#morning-q1').value.trim();
                const concern = container.querySelector('#morning-q3').value.trim();
                
                if (!topTask) {
                    alert('请填写今天最想做成的一件事。');
                    return;
                }
                if (!selectedMood) {
                    alert('请选择此刻的状态。');
                    return;
                }

                if (window.CiKeStore) {
                    window.CiKeStore.saveCheckin({
                        type: 'morning',
                        date: today,
                        answers: { topTask, mood: selectedMood, concern }
                    });
                    
                    window.CiKeStore.setTodayFocus({ task: topTask });
                }

                if (window.CiKeRouter) {
                    window.CiKeRouter.navigate('home');
                }
            });
        }
    };
})();
