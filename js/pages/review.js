/**
 * 🔁 复习站 · 回炉（间隔重复）
 * 学习科学的灵魂：答错的题、通关单元的核心锚点，会按 1 / 3 / 7 / 21 天回到你面前。
 * 设计原则：答错不惩罚、不清零，只把间隔调回第一档。回炉本身也计入修为。
 */

window.ReviewPage = {
    queue: null,
    current: null,
    checked: false,
    picked: null,
    revealed: false,
    sessionDone: 0,
    sessionCorrect: 0,
    // 即时练习模式（v1.3.3）：练未到期项，不影响间隔节奏
    instantMode: false,

    render: function(container) {
        const store = window.CiKeStore;
        const stats = store.getReviewStats();

        if (!this.queue) {
            this.queue = store.getDueReviewItems().slice();
            this.instantMode = false;
            this.sessionDone = 0;
            this.sessionCorrect = 0;
            this.current = this.queue[0] || null;
            this.checked = false;
            this.picked = null;
            this.revealed = false;
        }
        this.current = this.queue[0] || null;

        let html = `
            <div class="review-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 40px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <button id="btn-review-back" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--color-text-light); padding: 4px 8px 4px 0;">←</button>
                    <span style="font-size: 14px; color: var(--color-text-light);">返回五艺大厅</span>
                </div>

                <div style="margin-bottom: 18px;">
                    <h2 style="font-size: 22px; font-weight: bold; margin: 0 0 4px 0;">🔁 复习站 · 回炉</h2>
                    <p style="font-size: 13px; color: var(--color-text-light); margin: 0; line-height: 1.6;">
                        记住靠的不是看第二遍，是隔几天再想一次。
                    </p>
                </div>

                <div class="card" style="display: flex; justify-content: space-around; text-align: center; padding: 14px; margin-bottom: 18px;">
                    <div>
                        <div style="font-size: 20px; font-weight: bold; color: var(--color-accent);">${stats.due}</div>
                        <div style="font-size: 11px; color: var(--color-text-light); margin-top: 2px;">待回炉</div>
                    </div>
                    <div style="width: 1px; background: var(--color-border);"></div>
                    <div>
                        <div style="font-size: 20px; font-weight: bold; color: var(--color-text);">${stats.pending}</div>
                        <div style="font-size: 11px; color: var(--color-text-light); margin-top: 2px;">队列中</div>
                    </div>
                    <div style="width: 1px; background: var(--color-border);"></div>
                    <div>
                        <div style="font-size: 20px; font-weight: bold; color: #5B8C6F;">${stats.mastered}</div>
                        <div style="font-size: 11px; color: var(--color-text-light); margin-top: 2px;">已彻底掌握</div>
                    </div>
                </div>
        `;

        if (!this.current) {
            const canInstant = stats.due === 0 && stats.pending > 0;
            html += `
                <div class="card" style="padding: 28px 20px; text-align: center;">
                    <div style="font-size: 34px; margin-bottom: 10px;">🌾</div>
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 6px;">${stats.pending > 0 ? '今天没有到期的内容' : '回炉队列是空的'}</div>
                    <div style="font-size: 13px; color: var(--color-text-light); line-height: 1.7;">
                        ${stats.pending > 0
                            ? '队列里还有内容，只是还没到该重逢的时候。<br>回炉是慢慢来的，着急反而记不牢。'
                            : '去修炼一个单元吧。通关后，它的核心概念会自动进入这里，<br>在几天后回来找你。'}
                    </div>
                    ${canInstant ? `
                        <div style="margin-top: 14px; padding: 12px; border-radius: 10px; background: rgba(212,165,116,0.10); border: 1px dashed var(--color-accent);">
                            <div style="font-size: 12.5px; color: var(--color-text); line-height: 1.6; margin-bottom: 8px;">
                                实在想现在练一练也可以——即时练习不影响它们的回炉节奏。
                            </div>
                            <button id="btn-review-instant" class="btn" style="background: var(--color-accent); color: white; border: none; padding: 10px; font-size: 13px; border-radius: 8px; width: 100%;">
                                ⚡ 即时练习 ${Math.min(stats.pending, 5)} 项（不计回炉进度）
                            </button>
                        </div>
                    ` : ''}
                    <button id="btn-review-goskills" class="btn btn-primary" style="margin-top: 16px; padding: 11px; font-size: 14px; border-radius: 8px;">
                        去五艺大厅 →
                    </button>
                </div>
            `;
            container.innerHTML = html + '</div>';
            this.bindEmpty(container);
            return;
        }

        const item = this.current;
        const resolved = this.resolve(item);
        if (!resolved) {
            // 数据已变化（如内容更新），跳过该项
            store.recordReview(item.id, true, { fromReview: false });
            this.queue.shift();
            this.current = this.queue[0] || null;
            this.render(container);
            return;
        }

        const skill = resolved.skill;
        const remain = this.queue.length;

        html += `
                <div class="card" style="padding: 18px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 12px; color: ${skill.color}; font-weight: bold;">${skill.icon} ${skill.title} · 单元 ${item.unitNumber}</span>
                        <span style="font-size: 11px; color: var(--color-text-light);">${this.instantMode ? '⚡ 即时练习 · ' : ''}还剩 ${remain} 项</span>
                    </div>
                    ${this.renderBody(resolved, item)}
                </div>
        `;

        if (this.sessionDone > 0) {
            html += `
                <div style="text-align: center; font-size: 12px; color: var(--color-text-light);">
                    本次已回炉 ${this.sessionDone} 项 · 想起来 ${this.sessionCorrect} 项
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
        this.bindBody(container, resolved, item);
    },

    /** 把队列项解析为可作答的内容 */
    resolve: function(item) {
        const store = window.CiKeStore;
        const skills = window.CiKeSkillsData || [];
        const skill = skills.find(s => s.id === item.skillId);
        if (!skill) return null;
        const unit = skill.units.find(u => u.unitNumber === item.unitNumber);
        if (!unit) return null;
        const content = store.getUnitContent(item.skillId, item.unitNumber);
        if (!content) return null;

        if (item.kind === 'quiz') {
            const q = content.quiz && content.quiz[item.qIndex];
            if (!q) return null;
            let options = q.options || ['对', '错'];
            let correctIndex = q.type === 'truefalse' ? (q.answer ? 0 : 1) : q.answer;
            if (q.type === 'truefalse') options = ['对', '错'];
            return { kind: 'quiz', skill, unit, q, options, correctIndex };
        }

        // 概念回炉：回忆该单元的锚点
        if (!content.anchor) return null;
        return { kind: 'card', skill, unit, anchor: content.anchor, conceptTitle: (content.cards && content.cards[0]) ? content.cards[0].title : unit.title };
    },

    renderBody: function(r, item) {
        const store = window.CiKeStore;
        const stageInfo = this.instantMode
            ? '即时练习'
            : ['第 1 次回炉', '第 2 次回炉', '第 3 次回炉', '最后一次回炉'][Math.min(item.stage || 0, 3)];

        if (r.kind === 'card') {
            if (!this.revealed) {
                return `
                    <div style="font-size: 11px; color: var(--color-text-light); margin-bottom: 10px;">🧠 回忆练习 · ${stageInfo}</div>
                    <div style="font-size: 15px; font-weight: 600; line-height: 1.6; margin-bottom: 16px;">
                        「${r.unit.title}」这一单元，你的记忆锚点是什么？
                    </div>
                    <button id="btn-review-reveal" class="btn" style="background: var(--color-focus); color: white; border: none; padding: 11px; font-size: 14px; border-radius: 8px; width: 100%;">
                        我回忆完了，对照一下
                    </button>
                `;
            }
            return `
                <div style="font-size: 11px; color: var(--color-text-light); margin-bottom: 10px;">🧠 回忆练习 · ${stageInfo}</div>
                <div style="font-size: 12px; color: var(--color-text-light); margin-bottom: 6px;">💡 ${r.conceptTitle}</div>
                <div style="display: flex; align-items: flex-start; gap: 8px; background: linear-gradient(135deg, rgba(212,165,116,0.18) 0%, rgba(212,165,116,0.08) 100%); border-left: 3px solid var(--color-accent); border-radius: 8px; padding: 12px 13px; margin-bottom: 16px;">
                    <span style="font-size: 15px; flex: none;">🧷</span>
                    <div style="font-size: 13.5px; font-weight: 600; line-height: 1.55;">${window.UnitLearningPage.md(r.anchor)}</div>
                </div>
                <div style="font-size: 12px; color: var(--color-text-light); margin-bottom: 8px;">刚才回忆到几分？</div>
                <div style="display: flex; gap: 10px;">
                    <button id="btn-review-ok" class="btn" style="flex: 1; background: #E8F5EE; border: 1px solid #B8E2CB; color: #286644; padding: 11px; font-size: 14px; border-radius: 8px;">想起来了 ✓</button>
                    <button id="btn-review-fuzzy" class="btn" style="flex: 1; background: none; border: 1px solid var(--color-border); color: var(--color-text-light); padding: 11px; font-size: 14px; border-radius: 8px;">有点模糊</button>
                </div>
            `;
        }

        // quiz
        const checked = this.checked;
        const picked = this.picked;
        const optionsHtml = r.options.map((opt, i) => {
            let bg = 'transparent', border = 'var(--color-border)', color = 'var(--color-text)', mark = '';
            if (checked) {
                if (i === r.correctIndex) { bg = '#E8F5EE'; border = '#5B8C6F'; color = '#286644'; mark = '✓'; }
                else if (i === picked) { bg = '#FDF4F0'; border = '#D88C6A'; color = '#8C4A2F'; }
            } else if (i === picked) {
                bg = 'rgba(212,165,116,0.14)'; border = 'var(--color-accent)';
            }
            return `
                <button class="review-opt" data-idx="${i}" ${checked ? 'disabled' : ''} style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; text-align: left; background: ${bg}; border: 1px solid ${border}; color: ${color}; border-radius: 9px; padding: 11px 13px; font-size: 13.5px; font-family: inherit; line-height: 1.5; margin-bottom: 8px; cursor: ${checked ? 'default' : 'pointer'};">
                    <span>${opt}</span><span style="font-weight: bold; flex: none;">${mark}</span>
                </button>
            `;
        }).join('');

        const feedback = checked ? `
            <div style="background: ${picked === r.correctIndex ? '#E8F5EE' : '#FDF7E7'}; border-radius: 10px; padding: 12px; margin-bottom: 10px;">
                <div style="font-size: 13px; font-weight: bold; color: ${picked === r.correctIndex ? '#286644' : '#8F6B23'}; margin-bottom: 4px;">
                    ${picked === r.correctIndex ? '✓ 对了' : '再想想：'}
                </div>
                <div style="font-size: 13px; line-height: 1.6; color: ${picked === r.correctIndex ? '#33604A' : '#7B5612'};">${window.UnitLearningPage.md(r.q.explain || '')}</div>
            </div>
            <button id="btn-review-next" class="btn" style="background: var(--color-focus); color: white; border: none; padding: 11px; font-size: 14px; border-radius: 8px; width: 100%;">继续 →</button>
        ` : `
            <button id="btn-review-check" class="btn" ${picked === null ? 'disabled' : ''} style="background: ${picked === null ? '#E0D8D0' : 'var(--color-focus)'}; color: ${picked === null ? '#999' : 'white'}; border: none; padding: 11px; font-size: 14px; border-radius: 8px; width: 100%; cursor: ${picked === null ? 'default' : 'pointer'};">确认作答</button>
        `;

        return `
            <div style="font-size: 11px; color: var(--color-text-light); margin-bottom: 10px;">🎯 错题回炉 · ${stageInfo}</div>
            <div style="font-size: 14.5px; font-weight: 600; line-height: 1.6; margin-bottom: 14px;">${window.UnitLearningPage.md(r.q.q)}</div>
            ${optionsHtml}
            ${feedback}
        `;
    },

    bindEmpty: function(container) {
        const back = container.querySelector('#btn-review-back');
        if (back) back.addEventListener('click', () => window.CiKeRouter.navigate('skills'));
        const go = container.querySelector('#btn-review-goskills');
        if (go) go.addEventListener('click', () => window.CiKeRouter.navigate('skills'));
        // 即时练习：取队列前 5 项（含未到期），不影响间隔节奏
        const inst = container.querySelector('#btn-review-instant');
        if (inst) {
            inst.addEventListener('click', () => {
                this.queue = window.CiKeStore.getReviewItems().slice(0, 5);
                this.instantMode = true;
                this.sessionDone = 0;
                this.sessionCorrect = 0;
                this.current = this.queue[0] || null;
                this.checked = false;
                this.picked = null;
                this.revealed = false;
                this.render(container);
            });
        }
    },

    bindBody: function(container, r, item) {
        const store = window.CiKeStore;
        const back = container.querySelector('#btn-review-back');
        if (back) back.addEventListener('click', () => window.CiKeRouter.navigate('skills'));

        const advance = (correct) => {
            if (this.instantMode) {
                // 即时练习：只记回炉行为，不动间隔档位
                store.recordReview(item.id, correct, { fromReview: true, instant: true });
            } else {
                store.recordReview(item.id, correct, { fromReview: true });
            }
            this.sessionDone += 1;
            if (correct) this.sessionCorrect += 1;
            this.queue.shift();
            this.current = this.queue[0] || null;
            this.checked = false;
            this.picked = null;
            this.revealed = false;
            if (!this.queue.length && this.instantMode) {
                this.instantMode = false;
                this.queue = null; // 置空让下次渲染按到期项重新初始化
                window.CiKeUI.toast('⚡ 即时练习完成，回炉节奏未受影响', 'success');
            }
            const newly = store.syncBadges();
            if (newly.length) {
                if (window.CiKeAudio) window.CiKeAudio.feedback('levelup');
                window.CiKeUI.toast(`🏅 点亮印记「${newly[0].name}」：${newly[0].desc}`, 'success', 3600);
            }
            this.render(container);
        };

        const reveal = container.querySelector('#btn-review-reveal');
        if (reveal) reveal.addEventListener('click', () => { this.revealed = true; this.render(container); });

        const ok = container.querySelector('#btn-review-ok');
        if (ok) ok.addEventListener('click', () => { if (window.CiKeAudio) window.CiKeAudio.feedback('correct'); advance(true); });

        const fuzzy = container.querySelector('#btn-review-fuzzy');
        if (fuzzy) fuzzy.addEventListener('click', () => { if (window.CiKeAudio) window.CiKeAudio.feedback('wrong'); advance(false); });

        container.querySelectorAll('.review-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.checked) return;
                this.picked = parseInt(btn.getAttribute('data-idx'), 10);
                this.render(container);
            });
        });

        const check = container.querySelector('#btn-review-check');
        if (check) {
            check.addEventListener('click', () => {
                if (this.picked === null) return;
                this.checked = true;
                if (window.CiKeAudio) window.CiKeAudio.feedback(this.picked === r.correctIndex ? 'correct' : 'wrong');
                this.render(container);
            });
        }

        const next = container.querySelector('#btn-review-next');
        if (next) {
            next.addEventListener('click', () => {
                advance(this.picked === r.correctIndex);
            });
        }
    }
};
