/**
 * 技能详情页 (Skill Detail Page)
 * 展示核心原理、四大落地方法论、检验标准以及系统单元修炼列表
 */

window.SkillDetailPage = {
    render: function(container, params) {
        const skillId = (params && params.id) || 'meta_learning';
        const skills = window.CiKeSkillsData || [];
        const skill = skills.find(s => s.id === skillId) || skills[0];
        const store = window.CiKeStore;

        const isUnlocked = store.isSkillUnlocked(skill.id);
        const prog = store.getSkillProgress(skill.id);
        const completedUnits = prog.completedUnits || [];
        const level = store.calculateLevel(completedUnits.length, skill.units.length);

        let html = `
            <div class="skill-detail-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 40px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <button id="btn-back-skills" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--color-text-light); padding: 4px 8px 4px 0;">←</button>
                    <span style="font-size: 14px; color: var(--color-text-light);">返回五艺大厅</span>
                </div>

                <!-- 头部 Banner -->
                <div class="card" style="border-top: 4px solid ${skill.color}; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 36px;">${skill.icon}</span>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h2 style="margin: 0; font-size: 22px; font-weight: bold;">${skill.title}</h2>
                                <span style="font-size: 11px; background: rgba(0,0,0,0.06); padding: 2px 8px; border-radius: 12px; color: ${skill.color}; font-weight: 600;">${level}</span>
                            </div>
                            <p style="margin: 3px 0 0 0; font-size: 14px; color: var(--color-text-light);">${skill.subtitle}</p>
                        </div>
                    </div>

                    <!-- 核心原理 -->
                    <div style="background: #F4EFEB; padding: 12px 14px; border-radius: 12px; margin: 12px 0;">
                        <div style="font-size: 12px; font-weight: bold; color: ${skill.color}; margin-bottom: 4px;">📐 核心底层原理</div>
                        <div style="font-size: 14px; font-weight: 600; line-height: 1.5; color: #332B25;">${skill.corePrinciple}</div>
                    </div>

                    <!-- 检验标准 -->
                    <div style="border-left: 3px solid #5B8C6F; padding-left: 10px; margin-top: 10px; font-size: 13px; line-height: 1.5; color: #4F453E;">
                        <span style="font-weight: bold; color: #5B8C6F;">🎯 结业检验标准：</span>${skill.verificationStandard}
                    </div>
                </div>

                <!-- 四大落地方法论 -->
                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                        <span>🛠️</span> 四大可执行方法论
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
        `;

        skill.methods.forEach((m, idx) => {
            html += `
                <div class="card" style="padding: 14px; margin-bottom: 0; border: 1px solid var(--color-border); border-radius: 12px;">
                    <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 15px; font-weight: bold; color: #2E2722;">${idx + 1}. ${m.name}</span>
                        <span style="font-size: 11px; color: var(--color-accent); font-weight: 500;">${m.principle}</span>
                    </div>
                    <p style="font-size: 13px; line-height: 1.5; color: var(--color-text-light); margin: 0;">${m.practice}</p>
                </div>
            `;
        });

        html += `
                    </div>
                </div>

                <!-- 系统单元修炼路径 -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
                        <h3 style="font-size: 16px; font-weight: bold; margin: 0;">📚 单元修炼路径 (${skill.units.length} 单元)</h3>
                        <span style="font-size: 12px; color: var(--color-text-light);">已完成 ${completedUnits.length}/${skill.units.length}</span>
                    </div>

                    <div class="units-list" style="display: flex; flex-direction: column; gap: 10px;">
        `;

        skill.units.forEach(u => {
            const isCompleted = completedUnits.includes(u.unitNumber);
            const unitProg = store.getUnitProgress(skill.id, u.unitNumber);
            const isCurrent = prog.currentUnit === u.unitNumber;

            const badgeBg = isCompleted ? '#E8F5EE' : (isCurrent ? '#FDF5E6' : '#F5F5F5');
            const badgeColor = isCompleted ? '#5B8C6F' : (isCurrent ? '#D4A574' : '#999');
            const badgeText = isCompleted ? '✅ 已通关' : (isCurrent ? '🔥 修炼中' : '⚪ 待开启');

            html += `
                <div class="unit-item-card card" data-unit="${u.unitNumber}" style="cursor: pointer; padding: 14px; margin-bottom: 0; display: flex; align-items: center; justify-content: space-between; border-radius: 12px; border: 1px solid ${isCurrent ? 'var(--color-accent)' : 'var(--color-border)'};">
                    <div style="flex: 1; padding-right: 10px;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                            <span style="font-size: 11px; color: var(--color-text-light); font-weight: 600;">第 ${u.unitNumber} 单元</span>
                            <span style="font-size: 11px; background: ${badgeBg}; color: ${badgeColor}; padding: 1px 6px; border-radius: 6px; font-weight: 600;">${badgeText}</span>
                        </div>
                        <div style="font-size: 15px; font-weight: bold; color: #332B25;">${u.title}</div>
                        
                        <!-- 知观行省 4步打卡状态点 -->
                        <div style="display: flex; gap: 8px; margin-top: 8px; font-size: 11px;">
                            <span style="color: ${unitProg.know ? '#5B8C6F' : '#CCC'};">📖知 ${unitProg.know ? '✓' : '○'}</span>
                            <span style="color: ${unitProg.observe ? '#5B8C6F' : '#CCC'};">👁️观 ${unitProg.observe ? '✓' : '○'}</span>
                            <span style="color: ${unitProg.practice ? '#5B8C6F' : '#CCC'};">🤸行 ${unitProg.practice ? '✓' : '○'}</span>
                            <span style="color: ${unitProg.reflect ? '#5B8C6F' : '#CCC'};">🪞省 ${unitProg.reflect ? '✓' : '○'}</span>
                        </div>
                    </div>
                    <div style="font-size: 18px; color: var(--color-accent);">→</div>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container, skill.id);
    },

    bindEvents: function(container, skillId) {
        const btnBack = container.querySelector('#btn-back-skills');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                window.CiKeRouter.navigate('skills');
            });
        }

        container.querySelectorAll('.unit-item-card').forEach(card => {
            card.addEventListener('click', () => {
                const unitNum = card.getAttribute('data-unit');
                window.CiKeRouter.navigate(`unit-learning?skill=${skillId}&unit=${unitNum}`);
            });
        });
    }
};
