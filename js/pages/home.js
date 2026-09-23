// 首页模块
window.HomePage = {
    render: function(container) {
        const today = new Date();
        const hour = today.getHours();
        
        // 时间问候语
        let greeting = '你好';
        if (hour >= 5 && hour < 12) greeting = '上午好';
        else if (hour >= 12 && hour < 18) greeting = '下午好';
        else greeting = '晚上好';
        
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 ${days[today.getDay()]}`;
                        
        const todayFocus = window.CiKeStore.getTodayFocus();
        const records = window.CiKeStore.getRecords();
        const recentRecords = records.slice(0, 3);
        const activeSkillData = window.CiKeStore.getActiveSkillUnit();
        
        let html = `
            <div class="page-header home-header">
                <h2 style="font-size: 28px; margin-bottom: 8px;">${greeting}，</h2>
                <p class="date-display" style="color: #666;">${dateStr}</p>
            </div>
            
            <hr class="divider" style="border: none; border-top: 1px solid #E8E2DB; margin: 24px 0;">
            
            <!-- ⭐ 今日一事 -->
            <div class="card focus-card">
                <h3 style="margin-top: 0;">⭐ 今日一事</h3>
        `;
        
        if (todayFocus && !todayFocus.completed) {
            html += `
                <p class="focus-task-name" style="font-size: 18px; margin: 16px 0;">${todayFocus.task}</p>
                <button id="btn-home-focus" class="btn btn-primary" style="width: 100%;">开始专注</button>
            `;
        } else if (todayFocus && todayFocus.completed) {
            html += `<p style="color: #5B8C6F; margin: 16px 0;">今日目标已完成：${todayFocus.task}</p>`;
        } else {
            html += `
                <p style="margin: 16px 0;">还没有设定今天的目标</p>
                <a href="#morning-checkin" class="link-action" style="color: #D4A574; text-decoration: none;">去早晨签到设定 →</a>
            `;
        }
        
        html += `
            </div>
            
            <hr class="divider" style="border: none; border-top: 1px solid #E8E2DB; margin: 24px 0;">
        `;

        // 🏛️ 今日修炼卡片
        if (activeSkillData && activeSkillData.skill && activeSkillData.unit) {
            const { skill, unit, unitProg } = activeSkillData;
            let stepBadge = "📖 知·理解";
            if (unitProg.know && !unitProg.observe) stepBadge = "👁️ 观·觉察";
            else if (unitProg.observe && !unitProg.practice) stepBadge = "🤸 行·实操";
            else if (unitProg.practice && !unitProg.reflect) stepBadge = "🪞 省·反思";
            else if (unitProg.reflect) stepBadge = "✅ 已通关";

            html += `
                <div class="card skill-home-card" style="border-left: 4px solid ${skill.color};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <h3 style="margin: 0; font-size: 16px; font-weight: bold;">🏛️ 今日修炼</h3>
                        <span style="font-size: 12px; background: rgba(0,0,0,0.06); color: ${skill.color}; padding: 2px 8px; border-radius: 10px; font-weight: 600;">${stepBadge}</span>
                    </div>
                    <p style="margin: 4px 0 6px 0; font-size: 15px; font-weight: bold; color: #332B25;">
                        ${skill.icon} ${skill.title} · 单元 ${unit.unitNumber}：${unit.title}
                    </p>
                    <div style="font-size: 13px; color: var(--color-text-light); margin-bottom: 12px; line-height: 1.4;">
                        ${unit.know.title}
                    </div>
                    <button id="btn-home-learn" class="btn" style="background: ${skill.color}; color: white; border: none; padding: 10px; border-radius: 8px; font-size: 14px; width: 100%;">
                        继续修炼 →
                    </button>
                </div>

                <hr class="divider" style="border: none; border-top: 1px solid #E8E2DB; margin: 24px 0;">
            `;
        }

        // 💭 最近记录
        html += `
            <div class="recent-records-section">
                <h3 style="margin-bottom: 16px;">💭 最近记录</h3>
                <div class="records-list">
        `;
        
        if (recentRecords.length === 0) {
            html += `<p class="empty-state">暂无记录。</p>`;
        } else {
            recentRecords.forEach(record => {
                const icon = record.type === 'thought' ? '💭' : (record.type === 'action' ? '⚡' : '❓');
                const contentStr = record.content.length > 28 ? record.content.substring(0, 28) + '...' : record.content;
                html += `
                    <div class="record-item-small" style="display: flex; align-items: center; margin-bottom: 12px; background: white; padding: 12px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <span class="record-icon" style="margin-right: 12px;">${icon}</span>
                        <span class="record-content-preview" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px;">${contentStr}</span>
                        <span class="record-time" style="font-size: 12px; color: #999; margin-left: 8px;">${this.timeAgo(record.createdAt)}</span>
                    </div>
                `;
            });
            html += `<a href="#mirror" class="link-action" style="color: #D4A574; text-decoration: none; display: block; text-align: center; margin-top: 16px;">查看全部 →</a>`;
        }
        
        html += `
                </div>
            </div>
        `;
        
        // 晚上6点后提示晚间回顾
        if (hour >= 18) {
            const checkins = window.CiKeStore.getCheckins();
            const todayDateStr = today.toDateString();
            const hasEveningCheckin = checkins.some(c => c.type === 'evening' && new Date(c.createdAt).toDateString() === todayDateStr);
            
            if (!hasEveningCheckin) {
                html += `
                    <hr class="divider" style="border: none; border-top: 1px solid #E8E2DB; margin: 24px 0;">
                    <div class="evening-prompt">
                        <button id="btn-evening-reflection" class="btn" style="width: 100%; background: #E8E2DB; border: none; padding: 16px; border-radius: 12px; color: #3D3530; font-size: 16px;">🌙 该做今天的回顾了</button>
                    </div>
                `;
            }
        }
        
        container.innerHTML = html;
        this.bindEvents(container, activeSkillData);
    },
    
    timeAgo: function(timestamp) {
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
        if (seconds < 60) return '刚刚';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
        return `${Math.floor(seconds / 86400)}天前`;
    },
    
    bindEvents: function(container, activeSkillData) {
        const btnFocus = container.querySelector('#btn-home-focus');
        if (btnFocus) {
            btnFocus.addEventListener('click', () => window.CiKeRouter.navigate('focus-timer'));
        }

        const btnLearn = container.querySelector('#btn-home-learn');
        if (btnLearn && activeSkillData) {
            btnLearn.addEventListener('click', () => {
                window.CiKeRouter.navigate(`unit-learning?skill=${activeSkillData.skill.id}&unit=${activeSkillData.unit.unitNumber}`);
            });
        }
        
        const btnEvening = container.querySelector('#btn-evening-reflection');
        if (btnEvening) {
            btnEvening.addEventListener('click', () => window.CiKeRouter.navigate('evening-reflection'));
        }
    }
};
