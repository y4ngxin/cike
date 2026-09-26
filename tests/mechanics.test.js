/**
 * 数据层机制回归：内容层完整性 / 修炼点幂等 / 通关判定 / 测验 / 间隔重复（含即时练习）
 * 每日任务（含回炉任务过滤）/ 印记 / 补签 / 导入导出往返
 */
const { boot, createAssert } = require('./helpers/boot');

module.exports = {
    name: 'mechanics · 数据层机制',
    run: async () => {
        const A = createAssert();
        const { store, window } = boot();
        const C = window.CiKeSkillsContent;
        const skills = window.CiKeSkillsData;

        // ---------- 1. 内容层完整性 ----------
        let units = 0, cards = 0, quizzes = 0, steps = 0, bad = [];
        skills.forEach(sk => sk.units.forEach(u => {
            const c = C[`${sk.id}:${u.unitNumber}`];
            if (!c) { bad.push(`${sk.id}:${u.unitNumber} 缺内容`); return; }
            units++;
            if (!c.anchor) bad.push(`${sk.id}:${u.unitNumber} 缺锚点`);
            if (!c.objective) bad.push(`${sk.id}:${u.unitNumber} 缺学习目标`);
            (c.cards || []).forEach(card => {
                cards++;
                if (!card.title || !card.content || !['concept', 'example', 'pitfall'].includes(card.type)) {
                    bad.push(`${sk.id}:${u.unitNumber} 卡片结构异常`);
                }
            });
            (c.quiz || []).forEach(q => {
                quizzes++;
                if (!q.q || !q.explain) bad.push(`${sk.id}:${u.unitNumber} 题目缺题干或解释`);
                if (q.type === 'truefalse' && typeof q.answer !== 'boolean') bad.push(`${sk.id}:${u.unitNumber} 判断题答案非布尔`);
                if (q.type !== 'truefalse' && (!Array.isArray(q.options) || typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length)) {
                    bad.push(`${sk.id}:${u.unitNumber} 选择题答案索引越界`);
                }
            });
            steps += (c.steps || []).length;
        }));
        A.eq('36 个单元内容齐全', units, 36);
        A.eq('108 张微卡', cards, 108);
        A.eq('144 道测验题', quizzes, 144);
        A.eq('108 个行动步骤', steps, 108);
        A.ok(`内容结构零异常${bad.length ? '：' + bad.slice(0, 3).join('；') : ''}`, bad.length === 0);

        // ---------- 2. 修炼点幂等 ----------
        const MK = 'meta_learning';
        const quiz1 = C[`${MK}:1`].quiz;
        store.completeSkillStep(MK, 1, 'know');
        A.eq('完成「知」得 5 修为', store.getXp(), 5);
        store.completeSkillStep(MK, 1, 'know'); // 重复点击
        A.eq('重复完成同一步骤不虚增', store.getXp(), 5);

        store.completeSkillStep(MK, 1, 'observe');
        store.completeSkillStep(MK, 1, 'practice');
        store.completeSkillStep(MK, 1, 'reflect', { reflectionText: 'x' });
        A.eq('四步完成（未过测验）修为 30', store.getXp(), 30);

        // ---------- 3. 通关判定：四步 + 测验 ≥60% ----------
        const prog1 = store.getUnitProgress(MK, 1);
        const content1 = store.getUnitContent(MK, 1);
        A.ok('四步完成但测验未过 → 未通关', store.isUnitComplete(prog1, content1) === false);
        A.ok('四步完成但测验未过 → completedUnits 不含该单元',
            !(store.getSkillProgress(MK).completedUnits || []).includes(1));

        // ---------- 4. 测验：60% 通过线 + 累计 ----------
        const total = quiz1.length;
        const failResults = quiz1.map((q, i) => ({ index: i, correct: i < Math.floor(total * 0.6) - 1 }));
        const r1 = store.saveQuizResult(MK, 1, failResults);
        A.ok(`明显不足 60% → 不通过（${failResults.filter(r => r.correct).length}/${total}）`, r1.passed === false);
        const passResults = quiz1.map((q, i) => ({ index: i, correct: true }));
        const r2 = store.saveQuizResult(MK, 1, passResults);
        A.ok('全对 → 通过', r2.passed === true);
        A.eq('best 记录最好成绩', r2.bestCorrect, total);
        A.eq('attempts 累计', r2.attempts, 2);
        A.ok('测验通过后单元通关', store.isUnitComplete(store.getUnitProgress(MK, 1), content1) === true);
        A.eq('完整通关 1 单元修为 65', store.getXp(), 65);

        // 错题入队：再答一次全错，应入队 total 项
        // （注意：单元通关还会自动入队 1 个「概念卡回炉」项 store.js:664，故按技能+单元+类型过滤断言）
        store.saveQuizResult(MK, 2, C[`${MK}:2`].quiz.map((q, i) => ({ index: i, correct: false })));
        const unit2Queued = store.getReviewItems().filter(i => i.skillId === MK && i.unitNumber === 2 && i.kind === 'quiz');
        A.eq('答错的题全部入回炉队列', unit2Queued.length, C[`${MK}:2`].quiz.length);

        // ---------- 5. 间隔重复：进阶 / 掌握 / 退回 / 即时练习 ----------
        const item = store.getReviewItems().find(i => i.skillId === MK && i.unitNumber === 2 && i.kind === 'quiz' && (i.stage || 0) === 0);
        A.ok('取到一个 stage=0 的队列项用于进阶测试', !!item);
        const due0 = item.dueAt;
        store.recordReview(item.id, true, { fromReview: true });
        A.eq('答对进阶一档', store.getReviewItems().find(i => i.id === item.id).stage, 1);
        A.ok('答对后到期时间后移', store.getReviewItems().find(i => i.id === item.id).dueAt > due0);

        // 即时练习：不动档位与到期时间（B5）
        const before = store.getReviewItems().find(i => i.id === item.id);
        const dailyBefore = store.getDailyStats().review;
        store.recordReview(item.id, true, { fromReview: true, instant: true });
        const after = store.getReviewItems().find(i => i.id === item.id);
        A.eq('即时练习不改档位', after.stage, before.stage);
        A.eq('即时练习不改到期时间', after.dueAt, before.dueAt);
        A.eq('即时练习计入每日回炉统计', store.getDailyStats().review, dailyBefore + 1);

        store.recordReview(item.id, false, { fromReview: true });
        A.eq('答错退回第一档（不惩罚不清零）', store.getReviewItems().find(i => i.id === item.id).stage, 0);

        // 连答对直至移出
        let guard = 0;
        while (store.getReviewItems().find(i => i.id === item.id) && guard++ < 10) {
            store.recordReview(item.id, true, { fromReview: true });
        }
        A.ok('答满档位移出队列（彻底掌握）', !store.getReviewItems().find(i => i.id === item.id));
        A.ok('掌握计数 +1', store.getReviewStats().mastered >= 1);

        // ---------- 6. 每日任务：同日稳定 + 回炉任务过滤（B4）----------
        const q1 = store.getDailyQuests().items.map(i => i.id).join(',');
        const q2 = store.getDailyQuests().items.map(i => i.id).join(',');
        A.eq('同日任务抽样稳定（幂等）', q1, q2);
        A.ok('队列非空时可含回炉任务（本场景队列有题，不断言必含，仅断言不死锁）',
            store.getDailyQuests().items.every(i => i.id !== 'review3' || store.getReviewItems().length > 0));

        const fresh = boot();
        const fq = fresh.store.getDailyQuests();
        A.eq('全新用户（队列空）任务不含回炉项', fq.items.some(i => i.id === 'review3'), false);
        A.eq('全新用户任务数为 3', fq.items.length, 3);

        // ---------- 7. 印记 ----------
        const badges = store.getBadges();
        A.ok('印记定义非空', badges.length >= 10);
        A.ok('完成过步骤 → 「启程」已解锁', badges.find(b => b.id === 'first_step').unlocked === true);
        const before2 = store.getBadges().filter(b => b.unlocked).length;
        store.syncBadges();
        A.eq('syncBadges 幂等（不重复解锁）', store.getBadges().filter(b => b.unlocked).length, before2);

        // ---------- 8. 补签 ----------
        A.ok('初始补签卡 ≥ 1（周赠）', store.getStreakFreeze() >= 1);

        // ---------- 9. 导出 / 导入往返 ----------
        const json = store.exportDataJSON();
        const parsed = JSON.parse(json);
        A.ok('导出包含版本号', !!parsed.version);
        A.ok('导出数据含五艺进度', !!parsed.data.skills_progress);
        A.ok('导出含 _knownKeys 全量键（缺失以 null 占位）', Object.keys(parsed.data).length >= 15);

        const fresh2 = boot();
        A.ok('导入返回成功', fresh2.store.importDataJSON(json) === true);
        A.eq('导入后修为一致', fresh2.store.getXp(), store.getXp());
        A.eq('导入后通关单元一致',
            (fresh2.store.getSkillProgress(MK).completedUnits || []).length,
            (store.getSkillProgress(MK).completedUnits || []).length);
        // null 占位不污染：全新实例导入老数据后，未设置的键读默认值而非 null
        const fresh3 = boot();
        fresh3.store.importDataJSON(JSON.stringify({ app: 'CiKe (此刻)', version: '1.3.3', data: { badges: null, records: [] } }));
        A.ok('导入 null 占位不落库（getBadges 正常）', Array.isArray(fresh3.store.getBadges()));

        // ---------- 10. Markdown 导出五步口径 ----------
        const md = store.exportMarkdownSummary();
        A.ok('MD 含修为总览', md.includes('修为'));
        A.ok('MD 含五艺段落', md.includes('五艺'));
        A.ok('MD 单元行含步数口径', /\d+\/\d+ 步/.test(md));

        // ---------- 11. 版本号单源（B6）----------
        A.eq('window.CIKE_VERSION 已定义且为 1.3.3', window.CIKE_VERSION, '1.3.3');
        A.eq('导出 JSON 版本与 CIKE_VERSION 一致', parsed.version, window.CIKE_VERSION);

        return A.summary();
    }
};
