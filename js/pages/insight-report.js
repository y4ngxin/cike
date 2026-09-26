/**
 * 🪞 镜 · 自省报告 (Insight Report Page)
 * 周/月周期的模式洞察：只帮你"看见"，不给建议、不做评判。
 * 数据来源：本地自省洞察引擎 store.generateInsightReport(period)
 * 设计原则（对齐技术架构文档）：AI 的角色是镜子，不是导师。
 */

(function() {
    let currentPeriod = 'week'; // 'week' | 'month'

    window.CiKeInsightReport = {
        render: function(container) {
            container = container || document.getElementById('page-insight-report');
            if (!container) return;

            const store = window.CiKeStore;
            const report = store.generateInsightReport(currentPeriod);
            const isWeek = currentPeriod === 'week';

            // ---------- 概览统计 ----------
            const recordDelta = report.recordCount - report.prevRecordCount;
            let recordDeltaHtml = '';
            if (report.prevRecordCount > 0 && recordDelta !== 0) {
                const up = recordDelta > 0;
                recordDeltaHtml = `<span style="font-size: 11px; color: ${up ? '#B4553F' : 'var(--color-text-light)'};">${up ? '↑' : '↓'}${Math.abs(recordDelta)}</span>`;
            }

            const focusDelta = report.focusMinutes - report.prevFocusMinutes;
            let focusDeltaHtml = '';
            if (report.prevFocusMinutes > 0 && focusDelta !== 0) {
                const up = focusDelta > 0;
                focusDeltaHtml = `<span style="font-size: 11px; color: ${up ? '#B4553F' : 'var(--color-text-light)'};">${up ? '↑' : '↓'}${Math.abs(focusDelta)}m</span>`;
            }

            // ---------- 模式洞察列表 ----------
            const patternsHtml = report.patterns.length
                ? report.patterns.map(p => `
                    <div style="display: flex; gap: 8px; padding: 10px 0; border-bottom: 1px dashed var(--color-border);">
                        <span style="font-size: 14px; line-height: 1.6;">🔍</span>
                        <span style="font-size: 14px; line-height: 1.6; color: var(--color-text); flex: 1;">${p}</span>
                    </div>
                `).join('')
                : `<p style="font-size: 13px; color: var(--color-text-light); margin: 0;">这一周期还没有足够的记录形成模式。继续记录，轨迹会自己浮现。</p>`;

            // ---------- 情绪分布 ----------
            const moodEntries = Object.keys(report.moodCounts || {});
            const moodTotal = moodEntries.reduce((s, m) => s + report.moodCounts[m], 0);
            const moodBarsHtml = moodEntries.length
                ? moodEntries.sort((a, b) => report.moodCounts[b] - report.moodCounts[a]).map(m => {
                    const pct = Math.round((report.moodCounts[m] / moodTotal) * 100);
                    return `
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <span style="font-size: 16px; width: 22px; text-align: center;">${m}</span>
                            <div style="flex: 1; height: 8px; background: var(--color-border); border-radius: 99px; overflow: hidden;">
                                <div style="width: ${pct}%; height: 100%; background: var(--color-accent); border-radius: 99px;"></div>
                            </div>
                            <span style="font-size: 11px; color: var(--color-text-light); width: 32px; text-align: right;">${pct}%</span>
                        </div>
                    `;
                }).join('')
                : `<p style="font-size: 13px; color: var(--color-text-light); margin: 0;">还没有心情记录。</p>`;

            // ---------- 专注曲线 ----------
            const maxFocus = Math.max(1, ...report.focusSeries.map(s => s.minutes));
            const focusBarsHtml = report.focusSeries.map(s => {
                const h = Math.max(4, Math.round((s.minutes / maxFocus) * 64));
                return `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                        <span style="font-size: 10px; color: var(--color-text-light); height: 14px;">${s.minutes > 0 ? s.minutes : ''}</span>
                        <div style="width: 100%; max-width: 26px; height: 64px; display: flex; align-items: flex-end;">
                            <div style="width: 100%; height: ${h}px; background: ${s.minutes > 0 ? 'var(--color-focus)' : 'var(--color-border)'}; border-radius: 6px 6px 2px 2px; opacity: ${s.minutes > 0 ? 0.9 : 0.5};"></div>
                        </div>
                        <span style="font-size: 10px; color: var(--color-text-light); white-space: nowrap;">${s.label}</span>
                    </div>
                `;
            }).join('');

            // ---------- 主题标签 ----------
            const themesHtml = report.themes.length
                ? report.themes.slice(0, 5).map(t => `
                    <span style="display: inline-block; font-size: 12px; padding: 4px 10px; border-radius: 99px; background: rgba(212,165,116,0.15); color: var(--color-accent); margin: 0 6px 6px 0; font-weight: 600;">
                        ${t.name} · ${t.count}
                    </span>
                `).join('')
                : `<span style="font-size: 12px; color: var(--color-text-light);">暂无显著主题</span>`;

            // ---------- 原文引用 ----------
            const quoteHtml = report.quote
                ? `
                    <div class="card" style="padding: 16px; margin-bottom: 16px; border-left: 3px solid var(--color-focus);">
                        <div style="font-size: 12px; color: var(--color-text-light); margin-bottom: 6px;">📌 你这一周期写下的一句话</div>
                        <div style="font-size: 14px; line-height: 1.7; color: var(--color-text); font-style: italic;">“${report.quote}”</div>
                    </div>
                `
                : '';

            // ---------- 主体 ----------
            let bodyHtml = '';
            if (!report.hasData) {
                bodyHtml = `
                    <div style="text-align: center; padding: 50px 20px; color: var(--color-text-light);">
                        <div style="font-size: 40px; margin-bottom: 14px;">🪞</div>
                        <p style="font-size: 15px; color: var(--color-text); margin-bottom: 6px;">镜中还是一片安静</p>
                        <p style="font-size: 13px; line-height: 1.6;">记录、专注或签到的痕迹还不够<br>镜子的作用是反射，先有光，才照得见自己</p>
                        <button id="btn-insight-goto-record" class="btn" style="margin-top: 20px; background: var(--color-accent); color: white; border: none; padding: 10px 22px; border-radius: 10px; font-size: 14px;">去写一条记录 →</button>
                    </div>
                `;
            } else {
                bodyHtml = `
                    <!-- 概览 -->
                    <div class="card" style="padding: 18px 16px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; text-align: center;">
                            <div style="flex: 1;">
                                <div style="font-size: 22px; font-weight: bold; color: var(--color-text);">${report.recordCount} ${recordDeltaHtml}</div>
                                <div style="font-size: 11px; color: var(--color-text-light); margin-top: 2px;">条记录</div>
                            </div>
                            <div style="width: 1px; background: var(--color-border);"></div>
                            <div style="flex: 1;">
                                <div style="font-size: 22px; font-weight: bold; color: var(--color-text);">${report.focusMinutes} ${focusDeltaHtml}</div>
                                <div style="font-size: 11px; color: var(--color-text-light); margin-top: 2px;">分钟专注</div>
                            </div>
                            <div style="width: 1px; background: var(--color-border);"></div>
                            <div style="flex: 1;">
                                <div style="font-size: 22px; font-weight: bold; color: var(--color-text);">${report.morningCount + report.eveningCount}</div>
                                <div style="font-size: 11px; color: var(--color-text-light); margin-top: 2px;">次签到</div>
                            </div>
                        </div>
                        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--color-border);">
                            <div style="font-size: 12px; color: var(--color-text-light); margin-bottom: 8px;">你反复谈论的主题</div>
                            <div>${themesHtml}</div>
                        </div>
                    </div>

                    <!-- 镜子看到的 -->
                    <div class="card" style="padding: 16px; margin-bottom: 16px;">
                        <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 6px 0;">🔍 镜子看到的</h3>
                        <p style="font-size: 11px; color: var(--color-text-light); margin: 0 0 6px 0;">只陈述观察到的模式，不给建议</p>
                        ${patternsHtml}
                    </div>

                    <!-- 情绪趋势 -->
                    <div class="card" style="padding: 16px; margin-bottom: 16px;">
                        <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 10px 0;">🌡️ 情绪趋势</h3>
                        <p style="font-size: 13px; line-height: 1.7; color: var(--color-text); margin: 0 0 ${moodEntries.length ? '14px' : '0'} 0;">${report.moodTrend}</p>
                        ${moodBarsHtml}
                    </div>

                    <!-- 专注节奏 -->
                    <div class="card" style="padding: 16px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px;">
                            <h3 style="font-size: 15px; font-weight: bold; margin: 0;">🔥 专注节奏</h3>
                            <span style="font-size: 11px; color: var(--color-text-light);">${report.focusSessionCount} 次</span>
                        </div>
                        <div style="display: flex; gap: 6px; align-items: flex-end;">${focusBarsHtml}</div>
                        <p style="font-size: 13px; line-height: 1.7; color: var(--color-text); margin: 14px 0 0 0;">${report.focusSummary}</p>
                    </div>

                    <!-- 修炼投入 -->
                    <div class="card" style="padding: 16px; margin-bottom: 16px;">
                        <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 10px 0;">🏛️ 修炼投入</h3>
                        <p style="font-size: 13px; line-height: 1.7; color: var(--color-text); margin: 0;">${report.skillInsight}</p>
                        <button id="btn-insight-goto-skills" class="btn" style="margin-top: 14px; background: transparent; border: 1px solid var(--color-border); color: var(--color-text); padding: 8px 16px; border-radius: 8px; font-size: 13px; width: 100%;">进入五艺修炼 →</button>
                    </div>

                    ${quoteHtml}
                `;
            }

            container.innerHTML = `
                <div class="cike-insight-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 60px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <button id="btn-insight-back" style="background: none; border: none; font-size: 15px; cursor: pointer; color: var(--color-accent); padding: 4px 0;">← 返回镜</button>
                        <span style="font-size: 15px; font-weight: bold;">自省报告</span>
                        <span style="width: 44px;"></span>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <h2 style="font-size: 22px; font-weight: bold; margin: 0 0 4px 0;">🪞 此刻的镜子</h2>
                        <p style="font-size: 13px; color: var(--color-text-light); margin: 0;">${report.periodLabel}</p>
                    </div>

                    <!-- 周期切换 -->
                    <div style="display: flex; gap: 8px; margin-bottom: 18px;">
                        <button class="period-tab" data-period="week" style="flex: 1; padding: 9px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid ${isWeek ? 'var(--color-accent)' : 'var(--color-border)'}; background: ${isWeek ? 'var(--color-accent)' : 'transparent'}; color: ${isWeek ? 'white' : 'var(--color-text)'};">本周</button>
                        <button class="period-tab" data-period="month" style="flex: 1; padding: 9px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid ${!isWeek ? 'var(--color-accent)' : 'var(--color-border)'}; background: ${!isWeek ? 'var(--color-accent)' : 'transparent'}; color: ${!isWeek ? 'white' : 'var(--color-text)'};">本月</button>
                    </div>

                    ${bodyHtml}

                    <div style="text-align: center; padding: 18px 12px 0; color: var(--color-text-light); font-size: 11px; line-height: 1.7;">
                        镜子只反映，不评判——所有洞察均来自你自己的记录<br>数据全程留在本机，不上传、不训练
                    </div>
                </div>
            `;

            this.bindEvents(container);
        },

        bindEvents: function(container) {
            const btnBack = container.querySelector('#btn-insight-back');
            if (btnBack) {
                btnBack.addEventListener('click', () => window.CiKeRouter.navigate('mirror'));
            }

            // 周期切换
            container.querySelectorAll('.period-tab').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const p = e.target.getAttribute('data-period');
                    if (p && p !== currentPeriod) {
                        currentPeriod = p;
                        this.render(container);
                    }
                });
            });

            const btnRecord = container.querySelector('#btn-insight-goto-record');
            if (btnRecord) {
                btnRecord.addEventListener('click', () => window.CiKeRouter.navigate('new-record'));
            }

            const btnSkills = container.querySelector('#btn-insight-goto-skills');
            if (btnSkills) {
                btnSkills.addEventListener('click', () => window.CiKeRouter.navigate('skills'));
            }
        }
    };
})();
