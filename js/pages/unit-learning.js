/**
 * 单元修炼页面 (Unit Learning Page)
 * 四步闭环完整交互：知 (理解) → 观 (觉察) → 行 (实操) → 省 (反思同步)
 */

window.UnitLearningPage = {
    render: function(container, params) {
        const skillId = (params && params.skill) || 'meta_learning';
        const unitNumber = parseInt((params && params.unit) || '1', 10);

        const skills = window.CiKeSkillsData || [];
        const skill = skills.find(s => s.id === skillId) || skills[0];
        const unit = skill.units.find(u => u.unitNumber === unitNumber) || skill.units[0];
        const store = window.CiKeStore;

        const unitProg = store.getUnitProgress(skill.id, unit.unitNumber);
        const isAllDone = unitProg.know && unitProg.observe && unitProg.practice && unitProg.reflect;

        // 🏆 结业检验关：只有通关全部四步后才可提交检验，通过后认定「精通」
        const isVerificationUnit = !!unit.isVerification;
        const verification = isVerificationUnit ? store.getVerification(skill.id) : null;
        const isVerified = !!(verification && verification.verified);

        // 结业检验区的三种状态：已精通 / 可提交 / 尚未通关
        let verificationPanel = '';
        if (isVerificationUnit) {
            if (isVerified) {
                verificationPanel = `
                    <div class="card" style="background: #E8F5EE; border: 1px solid #B8E2CB; border-radius: 14px; padding: 18px; margin-bottom: 24px; text-align: center;">
                        <div style="font-size: 30px;">🏆</div>
                        <div style="font-size: 17px; font-weight: bold; color: #286644; margin: 6px 0 4px 0;">已认定「精通」</div>
                        <div style="font-size: 12px; color: #3C7A58;">认证时间：${new Date(verification.verifiedAt).toLocaleString('zh-CN')}</div>
                        ${verification.evidence ? `<div style="margin-top: 12px; padding: 10px 12px; background: rgba(255,255,255,0.65); border-radius: 10px; font-size: 13px; color: #33604A; text-align: left; line-height: 1.6; white-space: pre-wrap;">${verification.evidence}</div>` : ''}
                    </div>
                `;
            } else if (isAllDone) {
                verificationPanel = `
                    <div class="card" style="border: 1px solid var(--color-accent); border-radius: 14px; padding: 18px; margin-bottom: 24px;">
                        <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 6px 0;">🏆 提交结业检验</h3>
                        <p style="font-size: 12px; color: var(--color-text-light); line-height: 1.6; margin: 0 0 12px 0;">
                            精通不是「做完了」，而是通过检验标准。写下你完成检验关挑战的真实实证。
                        </p>
                        <textarea id="verify-evidence" style="width: 100%; border: 1px solid var(--color-border); border-radius: 8px; padding: 10px; font-family: inherit; font-size: 14px; min-height: 100px; resize: none; box-sizing: border-box;" placeholder="举例：我选了一个完全陌生的领域，1小时搭好骨架，录了5分钟讲解发给朋友，对方能复述出核心逻辑……">${verification ? verification.evidence : ''}</textarea>
                        <label style="display: flex; align-items: flex-start; gap: 8px; margin: 12px 0; font-size: 13px; color: var(--color-text); line-height: 1.5; cursor: pointer;">
                            <input type="checkbox" id="verify-confirm" style="margin-top: 3px; width: 16px; height: 16px; flex: none;">
                            <span>我确认已完成上述检验关挑战，并达到「${skill.verificationStandard}」</span>
                        </label>
                        <button id="btn-submit-verify" class="btn" style="background: var(--color-accent); color: white; border: none; padding: 12px; font-size: 15px; font-weight: bold; border-radius: 8px; width: 100%;">
                            提交检验 · 认定精通
                        </button>
                    </div>
                `;
            } else {
                verificationPanel = `
                    <div class="card" style="background: transparent; border: 1px dashed var(--color-border); border-radius: 14px; padding: 16px; margin-bottom: 24px; text-align: center;">
                        <div style="font-size: 22px; margin-bottom: 6px;">🔒</div>
                        <div style="font-size: 13px; color: var(--color-text-light); line-height: 1.6;">完成上方「知 · 观 · 行 · 省」四步后<br>即可提交结业检验，认定「精通」</div>
                    </div>
                `;
            }
        }

        let html = `
            <div class="unit-learning-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 50px;">
                <!-- 顶部导航 -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <button id="btn-back-skill" style="background: none; border: none; font-size: 15px; cursor: pointer; color: var(--color-accent); padding: 4px 0;">← 返回${skill.title}</button>
                    <span style="font-size: 12px; color: var(--color-text-light);">单元 ${unit.unitNumber} / ${skill.units.length}</span>
                </div>

                <!-- 单元标题 -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 12px; color: ${skill.color}; font-weight: bold; margin-bottom: 4px;">${skill.icon} ${skill.title} · 第 ${unit.unitNumber} 单元</div>
                    <h2 style="font-size: 20px; font-weight: bold; margin: 0 0 6px 0;">${unit.title}</h2>
                    <p style="font-size: 13px; color: var(--color-text-light); margin: 0;">${isVerificationUnit ? '通关四步之后，用一次真实的检验为标准背书。' : '遵循认知闭环，练出来的才是自己的底层能力。'}</p>
                </div>

                ${isVerificationUnit ? `
                    <div class="card" style="background: linear-gradient(135deg, rgba(212,165,116,0.16) 0%, rgba(139,111,111,0.12) 100%); border: 1px solid var(--color-accent); border-radius: 14px; padding: 14px 16px; margin-bottom: 18px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <span style="font-size: 20px;">🏆</span>
                            <span style="font-size: 15px; font-weight: bold; color: var(--color-text);">结业检验关</span>
                            ${isVerified ? `<span style="font-size: 11px; background: #E8F5EE; color: #286644; padding: 2px 8px; border-radius: 10px; font-weight: 600;">已认定精通</span>` : ''}
                        </div>
                        <div style="font-size: 12px; color: var(--color-text-light); line-height: 1.6;">
                            <strong style="color: var(--color-text);">检验标准：</strong>${skill.verificationStandard}
                        </div>
                    </div>
                ` : ''}

                ${isAllDone ? `
                    <div class="card" style="background: #E8F5EE; border: 1px solid #B8E2CB; border-radius: 12px; padding: 14px; margin-bottom: 20px; text-align: center;">
                        <span style="font-size: 24px;">🎉</span>
                        <div style="font-size: 16px; font-weight: bold; color: #286644; margin: 4px 0;">本单元修炼圆满完成！</div>
                        <div style="font-size: 13px; color: #3C7A58;">你的反思已自动同步沉淀至「🪞 镜 · 记录」时间线中。</div>
                    </div>
                ` : ''}

                <!-- 四大步骤卡片流 -->

                <!-- 1. 📖 知 · 理解 -->
                <div class="card step-card" style="border-left: 4px solid ${unitProg.know ? '#5B8C6F' : 'var(--color-accent)'}; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                            <span>📖</span> 1. 知 · 核心概念与原理
                        </span>
                        <span style="font-size: 12px; font-weight: bold; color: ${unitProg.know ? '#5B8C6F' : 'var(--color-text-light)'};">
                            ${unitProg.know ? '✅ 已理解' : '⏳ 待完成'}
                        </span>
                    </div>

                    <div style="background: #FAF6F1; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #2E2722;">${unit.know.title}</h4>
                        <div style="font-size: 13px; line-height: 1.6; color: #4A403A; white-space: pre-wrap;">${unit.know.content}</div>
                    </div>

                    <button id="btn-done-know" class="btn" style="background: ${unitProg.know ? '#E0D8D0' : 'var(--color-accent)'}; color: ${unitProg.know ? '#555' : 'white'}; border: none; padding: 10px; font-size: 14px; border-radius: 8px; width: 100%;">
                        ${unitProg.know ? '已掌握此原理 (可重温)' : '我理解了，进入下一步 →'}
                    </button>
                </div>

                <!-- 2. 👁️ 观 · 觉察 -->
                <div class="card step-card" style="border-left: 4px solid ${unitProg.observe ? '#5B8C6F' : '#6A89CC'}; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                            <span>👁️</span> 2. 观 · 日常生活觉察
                        </span>
                        <span style="font-size: 12px; font-weight: bold; color: ${unitProg.observe ? '#5B8C6F' : 'var(--color-text-light)'};">
                            ${unitProg.observe ? '✅ 已觉察' : '⏳ 待完成'}
                        </span>
                    </div>

                    <div style="background: #F0F4F8; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                        <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #243B53;">${unit.observe.title}</h4>
                        <div style="font-size: 13px; line-height: 1.6; color: #334E68;">${unit.observe.prompt}</div>
                    </div>

                    <button id="btn-done-observe" class="btn" style="background: ${unitProg.observe ? '#E0D8D0' : '#4A69BD'}; color: ${unitProg.observe ? '#555' : 'white'}; border: none; padding: 10px; font-size: 14px; border-radius: 8px; width: 100%;">
                        ${unitProg.observe ? '今日已完成觉察打卡' : '在生活中观察到了，标记完成 ✓'}
                    </button>
                </div>

                <!-- 3. 🤸 行 · 实操实践 -->
                <div class="card step-card" style="border-left: 4px solid ${unitProg.practice ? '#5B8C6F' : '#E58E26'}; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                            <span>🤸</span> 3. 行 · 动手实战任务
                        </span>
                        <span style="font-size: 12px; font-weight: bold; color: ${unitProg.practice ? '#5B8C6F' : 'var(--color-text-light)'};">
                            ${unitProg.practice ? '✅ 已实践' : '⏳ 待完成'}
                        </span>
                    </div>

                    <div style="background: #FDF7E7; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                        <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #6E4909;">${unit.practice.title}</h4>
                        <div style="font-size: 13px; line-height: 1.6; color: #7B5612; margin-bottom: 8px;">${unit.practice.task}</div>
                        ${unit.practice.tips ? `
                            <div style="font-size: 11px; color: #8F6B23; border-top: 1px dashed #EAD8B1; padding-top: 6px;">
                                💡 <strong>小锦囊：</strong>${unit.practice.tips.join(' · ')}
                            </div>
                        ` : ''}
                    </div>

                    <button id="btn-done-practice" class="btn" style="background: ${unitProg.practice ? '#E0D8D0' : '#E58E26'}; color: ${unitProg.practice ? '#555' : 'white'}; border: none; padding: 10px; font-size: 14px; border-radius: 8px; width: 100%;">
                        ${unitProg.practice ? '实践任务已完成' : '我已完成此实操练习 ✓'}
                    </button>
                </div>

                <!-- 4. 🪞 省 · 反思复盘 -->
                <div class="card step-card" style="border-left: 4px solid ${unitProg.reflect ? '#5B8C6F' : '#786FA6'}; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                            <span>🪞</span> 4. 省 · 深度反思 (自动同步到镜)
                        </span>
                        <span style="font-size: 12px; font-weight: bold; color: ${unitProg.reflect ? '#5B8C6F' : 'var(--color-text-light)'};">
                            ${unitProg.reflect ? '✅ 已沉淀' : '⏳ 待完成'}
                        </span>
                    </div>

                    <div style="font-size: 13px; color: #4A403A; margin-bottom: 10px; line-height: 1.5;">
                        <strong>思考问题：</strong>${unit.reflect.prompt}
                    </div>

                    <div style="margin-bottom: 12px;">
                        <textarea id="unit-reflect-text" style="width: 100%; border: 1px solid var(--color-border); border-radius: 8px; padding: 10px; font-family: inherit; font-size: 14px; min-height: 90px; resize: none; box-sizing: border-box;" placeholder="写下你的真实反思，写完将自动同步沉淀到你的「🪞镜」时间线中...">${unitProg.reflectionText || ''}</textarea>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                        <span style="font-size: 12px; color: var(--color-text-light);">记录此刻心境：</span>
                        <div class="mood-select-row" style="display: flex; gap: 10px; font-size: 20px;">
                            <span class="step-mood-opt" data-mood="😤" style="cursor: pointer; opacity: ${unitProg.mood === '😤' ? '1' : '0.4'};">😤</span>
                            <span class="step-mood-opt" data-mood="😐" style="cursor: pointer; opacity: ${unitProg.mood === '😐' ? '1' : '0.4'};">😐</span>
                            <span class="step-mood-opt" data-mood="🙂" style="cursor: pointer; opacity: ${(!unitProg.mood || unitProg.mood === '🙂') ? '1' : '0.4'};">🙂</span>
                            <span class="step-mood-opt" data-mood="😊" style="cursor: pointer; opacity: ${unitProg.mood === '😊' ? '1' : '0.4'};">😊</span>
                            <span class="step-mood-opt" data-mood="🔥" style="cursor: pointer; opacity: ${unitProg.mood === '🔥' ? '1' : '0.4'};">🔥</span>
                        </div>
                    </div>

                    <button id="btn-save-reflect" class="btn" style="background: var(--color-focus); color: white; border: none; padding: 12px; font-size: 15px; font-weight: bold; border-radius: 8px; width: 100%;">
                        ${unitProg.reflect ? '更新反思笔记' : '保存反思并同步至「镜」'}
                    </button>
                </div>

                ${verificationPanel}

                <!-- 下一步跳转按钮 -->
                <div style="display: flex; gap: 12px;">
                    <button id="btn-finish-return" class="btn btn-secondary" style="flex: 1; padding: 12px;">返回技能列表</button>
                    ${unitNumber < skill.units.length ? `
                        <button id="btn-next-unit" class="btn btn-primary" style="flex: 1; padding: 12px;">下一单元 →</button>
                    ` : ''}
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container, skill.id, unit.unitNumber);
    },

    bindEvents: function(container, skillId, unitNumber) {
        const store = window.CiKeStore;

        // 返回技能详情
        const btnBack = container.querySelector('#btn-back-skill');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                window.CiKeRouter.navigate(`skill-detail?id=${skillId}`);
            });
        }

        // 完成 知
        const btnKnow = container.querySelector('#btn-done-know');
        if (btnKnow) {
            btnKnow.addEventListener('click', () => {
                store.completeSkillStep(skillId, unitNumber, 'know');
                this.render(container, { skill: skillId, unit: unitNumber });
            });
        }

        // 完成 观
        const btnObserve = container.querySelector('#btn-done-observe');
        if (btnObserve) {
            btnObserve.addEventListener('click', () => {
                store.completeSkillStep(skillId, unitNumber, 'observe');
                this.render(container, { skill: skillId, unit: unitNumber });
            });
        }

        // 完成 行
        const btnPractice = container.querySelector('#btn-done-practice');
        if (btnPractice) {
            btnPractice.addEventListener('click', () => {
                store.completeSkillStep(skillId, unitNumber, 'practice');
                this.render(container, { skill: skillId, unit: unitNumber });
            });
        }

        // 心情切换
        let selectedMood = '🙂';
        const moodEls = container.querySelectorAll('.step-mood-opt');
        moodEls.forEach(el => {
            el.addEventListener('click', (e) => {
                moodEls.forEach(m => m.style.opacity = '0.4');
                e.target.style.opacity = '1';
                selectedMood = e.target.getAttribute('data-mood');
            });
        });

        // 保存反思
        const btnReflect = container.querySelector('#btn-save-reflect');
        if (btnReflect) {
            btnReflect.addEventListener('click', () => {
                const textarea = container.querySelector('#unit-reflect-text');
                const text = textarea ? textarea.value.trim() : '';
                if (!text) {
                    alert('请写下几句真实反思再提交，复盘是学习的倍增器。');
                    return;
                }

                store.completeSkillStep(skillId, unitNumber, 'reflect', {
                    reflectionText: text,
                    mood: selectedMood
                });

                alert('反思已保存，并已同步沉淀至你的「🪞 镜 · 记录」！');
                this.render(container, { skill: skillId, unit: unitNumber });
            });
        }

        // 🏆 提交结业检验 · 认定精通
        const btnVerify = container.querySelector('#btn-submit-verify');
        if (btnVerify) {
            btnVerify.addEventListener('click', () => {
                const evidenceEl = container.querySelector('#verify-evidence');
                const confirmEl = container.querySelector('#verify-confirm');
                const evidence = evidenceEl ? evidenceEl.value.trim() : '';
                if (!evidence) {
                    alert('请写下你的检验实证——这是认定「精通」的唯一依据。');
                    return;
                }
                if (confirmEl && !confirmEl.checked) {
                    alert('请先确认你已达到该技能的检验标准。');
                    return;
                }
                store.saveVerification(skillId, { evidence });
                alert('🏆 恭喜通过结业检验，该技能等级已认定「精通」。这份里程碑已同步沉淀至你的「🪞 镜」。');
                this.render(container, { skill: skillId, unit: unitNumber });
            });
        }

        // 底部动作
        const btnReturn = container.querySelector('#btn-finish-return');
        if (btnReturn) {
            btnReturn.addEventListener('click', () => {
                window.CiKeRouter.navigate(`skill-detail?id=${skillId}`);
            });
        }

        const btnNext = container.querySelector('#btn-next-unit');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                window.CiKeRouter.navigate(`unit-learning?skill=${skillId}&unit=${unitNumber + 1}`);
            });
        }
    }
};
