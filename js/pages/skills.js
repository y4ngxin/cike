/**
 * 🏛️ 修 · 五艺大厅页面 (Skills Overview Page)
 * 五艺入口 + 修为段位 + 连续修炼 + 今日修炼 / 复习站 / 修炼档案
 */

window.SkillsPage = {
    render: function(container) {
        const skills = window.CiKeSkillsData || [];
        const store = window.CiKeStore;

        let totalCompletedUnits = 0;
        let totalUnits = 0;
        let masteredCount = 0;
        skills.forEach(s => {
            totalUnits += s.units.length;
            const prog = store.getSkillProgress(s.id);
            totalCompletedUnits += (prog.completedUnits || []).length;
            if (store.isSkillMastered(s.id)) masteredCount++;
        });

        const overallPercent = totalUnits > 0 ? Math.round((totalCompletedUnits / totalUnits) * 100) : 0;
        const rank = store.getXpRank();
        const streak = store.getStreak();
        const quests = store.getDailyQuests();
        const review = store.getReviewStats();
        const badges = store.getBadges();
        const badgeUnlocked = badges.filter(b => b.unlocked).length;

        let html = `
            <div class="skills-page-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text);">
                <div class="page-header" style="margin-bottom: 18px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">🏛️ 修 · 五艺</h2>
                        <span style="font-size: 13px; color: var(--color-accent); font-weight: 600;">总进度 ${overallPercent}%</span>
                    </div>
                    <p class="subtitle" style="color: var(--color-text-light); font-size: 14px; margin-top: 2px;">
                        不只是看见自己，还要修炼底层能力
                    </p>
                </div>

                <!-- 修为与连胜 -->
                <div class="card" style="background: linear-gradient(135deg, #FAF6F1 0%, #F5EFEB 100%); border: 1px solid var(--color-border); padding: 16px; border-radius: 16px; margin-bottom: 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="font-size: 12px; color: var(--color-text-light); margin-bottom: 2px;">修为段位</div>
                            <div style="font-size: 22px; font-weight: bold; color: var(--color-accent); line-height: 1.2;">${rank.name}</div>
                            <div style="font-size: 12px; color: var(--color-text-light); margin-top: 3px;">${rank.xp} 修为 · 🏅 ${badgeUnlocked}/${badges.length} 印记</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 20px; font-weight: bold; color: #C86B4A; line-height: 1.2;">🔥 ${streak.days}</div>
                            <div style="font-size: 11px; color: var(--color-text-light); margin-top: 3px;">连续修炼天数</div>
                        </div>
                    </div>
                    <div style="height: 6px; background: #E8E2DB; border-radius: 99px; overflow: hidden; margin-top: 12px;">
                        <div style="height: 100%; width: ${Math.round(rank.ratio * 100)}%; background: linear-gradient(90deg, var(--color-accent) 0%, #5B8C6F 100%); border-radius: 99px;"></div>
                    </div>
                </div>

                <!-- 三个成长入口 -->
                <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                    <div id="card-today-training" style="flex: 1; cursor: pointer; background: ${quests.allDone ? '#E8F5EE' : 'white'}; border: 1px solid ${quests.allDone ? '#B8E2CB' : 'var(--color-border)'}; border-radius: 14px; padding: 13px 12px;">
                        <div style="font-size: 18px; margin-bottom: 4px;">${quests.allDone ? '🌿' : '☀️'}</div>
                        <div style="font-size: 13px; font-weight: bold; color: var(--color-text);">今日修炼</div>
                        <div style="font-size: 11px; color: ${quests.allDone ? '#3C7A58' : 'var(--color-text-light)'}; margin-top: 3px;">${quests.doneCount} / ${quests.total} 已完成</div>
                    </div>
                    <div id="card-review" style="flex: 1; cursor: pointer; background: ${review.due > 0 ? '#FDF5E6' : 'white'}; border: 1px solid ${review.due > 0 ? 'var(--color-accent)' : 'var(--color-border)'}; border-radius: 14px; padding: 13px 12px;">
                        <div style="font-size: 18px; margin-bottom: 4px;">🔁</div>
                        <div style="font-size: 13px; font-weight: bold; color: var(--color-text);">复习站</div>
                        <div style="font-size: 11px; color: ${review.due > 0 ? 'var(--color-accent)' : 'var(--color-text-light)'}; margin-top: 3px;">
                            ${review.due > 0 ? `${review.due} 项待回炉` : (review.pending > 0 ? `${review.pending} 项在队列` : '暂无待回炉')}
                        </div>
                    </div>
                    <div id="card-archive" style="flex: 1; cursor: pointer; background: white; border: 1px solid var(--color-border); border-radius: 14px; padding: 13px 12px;">
                        <div style="font-size: 18px; margin-bottom: 4px;">📜</div>
                        <div style="font-size: 13px; font-weight: bold; color: var(--color-text);">修炼档案</div>
                        <div style="font-size: 11px; color: var(--color-text-light); margin-top: 3px;">${totalCompletedUnits} 单元已通关</div>
                    </div>
                </div>

                <!-- 五步修炼法 -->
                <div class="card" style="background: linear-gradient(135deg, #FAF6F1 0%, #F5EFEB 100%); border: 1px solid var(--color-border); padding: 14px 12px; border-radius: 16px; margin-bottom: 18px;">
                    <div style="font-size: 12px; color: var(--color-text-light); margin-bottom: 8px; text-align: center;">五步修炼法 · 读一遍，练一遍，才记得住</div>
                    <div style="display: flex; justify-content: space-between; text-align: center; font-size: 12px; font-weight: 500;">
                        <span style="flex: 1;">📖 <strong>知</strong><br><span style="font-size: 10px; color: var(--color-text-light);">理解</span></span>
                        <span style="color: var(--color-border); align-self: center;">→</span>
                        <span style="flex: 1;">🎯 <strong>练</strong><br><span style="font-size: 10px; color: var(--color-accent);">测验</span></span>
                        <span style="color: var(--color-border); align-self: center;">→</span>
                        <span style="flex: 1;">👁️ <strong>观</strong><br><span style="font-size: 10px; color: var(--color-text-light);">觉察</span></span>
                        <span style="color: var(--color-border); align-self: center;">→</span>
                        <span style="flex: 1;">🤸 <strong>行</strong><br><span style="font-size: 10px; color: var(--color-text-light);">实操</span></span>
                        <span style="color: var(--color-border); align-self: center;">→</span>
                        <span style="flex: 1;">🪞 <strong>省</strong><br><span style="font-size: 10px; color: var(--color-text-light);">反思</span></span>
                    </div>
                </div>

                <div class="skills-list" style="display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px;">
        `;

        skills.forEach(skill => {
            const isUnlocked = store.isSkillUnlocked(skill.id);
            const prog = store.getSkillProgress(skill.id);
            const completedCount = (prog.completedUnits || []).length;
            const unitTotal = skill.units.length;
            const percent = Math.round((completedCount / unitTotal) * 100);
            const isMastered = store.isSkillMastered(skill.id);
            const level = store.calculateLevel(completedCount, unitTotal, isMastered);
            const skillXp = store.getSkillXp(skill.id);

            if (isUnlocked) {
                html += `
                    <div class="skill-card card" data-id="${skill.id}" style="cursor: pointer; position: relative; border-left: 5px solid ${skill.color}; transition: all 0.2s;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 28px;">${skill.icon}</span>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <h3 style="margin: 0; font-size: 18px; font-weight: bold;">${skill.title}</h3>
                                        <span style="font-size: 11px; background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 12px; color: ${skill.color}; font-weight: 600;">${isMastered ? '🏆 ' : ''}${level}</span>
                                    </div>
                                    <p style="margin: 2px 0 0 0; font-size: 13px; color: var(--color-text-light);">${skill.subtitle} · ${skillXp} 修为</p>
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

        const go = (sel, route) => {
            const el = container.querySelector(sel);
            if (el) el.addEventListener('click', () => window.CiKeRouter.navigate(route));
        };
        go('#card-today-training', 'today-training');
        go('#card-review', 'review');
        go('#card-archive', 'archive');
    }
};
