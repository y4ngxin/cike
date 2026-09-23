/**
 * 🏛️ 修 · 五艺大厅页面 (Skills Overview Page)
 */

window.SkillsPage = {
    render: function(container) {
        const skills = window.CiKeSkillsData || [];
        const store = window.CiKeStore;

        let totalCompletedUnits = 0;
        let totalUnits = 0;
        skills.forEach(s => {
            totalUnits += s.units.length;
            const prog = store.getSkillProgress(s.id);
            totalCompletedUnits += (prog.completedUnits || []).length;
        });

        const overallPercent = totalUnits > 0 ? Math.round((totalCompletedUnits / totalUnits) * 100) : 0;

        let html = `
            <div class="skills-page-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text);">
                <div class="page-header" style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">🏛️ 修 · 五艺</h2>
                        <span style="font-size: 13px; color: var(--color-accent); font-weight: 600;">总进度 ${overallPercent}%</span>
                    </div>
                    <p class="subtitle" style="color: var(--color-text-light); font-size: 14px; margin-top: 2px;">
                        不只是看见自己，还要修炼底层能力
                    </p>
                </div>

                <div class="card" style="background: linear-gradient(135deg, #FAF6F1 0%, #F5EFEB 100%); border: 1px solid var(--color-border); padding: 16px; border-radius: 16px; margin-bottom: 20px;">
                    <div style="font-size: 13px; color: var(--color-text-light); margin-bottom: 6px;">四步修炼法</div>
                    <div style="display: flex; justify-content: space-between; text-align: center; font-size: 13px; font-weight: 500;">
                        <span style="flex: 1;">📖 <strong>知</strong>·理解</span>
                        <span style="color: var(--color-border);">→</span>
                        <span style="flex: 1;">👁️ <strong>观</strong>·觉察</span>
                        <span style="color: var(--color-border);">→</span>
                        <span style="flex: 1;">🤸 <strong>行</strong>·实操</span>
                        <span style="color: var(--color-border);">→</span>
                        <span style="flex: 1;">🪞 <strong>省</strong>·反思</span>
                    </div>
                </div>

                <div class="skills-list" style="display: flex; flex-direction: column; gap: 16px;">
        `;

        skills.forEach(skill => {
            const isUnlocked = store.isSkillUnlocked(skill.id);
            const prog = store.getSkillProgress(skill.id);
            const completedCount = (prog.completedUnits || []).length;
            const unitTotal = skill.units.length;
            const percent = Math.round((completedCount / unitTotal) * 100);
            const level = store.calculateLevel(completedCount, unitTotal);

            if (isUnlocked) {
                html += `
                    <div class="skill-card card" data-id="${skill.id}" style="cursor: pointer; position: relative; border-left: 5px solid ${skill.color}; transition: all 0.2s;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 28px;">${skill.icon}</span>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <h3 style="margin: 0; font-size: 18px; font-weight: bold;">${skill.title}</h3>
                                        <span style="font-size: 11px; background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 12px; color: ${skill.color}; font-weight: 600;">${level}</span>
                                    </div>
                                    <p style="margin: 2px 0 0 0; font-size: 13px; color: var(--color-text-light);">${skill.subtitle}</p>
                                </div>
                            </div>
                            <span style="font-size: 13px; font-weight: bold; color: ${skill.color};">${percent}%</span>
                        </div>

                        <div style="background: #F0EAE3; border-radius: 8px; padding: 8px 12px; margin: 10px 0; font-size: 12px; line-height: 1.5; color: #4A403A;">
                            <strong>核心：</strong>${skill.corePrinciple}
                        </div>

                        <div style="margin-top: 10px;">
                            <div class="progress-container" style="height: 6px; background-color: #E8E2DB; border-radius: 99px; overflow: hidden; margin-bottom: 8px;">
                                <div class="progress-bar" style="height: 100%; width: ${percent}%; background-color: ${skill.color}; border-radius: 99px; transition: width 0.4s ease;"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--color-text-light);">
                                <span>已修 ${completedCount} / ${unitTotal} 单元</span>
                                <span style="color: var(--color-accent); font-weight: 600;">进入修炼 →</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // 未解锁卡片
                const cond = skill.unlockCondition;
                const prereqSkill = skills.find(s => s.id === (cond ? cond.skillId : ''));
                const prereqName = prereqSkill ? prereqSkill.title : '前置技能';
                const unlockTip = cond ? `完成「${prereqName}」单元 ${cond.unitNumber} 后解锁` : '敬请期待';

                html += `
                    <div class="skill-card card locked" style="opacity: 0.72; background: #F8F4EF; border-left: 5px solid #CCC; position: relative; padding: 18px 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 28px; filter: grayscale(1);">${skill.icon}</span>
                                <div>
                                    <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: #777;">${skill.title}</h3>
                                    <p style="margin: 2px 0 0 0; font-size: 13px; color: #999;">${skill.subtitle}</p>
                                </div>
                            </div>
                            <span style="font-size: 18px;">🔒</span>
                        </div>
                        <div style="margin-top: 10px; font-size: 12px; color: #8C7E74; background: rgba(0,0,0,0.03); padding: 8px 12px; border-radius: 8px;">
                            <span>🔒 <strong>解锁条件：</strong>${unlockTip}</span>
                            ${cond && cond.reason ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #A09389;">${cond.reason}</p>` : ''}
                        </div>
                    </div>
                `;
            }
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container);
    },

    bindEvents: function(container) {
        container.querySelectorAll('.skill-card:not(.locked)').forEach(card => {
            card.addEventListener('click', () => {
                const skillId = card.getAttribute('data-id');
                window.CiKeRouter.navigate(`skill-detail?id=${skillId}`);
            });
        });
    }
};
