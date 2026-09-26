/**
 * 单元修炼页面 (Unit Learning Page)
 * 五步闭环完整交互：知 (理解) → 练 (主动提取) → 观 (觉察) → 行 (实操) → 省 (反思同步)
 * 「练」为 v1.3 新增环节：即答即反馈，答错不惩罚、温和提示
 */

window.UnitLearningPage = {
    // 「练」的作答状态（在被测页面内保持）
    quizState: null,
    // 「行」的清单勾选状态
    practiceChecks: null,

    render: function(container, params) {
        const skillId = (params && params.skill) || 'meta_learning';
        const unitNumber = parseInt((params && params.unit) || '1', 10);

        const skills = window.CiKeSkillsData || [];
        const skill = skills.find(s => s.id === skillId) || skills[0];
        const unit = skill.units.find(u => u.unitNumber === unitNumber) || skill.units[0];
        const store = window.CiKeStore;

        const unitProg = store.getUnitProgress(skill.id, unit.unitNumber);
        const content = store.getUnitContent(skill.id, unit.unitNumber);
        const isAllDone = store.isUnitComplete(unitProg, content);

        // 「练」状态初始化（同一单元内跨重渲染保持作答进度）
        const quiz = (content && content.quiz && content.quiz.length) ? content.quiz : null;
        const quizKey = skill.id + ':' + unit.unitNumber;
        if (quiz) {
            const prev = unitProg.quiz;
            if (this._quizKey !== quizKey || !this.quizState) {
                this._quizKey = quizKey;
                this.quizState = {
                    skillId: skill.id,
                    unitNumber: unit.unitNumber,
                    index: 0,
                    results: [],
                    picked: null,
                    checked: false,
                    finished: !!(prev && (prev.passed || prev.attempts > 0)),
                    passedBefore: !!(prev && prev.passed),
                    best: prev ? (prev.bestCorrect || 0) : 0,
                    lastCorrect: prev ? (prev.lastCorrect || 0) : 0
                };
            }
        } else {
            this._quizKey = null;
            this.quizState = null;
        }

        // 「行」清单状态初始化
        const steps = (content && content.steps && content.steps.length) ? content.steps
            : (unit.practice && unit.practice.tips ? unit.practice.tips : []);
        if (unitProg.practice) {
            this.practiceChecks = steps.map(() => true);
            this._practiceKey = quizKey;
        } else if (this._practiceKey !== quizKey || !this.practiceChecks || this.practiceChecks.length !== steps.length) {
            this._practiceKey = quizKey;
            this.practiceChecks = steps.map(() => false);
        }

        // 🏆 结业检验关
        const isVerificationUnit = !!unit.isVerification;
        const verification = isVerificationUnit ? store.getVerification(skill.id) : null;
        const isVerified = !!(verification && verification.verified);

        const unitXp = store.getUnitXp(unitProg, content);
        const unitXpMax = store._xpRules.know + store._xpRules.observe + store._xpRules.practice
            + store._xpRules.reflect + store._xpRules.unit + (quiz ? store._xpRules.quizMax : 0);

        let html = `
            <div class="unit-learning-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 50px;">
                <!-- 顶部导航 -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <button id="btn-back-skill" style="background: none; border: none; font-size: 15px; cursor: pointer; color: var(--color-accent); padding: 4px 0;">← 返回${skill.title}</button>
                    <span style="font-size: 12px; color: var(--color-text-light);">单元 ${unit.unitNumber} / ${skill.units.length}</span>
                </div>

                <!-- 单元标题 -->
                <div style="margin-bottom: 18px;">
                    <div style="font-size: 12px; color: ${skill.color}; font-weight: bold; margin-bottom: 4px;">${skill.icon} ${skill.title} · 第 ${unit.unitNumber} 单元</div>
                    <h2 style="font-size: 20px; font-weight: bold; margin: 0 0 6px 0;">${unit.title}</h2>
                </div>

                ${content && content.objective ? `
                    <div class="card" style="background: linear-gradient(135deg, rgba(212,165,116,0.13) 0%, rgba(139,111,111,0.10) 100%); border: 1px solid var(--color-border); border-radius: 14px; padding: 14px 16px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 12px; font-weight: bold; color: var(--color-accent);">🎯 本单元学习目标</span>
                            <span style="font-size: 11px; color: var(--color-text-light);">🏅 修为 ${unitXp} / ${unitXpMax}</span>
                        </div>
                        <div style="font-size: 13px; line-height: 1.6; color: var(--color-text);">${content.objective}</div>
                    </div>
                ` : `
                    <div class="card" style="background: transparent; border: 1px dashed var(--color-border); border-radius: 14px; padding: 12px 14px; margin-bottom: 16px;">
                        <span style="font-size: 12px; color: var(--color-text-light);">🏅 本单元修为 ${unitXp} / ${unitXpMax}</span>
                    </div>
                `}

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
                        <div style="font-size: 13px; color: #3C7A58;">反思已同步至「🪞 镜」；本单元概念也已投入回炉，之后会在复习站与你重逢。</div>
                    </div>
                ` : ''}

                <!-- 1. 📖 知 · 理解 -->
                ${this.renderKnow(unitProg, content, unit)}
                <!-- 2. 🎯 练 · 主动提取（v1.3 新增） -->
                ${quiz ? this.renderQuizShell(unitProg, quiz) : ''}
                <!-- 3. 👁️ 观 · 觉察 -->
                ${this.renderObserve(unitProg, unit)}
                <!-- 4. 🤸 行 · 实践 -->
                ${this.renderPractice(unitProg, unit, steps)}
                <!-- 5. 🪞 省 · 反思 -->
                ${this.renderReflect(unitProg, unit)}

                ${this.renderVerificationPanel(isVerificationUnit, isVerified, verification, isAllDone, skill)}

                <!-- 下一步跳转按钮 -->
                <div style="display: flex; gap: 12px; margin-top: 22px;">
                    <button id="btn-finish-return" class="btn btn-secondary" style="flex: 1; padding: 12px;">返回技能列表</button>
                    ${unitNumber < skill.units.length ? `
                        <button id="btn-next-unit" class="btn btn-primary" style="flex: 1; padding: 12px;">下一单元 →</button>
                    ` : ''}
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container, skill.id, unit.unitNumber);

        // 「练」区由子渲染接管（便于局部刷新）
        if (quiz) this.paintQuiz(container, unitProg, quiz);
    },

    // ---------- 步骤渲染 ----------
    renderKnow: function(unitProg, content, unit) {
        const done = unitProg.know;
        const cards = content && content.cards ? content.cards : null;
        const typeMeta = {
            concept: { label: '概念', icon: '📘', bg: '#FAF6F1', border: '#EADFD4', title: '#2E2722', text: '#4A403A' },
            example: { label: '例子', icon: '🌰', bg: '#F3F7F2', border: '#DCE9DA', title: '#26402C', text: '#3D5342' },
            pitfall: { label: '常见误区', icon: '⚠️', bg: '#FDF4F0', border: '#F2DED4', title: '#6B3421', text: '#7A452F' }
        };

        let body = '';
        if (cards) {
            body = cards.map(c => {
                const m = typeMeta[c.type] || typeMeta.concept;
                return `
                    <div style="background: ${m.bg}; border: 1px solid ${m.border}; border-radius: 10px; padding: 12px; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                            <span style="font-size: 14px;">${m.icon}</span>
                            <span style="font-size: 11px; font-weight: bold; color: ${m.title}; letter-spacing: 0.5px;">${m.label}</span>
                        </div>
                        <h4 style="margin: 0 0 6px 0; font-size: 14px; color: ${m.title};">${c.title}</h4>
                        <div style="font-size: 13px; line-height: 1.65; color: ${m.text};">${this.md(c.content)}</div>
                    </div>
                `;
            }).join('');
        } else {
            body = `
                <div style="background: #FAF6F1; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #2E2722;">${unit.know.title}</h4>
                    <div style="font-size: 13px; line-height: 1.6; color: #4A403A; white-space: pre-wrap;">${unit.know.content}</div>
                </div>
            `;
        }

        const anchorHtml = content && content.anchor ? `
            <div style="display: flex; align-items: flex-start; gap: 8px; background: linear-gradient(135deg, rgba(212,165,116,0.18) 0%, rgba(212,165,116,0.08) 100%); border-left: 3px solid var(--color-accent); border-radius: 8px; padding: 11px 13px; margin-bottom: 12px;">
                <span style="font-size: 15px; flex: none;">🧷</span>
                <div>
                    <div style="font-size: 11px; font-weight: bold; color: var(--color-accent); margin-bottom: 3px;">记忆锚点</div>
                    <div style="font-size: 13.5px; font-weight: 600; line-height: 1.55; color: var(--color-text);">${this.md(content.anchor)}</div>
                </div>
            </div>
        ` : '';

        return `
            <div class="card step-card" style="border-left: 4px solid ${done ? '#5B8C6F' : 'var(--color-accent)'}; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                        <span>📖</span> 1. 知 · 理解
                    </span>
                    <span style="font-size: 12px; font-weight: bold; color: ${done ? '#5B8C6F' : 'var(--color-text-light)'};">
                        ${done ? '✅ 已理解' : '⏳ 待完成'}
                    </span>
                </div>
                ${anchorHtml}
                ${body}
                <button id="btn-done-know" class="btn" style="background: ${done ? '#E0D8D0' : 'var(--color-accent)'}; color: ${done ? '#555' : 'white'}; border: none; padding: 10px; font-size: 14px; border-radius: 8px; width: 100%;">
                    ${done ? '已掌握此原理 (可重温)' : '我理解了，进入下一步 →'}
                </button>
            </div>
        `;
    },

    renderQuizShell: function(unitProg, quiz) {
        return `
            <div class="card step-card" id="step-quiz" style="border-left: 4px solid var(--color-focus); margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                        <span>🎯</span> 2. 练 · 主动提取
                    </span>
                    <span style="font-size: 12px; font-weight: bold; color: var(--color-text-light);">${quiz.length} 题</span>
                </div>
                <div id="quiz-area"></div>
            </div>
        `;
    },

    renderObserve: function(unitProg, unit) {
        const done = unitProg.observe;
        return `
            <div class="card step-card" style="border-left: 4px solid ${done ? '#5B8C6F' : '#6A89CC'}; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                        <span>👁️</span> 3. 观 · 日常生活觉察
                    </span>
                    <span style="font-size: 12px; font-weight: bold; color: ${done ? '#5B8C6F' : 'var(--color-text-light)'};">
                        ${done ? '✅ 已觉察' : '⏳ 待完成'}
                    </span>
                </div>
                <div style="background: #F0F4F8; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #243B53;">${unit.observe.title}</h4>
                    <div style="font-size: 13px; line-height: 1.6; color: #334E68;">${unit.observe.prompt}</div>
                </div>
                <button id="btn-done-observe" class="btn" style="background: ${done ? '#E0D8D0' : '#4A69BD'}; color: ${done ? '#555' : 'white'}; border: none; padding: 10px; font-size: 14px; border-radius: 8px; width: 100%;">
                    ${done ? '今日已完成觉察打卡' : '在生活中观察到了，标记完成 ✓'}
                </button>
            </div>
        `;
    },

    renderPractice: function(unitProg, unit, steps) {
        const done = unitProg.practice;
        const checks = this.practiceChecks || steps.map(() => false);
        const allChecked = steps.length > 0 && checks.every(Boolean);

        const list = steps.map((s, i) => `
            <label style="display: flex; align-items: flex-start; gap: 9px; padding: 7px 0; cursor: pointer;">
                <input type="checkbox" class="practice-step" data-idx="${i}" ${checks[i] ? 'checked' : ''} style="margin-top: 3px; width: 16px; height: 16px; flex: none; cursor: pointer;">
                <span style="font-size: 13px; line-height: 1.55; color: ${checks[i] ? '#8F6B23' : '#7B5612'}; text-decoration: ${checks[i] ? 'none' : 'none'};">${s}</span>
            </label>
        `).join('');

        return `
            <div class="card step-card" style="border-left: 4px solid ${done ? '#5B8C6F' : '#E58E26'}; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                        <span>🤸</span> 4. 行 · 动手实战
                    </span>
                    <span style="font-size: 12px; font-weight: bold; color: ${done ? '#5B8C6F' : 'var(--color-text-light)'};">
                        ${done ? '✅ 已实践' : '⏳ 待完成'}
                    </span>
                </div>

                <div style="background: #FDF7E7; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #6E4909;">${unit.practice.title}</h4>
                    <div style="font-size: 13px; line-height: 1.6; color: #7B5612;">${unit.practice.task}</div>
                </div>

                <div style="background: rgba(253,247,231,0.6); border: 1px dashed #EAD8B1; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: bold; color: #8F6B23; margin-bottom: 2px;">✅ 行动清单（勾完才算完成）</div>
                    ${list}
                </div>

                <button id="btn-done-practice" class="btn" style="background: ${done ? '#E0D8D0' : (allChecked ? '#E58E26' : '#EFE3D2')}; color: ${done ? '#555' : (allChecked ? 'white' : '#A08C6B')}; border: none; padding: 10px; font-size: 14px; border-radius: 8px; width: 100%;">
                    ${done ? '实践任务已完成' : (allChecked ? '我已完成此实操练习 ✓' : `还差 ${checks.filter(c => !c).length} 步 · 勾完即可完成`)}
                </button>
                <button id="btn-set-unit-focus" class="btn" style="margin-top: 8px; background: none; border: 1px solid var(--color-border); color: var(--color-text); padding: 9px; font-size: 13px; border-radius: 8px; width: 100%;">
                    ⭐ 设为我今天的今日一事
                </button>
            </div>
        `;
    },

    renderReflect: function(unitProg, unit) {
        const done = unitProg.reflect;
        const moods = ['😤', '😐', '🙂', '😊', '🔥'];
        return `
            <div class="card step-card" style="border-left: 4px solid ${done ? '#5B8C6F' : '#786FA6'}; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                        <span>🪞</span> 5. 省 · 深度反思 (自动同步到镜)
                    </span>
                    <span style="font-size: 12px; font-weight: bold; color: ${done ? '#5B8C6F' : 'var(--color-text-light)'};">
                        ${done ? '✅ 已沉淀' : '⏳ 待完成'}
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
                        ${moods.map(m => `<span class="step-mood-opt" data-mood="${m}" style="cursor: pointer; opacity: ${(unitProg.mood ? unitProg.mood === m : m === '🙂') ? '1' : '0.4'};">${m}</span>`).join('')}
                    </div>
                </div>

                <button id="btn-save-reflect" class="btn" style="background: var(--color-focus); color: white; border: none; padding: 12px; font-size: 15px; font-weight: bold; border-radius: 8px; width: 100%;">
                    ${done ? '更新反思笔记' : '保存反思并同步至「镜」'}
                </button>
            </div>
        `;
    },

    renderVerificationPanel: function(isVerificationUnit, isVerified, verification, isAllDone, skill) {
        if (!isVerificationUnit) return '';
        if (isVerified) {
            return `
                <div class="card" style="background: #E8F5EE; border: 1px solid #B8E2CB; border-radius: 14px; padding: 18px; margin-bottom: 24px; text-align: center;">
                    <div style="font-size: 30px;">🏆</div>
                    <div style="font-size: 17px; font-weight: bold; color: #286644; margin: 6px 0 4px 0;">已认定「精通」</div>
                    <div style="font-size: 12px; color: #3C7A58;">认证时间：${new Date(verification.verifiedAt).toLocaleString('zh-CN')}</div>
                    ${verification.evidence ? `<div style="margin-top: 12px; padding: 10px 12px; background: rgba(255,255,255,0.65); border-radius: 10px; font-size: 13px; color: #33604A; text-align: left; line-height: 1.6; white-space: pre-wrap;">${verification.evidence}</div>` : ''}
                </div>
            `;
        }
        if (isAllDone) {
            return `
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
        }
        return `
            <div class="card" style="background: transparent; border: 1px dashed var(--color-border); border-radius: 14px; padding: 16px; margin-bottom: 24px; text-align: center;">
                <div style="font-size: 22px; margin-bottom: 6px;">🔒</div>
                <div style="font-size: 13px; color: var(--color-text-light); line-height: 1.6;">完成上方「知 · 练 · 观 · 行 · 省」五步后<br>即可提交结业检验，认定「精通」</div>
            </div>
        `;
    },

    // ---------- 「练」局部渲染 ----------
    _normalizeQ: function(q) {
        if (q.type === 'truefalse') {
            return { options: ['对', '错'], correctIndex: q.answer ? 0 : 1 };
        }
        return { options: q.options || [], correctIndex: typeof q.answer === 'number' ? q.answer : 0 };
    },

    paintQuiz: function(container, unitProg, quiz) {
        const area = container.querySelector('#quiz-area');
        if (!area) return;
        const st = this.quizState;
        if (!st) return;

        // 已通关且未选择重练：显示成绩卡
        if (st.finished && st.passedBefore) {
            area.innerHTML = `
                <div style="background: #E8F5EE; border: 1px solid #B8E2CB; border-radius: 10px; padding: 14px; text-align: center;">
                    <div style="font-size: 13px; color: #286644; font-weight: bold; margin-bottom: 4px;">✅ 已通关</div>
                    <div style="font-size: 12px; color: #3C7A58;">最好成绩 ${st.best} / ${quiz.length}　·　答错的题目已进入复习站等待回炉</div>
                    <button id="btn-quiz-retry" class="btn" style="margin-top: 10px; background: none; border: 1px solid #B8E2CB; color: #286644; padding: 8px 16px; font-size: 13px; border-radius: 8px; width: auto; min-height: auto;">重练一次</button>
                </div>
            `;
            this.bindQuizArea(container, unitProg, quiz);
            return;
        }

        // 出结果
        if (st.finished) {
            const correct = st.results.length ? st.results.filter(r => r.correct).length : st.lastCorrect;
            const passed = quiz.length > 0 && (correct / quiz.length) >= 0.6;
            area.innerHTML = `
                <div style="background: ${passed ? '#E8F5EE' : '#FDF7E7'}; border: 1px solid ${passed ? '#B8E2CB' : '#EAD8B1'}; border-radius: 10px; padding: 16px; text-align: center;">
                    <div style="font-size: 26px;">${passed ? '🎯' : '💪'}</div>
                    <div style="font-size: 16px; font-weight: bold; color: ${passed ? '#286644' : '#8F6B23'}; margin: 6px 0 4px 0;">
                        答对 ${correct} / ${quiz.length}
                    </div>
                    <div style="font-size: 12.5px; color: ${passed ? '#3C7A58' : '#8F6B23'}; line-height: 1.6;">
                        ${passed
                            ? '这一关过了。答错的题已进入复习站，过几天会再来找你——那不是惩罚，是记住的方式。'
                            : '还差一点点。答错的题已进入复习站，过几天回炉一次，会比现在清楚很多。'}
                    </div>
                    <button id="btn-quiz-retry" class="btn" style="margin-top: 12px; background: ${passed ? 'none' : '#E58E26'}; border: ${passed ? '1px solid #B8E2CB' : 'none'}; color: ${passed ? '#286644' : 'white'}; padding: 9px 18px; font-size: 13px; border-radius: 8px; width: auto; min-height: auto;">
                        ${passed ? '再练一遍' : '再试一次'}
                    </button>
                </div>
            `;
            this.bindQuizArea(container, unitProg, quiz);
            return;
        }

        // 作答中
        const q = quiz[st.index];
        const { options, correctIndex } = this._normalizeQ(q);
        const picked = st.picked;
        const checked = st.checked;

        const optionsHtml = options.map((opt, i) => {
            let bg = 'transparent', border = 'var(--color-border)', color = 'var(--color-text)', mark = '';
            if (checked) {
                if (i === correctIndex) { bg = '#E8F5EE'; border = '#5B8C6F'; color = '#286644'; mark = '✓'; }
                else if (i === picked) { bg = '#FDF4F0'; border = '#D88C6A'; color = '#8C4A2F'; mark = '·'; }
            } else if (i === picked) {
                bg = 'rgba(212,165,116,0.14)'; border = 'var(--color-accent)';
            }
            return `
                <button class="quiz-opt" data-idx="${i}" ${checked ? 'disabled' : ''} style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; text-align: left; background: ${bg}; border: 1px solid ${border}; color: ${color}; border-radius: 9px; padding: 11px 13px; font-size: 13.5px; font-family: inherit; line-height: 1.5; margin-bottom: 8px; cursor: ${checked ? 'default' : 'pointer'};">
                    <span>${opt}</span>
                    <span style="font-weight: bold; flex: none;">${mark}</span>
                </button>
            `;
        }).join('');

        const feedback = checked ? `
            <div style="background: ${picked === correctIndex ? '#E8F5EE' : '#FDF7E7'}; border-radius: 10px; padding: 12px; margin-top: 4px; margin-bottom: 10px;">
                <div style="font-size: 13px; font-weight: bold; color: ${picked === correctIndex ? '#286644' : '#8F6B23'}; margin-bottom: 4px;">
                    ${picked === correctIndex ? '✓ 对了' : '再想想：'}
                </div>
                <div style="font-size: 13px; line-height: 1.6; color: ${picked === correctIndex ? '#33604A' : '#7B5612'};">${this.md(q.explain || '')}</div>
            </div>
            <button id="btn-quiz-next" class="btn" style="background: var(--color-focus); color: white; border: none; padding: 11px; font-size: 14px; border-radius: 8px; width: 100%;">
                ${st.index + 1 >= quiz.length ? '查看结果' : '继续 →'}
            </button>
        ` : `
            <button id="btn-quiz-check" class="btn" ${picked === null ? 'disabled' : ''} style="background: ${picked === null ? '#E0D8D0' : 'var(--color-focus)'}; color: ${picked === null ? '#999' : 'white'}; border: none; padding: 11px; font-size: 14px; border-radius: 8px; width: 100%; cursor: ${picked === null ? 'default' : 'pointer'};">
                确认作答
            </button>
        `;

        area.innerHTML = `
            <div style="display: flex; gap: 4px; margin-bottom: 12px;">
                ${quiz.map((_, i) => {
                    let c = '#E8E2DB';
                    if (i < st.index) c = st.results[i] && st.results[i].correct ? '#5B8C6F' : '#D88C6A';
                    else if (i === st.index) c = 'var(--color-focus)';
                    return `<div style="flex: 1; height: 4px; background: ${c}; border-radius: 99px;"></div>`;
                }).join('')}
            </div>
            <div style="font-size: 11px; color: var(--color-text-light); margin-bottom: 8px;">
                第 ${st.index + 1} / ${quiz.length} 题　·　${q.type === 'truefalse' ? '判断' : (q.type === 'scenario' ? '情景' : '选择')}
            </div>
            <div style="font-size: 14.5px; font-weight: 600; line-height: 1.6; color: var(--color-text); margin-bottom: 14px;">${this.md(q.q)}</div>
            ${optionsHtml}
            ${feedback}
        `;

        this.bindQuizArea(container, unitProg, quiz);
    },

    bindQuizArea: function(container, unitProg, quiz) {
        const area = container.querySelector('#quiz-area');
        if (!area) return;
        const st = this.quizState;

        area.querySelectorAll('.quiz-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                if (st.checked) return;
                st.picked = parseInt(btn.getAttribute('data-idx'), 10);
                this.paintQuiz(container, unitProg, quiz);
            });
        });

        const btnCheck = area.querySelector('#btn-quiz-check');
        if (btnCheck) {
            btnCheck.addEventListener('click', () => {
                if (st.picked === null) return;
                const q = quiz[st.index];
                const { correctIndex } = this._normalizeQ(q);
                const correct = st.picked === correctIndex;
                st.results[st.index] = { index: st.index, correct };
                st.checked = true;
                if (window.CiKeAudio) window.CiKeAudio.feedback(correct ? 'correct' : 'wrong');
                this.paintQuiz(container, unitProg, quiz);
            });
        }

        const btnNext = area.querySelector('#btn-quiz-next');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                if (st.index + 1 >= quiz.length) {
                    st.finished = true;
                    st.checked = false;
                    st.picked = null;
                    const res = window.CiKeStore.saveQuizResult(st.skillId, st.unitNumber, st.results);
                    st.passedBefore = !!(res && res.passed);
                    st.best = res ? res.bestCorrect : st.best;
                    st.lastCorrect = st.results.filter(r => r.correct).length;
                    const newly = window.CiKeStore.syncBadges();
                    if (newly.length) {
                        if (window.CiKeAudio) window.CiKeAudio.feedback('levelup');
                        window.CiKeUI.toast(`🏅 点亮印记「${newly[0].name}」：${newly[0].desc}`, 'success', 3600);
                    } else if (res && res.passed) {
                        window.CiKeUI.toast('🎯 测验通关！答错的题已进入复习站', 'success', 3000);
                    }
                    this.render(container, { skill: st.skillId, unit: st.unitNumber });
                } else {
                    st.index += 1;
                    st.checked = false;
                    st.picked = null;
                    this.paintQuiz(container, unitProg, quiz);
                }
            });
        }

        const btnRetry = area.querySelector('#btn-quiz-retry');
        if (btnRetry) {
            btnRetry.addEventListener('click', () => {
                st.index = 0;
                st.results = [];
                st.picked = null;
                st.checked = false;
                st.finished = false;
                this.paintQuiz(container, unitProg, quiz);
            });
        }
    },

    // ---------- 事件绑定 ----------
    bindEvents: function(container, skillId, unitNumber) {
        const store = window.CiKeStore;
        const skills = window.CiKeSkillsData || [];
        const skill = skills.find(s => s.id === skillId);
        const unit = skill && skill.units.find(u => u.unitNumber === unitNumber);
        const content = store.getUnitContent(skillId, unitNumber);

        const on = (sel, evt, fn) => {
            const el = container.querySelector(sel);
            if (el) el.addEventListener(evt, fn);
        };

        on('#btn-back-skill', 'click', () => window.CiKeRouter.navigate(`skill-detail?id=${skillId}`));

        // 知
        on('#btn-done-know', 'click', () => {
            if (content && content.cards) store.markCardsRead(content.cards.length + 1);
            store.completeSkillStep(skillId, unitNumber, 'know');
            this.render(container, { skill: skillId, unit: unitNumber });
        });

        // 观
        on('#btn-done-observe', 'click', () => {
            store.completeSkillStep(skillId, unitNumber, 'observe');
            this.render(container, { skill: skillId, unit: unitNumber });
        });

        // 行 · 清单勾选
        container.querySelectorAll('.practice-step').forEach(cb => {
            cb.addEventListener('change', () => {
                const idx = parseInt(cb.getAttribute('data-idx'), 10);
                if (!this.practiceChecks) return;
                this.practiceChecks[idx] = cb.checked;
                this.render(container, { skill: skillId, unit: unitNumber });
            });
        });

        on('#btn-done-practice', 'click', () => {
            const checks = this.practiceChecks || [];
            if (!checks.length || !checks.every(Boolean)) {
                window.CiKeUI.toast('把行动清单勾完，再标记完成', 'warn');
                return;
            }
            store.completeSkillStep(skillId, unitNumber, 'practice');
            this.render(container, { skill: skillId, unit: unitNumber });
        });

        // ⭐ 设为今日一事
        on('#btn-set-unit-focus', 'click', () => {
            const task = unit && unit.practice ? unit.practice.title : '五艺修炼';
            store.setTodayFocus({ task, source: 'skills', sourceRef: `${skillId}:${unitNumber}` });
            window.CiKeUI.toast('已设为今日一事，去「🔥 炬」开始专注吧', 'success');
        });

        // 省
        let selectedMood = '🙂';
        const moodEls = container.querySelectorAll('.step-mood-opt');
        moodEls.forEach(el => {
            el.addEventListener('click', (e) => {
                moodEls.forEach(m => m.style.opacity = '0.4');
                e.target.style.opacity = '1';
                selectedMood = e.target.getAttribute('data-mood');
            });
        });

        on('#btn-save-reflect', 'click', () => {
            const textarea = container.querySelector('#unit-reflect-text');
            const text = textarea ? textarea.value.trim() : '';
            if (!text) {
                window.CiKeUI.toast('写几句真实反思再提交，复盘是学习的倍增器', 'warn');
                return;
            }
            store.completeSkillStep(skillId, unitNumber, 'reflect', { reflectionText: text, mood: selectedMood });
            window.CiKeUI.toast('反思已保存，并同步到「🪞 镜」', 'success');
            this.render(container, { skill: skillId, unit: unitNumber });
        });

        // 🏆 提交结业检验
        on('#btn-submit-verify', 'click', () => {
            const evidenceEl = container.querySelector('#verify-evidence');
            const confirmEl = container.querySelector('#verify-confirm');
            const evidence = evidenceEl ? evidenceEl.value.trim() : '';
            if (!evidence) {
                window.CiKeUI.toast('写下检验实证，这是认定「精通」的唯一依据', 'warn');
                return;
            }
            if (confirmEl && !confirmEl.checked) {
                window.CiKeUI.toast('请先确认你已达到该技能的检验标准', 'warn');
                return;
            }
            store.saveVerification(skillId, { evidence });
            const newly = store.syncBadges();
            window.CiKeUI.toast('🏆 恭喜！该技能已认定「精通」，里程碑已同步到「🪞 镜」', 'success', 3200);
            if (newly.length && window.CiKeAudio) window.CiKeAudio.feedback('levelup');
            this.render(container, { skill: skillId, unit: unitNumber });
        });

        // 底部
        on('#btn-finish-return', 'click', () => window.CiKeRouter.navigate(`skill-detail?id=${skillId}`));
        on('#btn-next-unit', 'click', () => window.CiKeRouter.navigate(`unit-learning?skill=${skillId}&unit=${unitNumber + 1}`));
    },

    /** 极简 Markdown：仅支持 **加粗**（卡片内容用它做强调） */
    md: function(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }
};
