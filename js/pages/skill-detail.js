/**
 * 技能详情页 (Skill Detail Page)
 * 展示核心原理、四大落地方法论、检验标准，以及「修炼路径地图」（关卡式节点路径）
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
        const verification = store.getVerification(skill.id);
        const isMastered = store.isSkillMastered(skill.id);
        const level = store.calculateLevel(completedUnits.length, skill.units.length, isMastered);
        const skillXp = store.getSkillXp(skill.id);
        const streak = store.getStreak();

        let html = `
            <div class="skill-detail-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 40px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button id="btn-back-skills" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--color-text-light); padding: 4px 8px 4px 0;">←</button>
                        <span style="font-size: 14px; color: var(--color-text-light);">返回五艺大厅</span>
                    </div>
                    <span style="font-size: 12px; color: var(--color-accent); font-weight: 600;">🔥 连续 ${streak.days} 天</span>
                </div>

                <!-- 头部 Banner -->
                <div class="card" style="border-top: 4px solid ${skill.color}; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 36px;">${skill.icon}</span>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h2 style="margin: 0; font-size: 22px; font-weight: bold;">${skill.title}</h2>
                                <span style="font-size: 11px; background: rgba(0,0,0,0.06); padding: 2px 8px; border-radius: 12px; color: ${skill.color}; font-weight: 600;">${isMastered ? '🏆 ' : ''}${level}</span>
                            </div>
                            <p style="margin: 3px 0 0 0; font-size: 14px; color: var(--color-text-light);">${skill.subtitle}</p>
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px; margin: 12px 0;">
                        <div style="flex: 1; background: rgba(0,0,0,0.03); border-radius: 10px; padding: 9px 10px; text-align: center;">
                            <div style="font-size: 15px; font-weight: bold; color: ${skill.color};">${skillXp}</div>
                            <div style="font-size: 10px; color: var(--color-text-light); margin-top: 2px;">本艺修为</div>
                        </div>
                        <div style="flex: 1; background: rgba(0,0,0,0.03); border-radius: 10px; padding: 9px 10px; text-align: center;">
                            <div style="font-size: 15px; font-weight: bold; color: ${skill.color};">${completedUnits.length}/${skill.units.length}</div>
                            <div style="font-size: 10px; color: var(--color-text-light); margin-top: 2px;">通关单元</div>
                        </div>
                        <div style="flex: 1; background: rgba(0,0,0,0.03); border-radius: 10px; padding: 9px 10px; text-align: center;">
                            <div style="font-size: 15px; font-weight: bold; color: ${skill.color};">${isMastered ? '已精通' : '修炼中'}</div>
                            <div style="font-size: 10px; color: var(--color-text-light); margin-top: 2px;">认定状态</div>
                        </div>
                    </div>

                    <div style="background: #F4EFEB; padding: 12px 14px; border-radius: 12px; margin: 12px 0;">
                        <div style="font-size: 12px; font-weight: bold; color: ${skill.color}; margin-bottom: 4px;">📐 核心底层原理</div>
                        <div style="font-size: 14px; font-weight: 600; line-height: 1.5; color: #332B25;">${skill.corePrinciple}</div>
                    </div>

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

                <!-- 🗺️ 修炼路径地图 -->
                <div style="margin-bottom: 26px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                        <h3 style="font-size: 16px; font-weight: bold; margin: 0;">🗺️ 修炼路径</h3>
                        <span style="font-size: 12px; color: var(--color-text-light);">已完成 ${completedUnits.length}/${skill.units.length}</span>
                    </div>
                    <div style="font-size: 12px; color: var(--color-text-light); margin-bottom: 14px;">沿着路径逐关推进，上一关通关后解锁下一关</div>

                    <div style="position: relative;">
                        <div style="position: absolute; left: 15px; top: 26px; bottom: 26px; width: 2px; background: #E8E2DB;"></div>
                        ${skill.units.map(u => this.renderPathNode(u, prog, completedUnits, store, skill)).join('')}
                    </div>
                </div>
        `;

        const allUnitsDone = completedUnits.length >= skill.units.length;

        html += `
                <!-- 🏆 结业检验 -->
                <div>
                    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">🏆 结业检验</h3>
                    <div class="card" style="border: 1px solid ${isMastered ? '#B8E2CB' : 'var(--color-accent)'}; background: ${isMastered ? '#E8F5EE' : 'transparent'}; padding: 16px; border-radius: 14px;">
                        ${isMastered ? `
                            <div style="text-align: center;">
                                <div style="font-size: 28px;">🏆</div>
                                <div style="font-size: 16px; font-weight: bold; color: #286644; margin: 4px 0 2px 0;">已认定「精通」</div>
                                <div style="font-size: 12px; color: #3C7A58;">${new Date(verification.verifiedAt).toLocaleDateString('zh-CN')} 通过结业检验</div>
                                ${verification.evidence ? `<div style="margin-top: 10px; padding: 10px 12px; background: rgba(255,255,255,0.6); border-radius: 10px; font-size: 12px; color: #33604A; text-align: left; line-height: 1.6; white-space: pre-wrap;">${verification.evidence}</div>` : ''}
                            </div>
                        ` : `
                            <div style="font-size: 12px; font-weight: bold; color: var(--color-accent); margin-bottom: 6px;">🎯 检验标准</div>
                            <div style="font-size: 13px; color: var(--color-text); line-height: 1.6; margin-bottom: 12px;">${skill.verificationStandard}</div>
                            <div style="font-size: 12px; color: var(--color-text-light); line-height: 1.6; margin-bottom: 14px; padding-top: 12px; border-top: 1px dashed var(--color-border);">
                                ${allUnitsDone
                                    ? '🎉 你已通关全部单元，可以提交结业检验了。'
                                    : `通关全部 ${skill.units.length} 个单元后，即可提交结业检验（当前 ${completedUnits.length}/${skill.units.length}）。`}
                            </div>
                            <button id="btn-goto-verification" class="btn" style="background: ${allUnitsDone ? 'var(--color-accent)' : '#E0D8D0'}; color: ${allUnitsDone ? 'white' : '#777'}; border: none; padding: 11px; border-radius: 8px; font-size: 14px; width: 100%;">
                                ${allUnitsDone ? '前往结业检验 →' : '查看检验关单元'}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container, skill.id);
    },

    /** 路径地图上的单个节点 */
    renderPathNode: function(u, prog, completedUnits, store, skill) {
        const isCompleted = completedUnits.includes(u.unitNumber);
        const currentUnit = prog.currentUnit || 1;
        const isCurrent = !isCompleted && u.unitNumber <= currentUnit;
        const isLocked = !isCompleted && !isCurrent;
        const unitProg = store.getUnitProgress(skill.id, u.unitNumber);
        const content = store.getUnitContent(skill.id, u.unitNumber);
        const hasQuiz = !!(content && content.quiz && content.quiz.length);

        let nodeBg, nodeBorder, nodeText;
        if (isCompleted) { nodeBg = '#5B8C6F'; nodeBorder = '#5B8C6F'; nodeText = '#FFF'; }
        else if (isCurrent) { nodeBg = 'var(--color-accent)'; nodeBorder = 'var(--color-accent)'; nodeText = '#FFF'; }
        else { nodeBg = '#F0EAE3'; nodeBorder = '#D8D2CB'; nodeText = '#A79E95'; }

        const badgeText = isCompleted ? '✅ 已通关' : (isCurrent ? '🔥 修炼中' : '🔒 未解锁');
        const badgeBg = isCompleted ? '#E8F5EE' : (isCurrent ? '#FDF5E6' : '#F5F5F5');
        const badgeColor = isCompleted ? '#5B8C6F' : (isCurrent ? '#D4A574' : '#999');

        const steps = [
            { key: 'know', icon: '📖', label: '知' },
            hasQuiz ? { key: 'quiz', icon: '🎯', label: '练', special: true } : null,
            { key: 'observe', icon: '👁️', label: '观' },
            { key: 'practice', icon: '🤸', label: '行' },
            { key: 'reflect', icon: '🪞', label: '省' }
        ].filter(Boolean);

        const stepDots = steps.map(s => {
            let done;
            if (s.special) done = !!(unitProg.quiz && unitProg.quiz.passed);
            else done = !!unitProg[s.key];
            return `<span style="color: ${done ? '#5B8C6F' : '#CCC'};">${s.icon}${s.label} ${done ? '✓' : '○'}</span>`;
        }).join('');

        return `
            <div class="path-node-row" data-unit="${u.unitNumber}" data-locked="${isLocked ? '1' : '0'}"
                 style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; position: relative; cursor: ${isLocked ? 'default' : 'pointer'};">
                <div style="width: 32px; height: 32px; flex: none; border-radius: 50%; background: ${nodeBg}; border: 2px solid ${nodeBorder}; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; color: ${nodeText}; z-index: 1; position: relative;">
                    ${isCompleted ? '✓' : (isCurrent ? u.unitNumber : u.unitNumber)}
                </div>
                <div class="card" style="flex: 1; padding: 12px 14px; margin-bottom: 0; border-radius: 12px; opacity: ${isLocked ? '0.6' : '1'}; border: 1px solid ${isCurrent ? 'var(--color-accent)' : 'var(--color-border)'};">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
                        <span style="font-size: 11px; color: var(--color-text-light); font-weight: 600;">第 ${u.unitNumber} 单元</span>
                        ${u.isVerification ? `<span style="font-size: 11px; background: rgba(212,165,116,0.18); color: var(--color-accent); padding: 1px 6px; border-radius: 6px; font-weight: 600;">🏆 检验关</span>` : ''}
                        <span style="font-size: 11px; background: ${badgeBg}; color: ${badgeColor}; padding: 1px 6px; border-radius: 6px; font-weight: 600;">${badgeText}</span>
                    </div>
                    <div style="font-size: 15px; font-weight: bold; color: #332B25; line-height: 1.4;">${u.title}</div>
                    <div style="display: flex; gap: 8px; margin-top: 8px; font-size: 11px; flex-wrap: wrap;">
                        ${stepDots}
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents: function(container, skillId) {
        const btnBack = container.querySelector('#btn-back-skills');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                window.CiKeRouter.navigate('skills');
            });
        }

        container.querySelectorAll('.path-node-row').forEach(row => {
            row.addEventListener('click', () => {
                const unitNum = row.getAttribute('data-unit');
                if (row.getAttribute('data-locked') === '1') {
                    window.CiKeUI.toast('先通关上一单元，这一关就会解锁', 'info');
                    return;
                }
                window.CiKeRouter.navigate(`unit-learning?skill=${skillId}&unit=${unitNum}`);
            });
        });

        const btnVerify = container.querySelector('#btn-goto-verification');
        if (btnVerify) {
            btnVerify.addEventListener('click', () => {
                const skills = window.CiKeSkillsData || [];
                const skill = skills.find(s => s.id === skillId);
                if (!skill) return;
                const vUnit = (skill.units || []).find(u => u.isVerification) || skill.units[skill.units.length - 1];
                window.CiKeRouter.navigate(`unit-learning?skill=${skillId}&unit=${vUnit.unitNumber}`);
            });
        }
    }
};
