/**
 * 「此刻」(CiKe) 数据持久化与数据中心
 * 使用 localStorage 存储，所有键以 cike_ 为前缀
 * 提供记录、目标、四象限计划、五艺修炼、专注时段、备份导入导出的完整支持
 */

window.CiKeStore = (function() {
    const PREFIX = 'cike_';

    // ========== 工具方法 ==========

    /** 生成唯一 ID */
    function generateId() {
        return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }

    /** 获取今天的日期字符串（统一格式） */
    function getTodayStr() {
        return new Date().toLocaleDateString('zh-CN');
    }

    /** 从 localStorage 读取 */
    function get(key, defaultValue) {
        try {
            const val = localStorage.getItem(PREFIX + key);
            return val ? JSON.parse(val) : (defaultValue !== undefined ? defaultValue : null);
        } catch (e) {
            console.error(`[Store] 读取 ${key} 失败:`, e);
            return defaultValue !== undefined ? defaultValue : null;
        }
    }

    /** 写入 localStorage */
    function set(key, value) {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch (e) {
            console.error(`[Store] 写入 ${key} 失败:`, e);
        }
    }

    return {
        generateId,
        getTodayStr,

        // ==========================================
        // ⚙️ 设置与偏好 Settings
        // ==========================================
        getSettings() {
            return get('settings', {
                theme: 'paper', // 'paper' (米白纸张) 或 'dark' (深色)
                whiteNoiseDefault: 'none',
                vibration: true
            });
        },
        saveSettings(newSettings) {
            const current = this.getSettings();
            const updated = { ...current, ...newSettings };
            set('settings', updated);
            this.applyTheme(updated.theme);
            return updated;
        },
        applyTheme(theme) {
            if (theme === 'dark') {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        },

        // ==========================================
        // 📝 记录 Records
        // {id, type:'thought'|'action'|'confusion'|'reflection', content, mood, sourceModule, sourceRef, createdAt}
        // ==========================================
        getRecords() {
            return get('records', []);
        },
        addRecord(record) {
            const records = this.getRecords();
            const newRecord = { ...record, id: generateId(), createdAt: Date.now() };
            records.unshift(newRecord); // 新记录在前
            set('records', records);
            return newRecord;
        },
        saveRecord(record) {
            return this.addRecord(record);
        },
        updateRecord(id, content, mood) {
            const records = this.getRecords();
            const idx = records.findIndex(r => r.id === id);
            if (idx !== -1) {
                records[idx].content = content;
                if (mood) records[idx].mood = mood;
                records[idx].updatedAt = Date.now();
                set('records', records);
                return records[idx];
            }
            return null;
        },
        deleteRecord(id) {
            const records = this.getRecords().filter(r => r.id !== id);
            set('records', records);
        },
        getRecentRecords(limit = 10) {
            return this.getRecords().slice(0, limit);
        },

        // ==========================================
        // ⭐ 北极星目标 Goals（最多3个）
        // {id, title, why, createdAt, entries:[{id, content, createdAt}]}
        // ==========================================
        getGoals() {
            return get('goals', []);
        },
        getGoal(id) {
            return this.getGoals().find(g => g.id === id) || null;
        },
        addGoal(goal) {
            const goals = this.getGoals();
            if (goals.length >= 3) {
                throw new Error('最多只能设立 3 个北极星目标');
            }
            const newGoal = { ...goal, id: generateId(), createdAt: Date.now(), entries: [] };
            goals.push(newGoal);
            set('goals', goals);
            return newGoal;
        },
        getActiveGoals() {
            return this.getGoals();
        },
        addGoalEntry(goalId, content) {
            const goals = this.getGoals();
            const goal = goals.find(g => g.id === goalId);
            if (goal) {
                if (!goal.entries) goal.entries = [];
                const entry = { id: generateId(), content, createdAt: Date.now() };
                goal.entries.unshift(entry);
                set('goals', goals);

                // 自动同步到「镜」记录
                this.addRecord({
                    type: 'action',
                    content: `【🧭 目标方向日记 · ${goal.title}】\n${content}`,
                    sourceModule: 'direction',
                    sourceRef: goalId
                });

                return entry;
            }
            return null;
        },
        deleteGoal(id) {
            const goals = this.getGoals().filter(g => g.id !== id);
            set('goals', goals);
        },

        // ==========================================
        // 🗺️ 目标蓝图 · 阶段拆解（大目标 → 阶段 → 本周聚焦 → 今日一事）
        // milestone: {id, text, done, focusOfWeek, createdAt, completedAt}
        // ==========================================
        getGoalMilestones(goalId) {
            const g = this.getGoal(goalId);
            return (g && g.milestones) || [];
        },
        addGoalMilestone(goalId, text) {
            const goals = this.getGoals();
            const g = goals.find(x => x.id === goalId);
            if (!g || !text || !text.trim()) return null;
            if (!g.milestones) g.milestones = [];
            const ms = {
                id: generateId(),
                text: text.trim(),
                done: false,
                focusOfWeek: false,
                createdAt: Date.now(),
                completedAt: null
            };
            g.milestones.push(ms);
            set('goals', goals);
            return ms;
        },
        toggleGoalMilestone(goalId, milestoneId) {
            const goals = this.getGoals();
            const g = goals.find(x => x.id === goalId);
            const ms = g && (g.milestones || []).find(m => m.id === milestoneId);
            if (!ms) return null;
            ms.done = !ms.done;
            ms.completedAt = ms.done ? Date.now() : null;
            set('goals', goals);
            return ms;
        },
        deleteGoalMilestone(goalId, milestoneId) {
            const goals = this.getGoals();
            const g = goals.find(x => x.id === goalId);
            if (!g || !g.milestones) return;
            g.milestones = g.milestones.filter(m => m.id !== milestoneId);
            set('goals', goals);
        },
        /** 设为「本周聚焦」（全局唯一） */
        setMilestoneAsWeeklyFocus(goalId, milestoneId) {
            const goals = this.getGoals();
            const target = goals.find(x => x.id === goalId);
            const ms = target && (target.milestones || []).find(m => m.id === milestoneId);
            if (!ms) return null;

            goals.forEach(g => (g.milestones || []).forEach(m => { m.focusOfWeek = false; }));
            const fresh = goals.find(x => x.id === goalId).milestones.find(m => m.id === milestoneId);
            fresh.focusOfWeek = true;
            set('goals', goals);
            return fresh;
        },
        /** 读取当前「本周聚焦」 */
        getWeeklyFocus() {
            for (const g of this.getGoals()) {
                const ms = (g.milestones || []).find(m => m.focusOfWeek);
                if (ms) return { goal: g, milestone: ms };
            }
            return null;
        },
        /** 把「本周聚焦」的点直接设为今日一事 */
        setWeeklyFocusAsTodayFocus() {
            const wf = this.getWeeklyFocus();
            if (!wf) return null;
            return this.setTodayFocus({
                task: wf.milestone.text,
                source: 'goal',
                sourceRef: wf.goal.id
            });
        },

        // ==========================================
        // 📐 图 · 计划 (Plan / Eisenhower Quadrants)
        // {id, text, quadrant: 1|2|3|4, completed: false, createdAt}
        // Q1: 重要且紧急 | Q2: 重要不紧急(核心) | Q3: 紧急不重要 | Q4: 不紧急不重要
        // ==========================================
        getPlanTasks() {
            return get('plan_tasks', []);
        },
        addPlanTask(taskData) {
            const tasks = this.getPlanTasks();
            const newTask = {
                id: generateId(),
                text: taskData.text,
                quadrant: parseInt(taskData.quadrant, 10) || 2, // 默认第二象限
                goalId: taskData.goalId || null, // 可挂载到北极星目标（可选）
                completed: false,
                createdAt: Date.now()
            };
            tasks.unshift(newTask);
            set('plan_tasks', tasks);
            return newTask;
        },
        /** 某个北极星目标关联的计划任务 */
        getGoalPlanTasks(goalId) {
            return this.getPlanTasks().filter(t => t.goalId === goalId);
        },
        togglePlanTask(id) {
            const tasks = this.getPlanTasks();
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                set('plan_tasks', tasks);
                return task;
            }
            return null;
        },
        deletePlanTask(id) {
            const tasks = this.getPlanTasks().filter(t => t.id !== id);
            set('plan_tasks', tasks);
        },
        setPlanTaskAsTodayFocus(taskId) {
            const task = this.getPlanTasks().find(t => t.id === taskId);
            if (task) {
                return this.setTodayFocus({ task: task.text, source: 'plan', sourceRef: task.id });
            }
            return null;
        },

        // ==========================================
        // ✅ 签到 Checkins（晨间/晚间）
        // ==========================================
        getCheckins() {
            return get('checkins', []);
        },
        addCheckin(checkin) {
            const checkins = this.getCheckins();
            const newCheckin = {
                ...checkin,
                id: generateId(),
                date: checkin.date || getTodayStr(),
                createdAt: Date.now()
            };
            checkins.push(newCheckin);
            set('checkins', checkins);
            return newCheckin;
        },
        saveCheckin(checkin) {
            return this.addCheckin(checkin);
        },
        getTodayCheckin(type) {
            const today = getTodayStr();
            return this.getCheckins().find(c => c.type === type && c.date === today);
        },

        // ==========================================
        // 🎯 今日专注 Today Focus
        // ==========================================
        getTodayFocus() {
            const today = getTodayStr();
            const focus = get('today_focus', null);
            if (focus && focus.date === today) {
                return focus;
            }
            return null;
        },
        setTodayFocus(focusData) {
            const isObj = focusData && typeof focusData === 'object';
            const task = typeof focusData === 'string' ? focusData : (isObj ? focusData.task : '');
            const focus = {
                id: generateId(),
                task: task || '自由专注',
                date: getTodayStr(),
                completed: false,
                // 来源标注：manual(炬页手写) | morning(晨间三问) | plan(计划看板) | skills(五艺修炼) | goal(北极星蓝图)
                source: (isObj && focusData.source) || this.getTodayFocusSource(task, focusData) || 'manual',
                sourceRef: (isObj && focusData.sourceRef) || null
            };
            set('today_focus', focus);
            return focus;
        },
        /** 未显式传 source 时，尝试从晨间三问推断来源（保证向后兼容） */
        getTodayFocusSource(task) {
            if (!task) return 'manual';
            const m = this.getTodayCheckin('morning');
            if (m && m.answers && m.answers.topTask === task) return 'morning';
            return 'manual';
        },
        completeTodayFocus() {
            const focus = this.getTodayFocus();
            if (focus) {
                focus.completed = true;
                set('today_focus', focus);
            }
        },
        /** 清除今日一事（用于"换一件事"） */
        clearTodayFocus() {
            set('today_focus', null);
        },

        // ==========================================
        // 🌱 日循环与连续性 Daily Loop & Streak
        // 产品的核心是一条日循环：晨间三问 → 一次专注 → 晚间回顾 → 周期性看见模式
        // ==========================================
        /**
         * 今日日循环三环状态
         * @returns {{steps:Array, doneCount:number, total:number, allDone:boolean, morning:boolean, focus:boolean, evening:boolean}}
         */
        getDailyLoop() {
            const morning = !!this.getTodayCheckin('morning');
            const evening = !!this.getTodayCheckin('evening');
            const todayStr = new Date().toDateString();
            const hasFocusSession = this.getFocusSessions()
                .some(s => new Date(s.completedAt).toDateString() === todayStr);
            const focus = hasFocusSession || !!(this.getTodayFocus() && this.getTodayFocus().completed);

            const steps = [
                { key: 'morning', label: '晨间三问', route: 'morning-checkin', done: morning },
                { key: 'focus', label: '一次专注', route: 'focus', done: focus },
                { key: 'evening', label: '晚间回顾', route: 'evening-reflection', done: evening }
            ];
            const doneCount = steps.filter(s => s.done).length;
            return {
                steps,
                doneCount,
                total: steps.length,
                allDone: doneCount === steps.length,
                morning,
                focus,
                evening
            };
        },
        /** 汇总所有有"实质行为"的日期集合（记录 / 签到 / 专注） */
        getActivityDates() {
            const set = new Set();
            const add = ts => { if (ts) set.add(new Date(ts).toDateString()); };
            this.getRecords().forEach(r => add(r.createdAt));
            this.getCheckins().forEach(c => add(c.createdAt));
            this.getFocusSessions().forEach(s => add(s.completedAt));
            return set;
        },
        /**
         * 连续修炼天数
         * 定义：连续 "有实质行为" 的天数。今天还没开始也不会清零——从昨天往前回溯。
         * @returns {{days:number, todayActive:boolean}}
         */
        getStreak() {
            const active = this.getActivityDates();
            const today = new Date();
            const todayKey = today.toDateString();
            const yesterdayKey = new Date(today.getTime() - 86400000).toDateString();

            let cursor;
            if (active.has(todayKey)) {
                cursor = today;
            } else if (active.has(yesterdayKey)) {
                cursor = new Date(today.getTime() - 86400000);
            } else {
                return { days: 0, todayActive: false };
            }

            let days = 0;
            while (active.has(cursor.toDateString())) {
                days++;
                cursor = new Date(cursor.getTime() - 86400000);
            }
            return { days, todayActive: active.has(todayKey) };
        },

        // ==========================================
        // 🔥 专注记录 Focus Sessions
        // {id, task, duration, mood, reflection, completedAt}
        // ==========================================
        getFocusSessions() {
            return get('focus_sessions', []);
        },
        addFocusSession(session) {
            const sessions = this.getFocusSessions();
            const newSession = { ...session, id: generateId(), completedAt: Date.now() };
            sessions.unshift(newSession); // 新的在前
            set('focus_sessions', sessions);

            // 如果带有反思，自动沉淀至「镜」
            if (session.reflection && session.reflection.trim()) {
                const durationMinutes = Math.floor(session.duration / 60);
                this.addRecord({
                    type: 'action',
                    content: `【🔥 专注完成 · ${session.task} (${durationMinutes}分钟)】\n${session.reflection}`,
                    mood: session.mood || '🙂',
                    sourceModule: 'focus',
                    sourceRef: newSession.id
                });
            }

            return newSession;
        },
        /** 走神便签：专注时不中断计时，快速记录闪现的杂念 */
        addDistractionNote(noteText, currentTask = '') {
            return this.addRecord({
                type: 'thought',
                content: `【⚡ 专注防走神速记 · ${currentTask}】\n${noteText}`,
                mood: '😐',
                sourceModule: 'focus_distraction'
            });
        },
        /** 获取过去7天每日专注分钟数统计 */
        getLast7DaysFocusStats() {
            const sessions = this.getFocusSessions();
            const result = [];
            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toDateString();
                const label = i === 0 ? '今天' : dayNames[d.getDay()];

                const daySessions = sessions.filter(s => new Date(s.completedAt).toDateString() === dateStr);
                const totalSeconds = daySessions.reduce((sum, s) => sum + s.duration, 0);
                const minutes = Math.round(totalSeconds / 60);

                result.push({
                    date: dateStr,
                    label,
                    minutes
                });
            }
            return result;
        },

        // ==========================================
        // 🍅 番茄时钟 Pomodoro
        // 设置项：专注时长 / 短休 / 长休 / 几轮后长休
        // ==========================================
        getPomodoroSettings() {
            const s = this.getSettings();
            const p = s.pomodoro || {};
            return {
                workMinutes: p.workMinutes || 25,
                shortBreak: p.shortBreak || 5,
                longBreak: p.longBreak || 15,
                roundsBeforeLongBreak: p.roundsBeforeLongBreak || 4
            };
        },
        savePomodoroSettings(patch) {
            const current = this.getPomodoroSettings();
            const merged = { ...current, ...patch };
            this.saveSettings({ pomodoro: merged });
            return merged;
        },
        /** 判断某个专注会话是否属于番茄钟 */
        _isPomodoroSession(s) {
            return !!(s && s.isPomodoro);
        },
        /** 今日完成的番茄数 */
        getTodayPomodoroCount() {
            const todayStr = new Date().toDateString();
            return this.getFocusSessions().filter(s =>
                this._isPomodoroSession(s) && new Date(s.completedAt).toDateString() === todayStr
            ).length;
        },
        /** 番茄钟总览统计 */
        getPomodoroStats() {
            const sessions = this.getFocusSessions().filter(s => this._isPomodoroSession(s));
            const todayStr = new Date().toDateString();
            const todayList = sessions.filter(s => new Date(s.completedAt).toDateString() === todayStr);
            const sum = list => Math.round(list.reduce((t, s) => t + s.duration, 0) / 60);
            const cfg = this.getPomodoroSettings();

            return {
                todayCount: todayList.length,
                todayMinutes: sum(todayList),
                totalCount: sessions.length,
                totalMinutes: sum(sessions),
                // 当前循环内已完成数（用于展示 4 个番茄一轮的进度点）
                roundInCycle: todayList.length % cfg.roundsBeforeLongBreak,
                roundsBeforeLongBreak: cfg.roundsBeforeLongBreak
            };
        },
        /**
         * 为已完成的专注会话补充心情与反思（番茄钟每轮自动落库后使用）
         * 附带的反思会同步沉淀到「🪞 镜」
         */
        updateFocusSessionReflection(sessionId, reflection, mood) {
            const sessions = this.getFocusSessions();
            const session = sessions.find(s => s.id === sessionId);
            if (!session) return null;

            if (reflection && reflection.trim()) session.reflection = reflection.trim();
            if (mood) session.mood = mood;
            set('focus_sessions', sessions);

            if (reflection && reflection.trim()) {
                const mins = Math.round(session.duration / 60);
                this.addRecord({
                    type: 'action',
                    content: `【🍅 番茄专注复盘 · ${session.task} (${mins}分钟)】\n${reflection.trim()}`,
                    mood: mood || '🙂',
                    sourceModule: 'focus',
                    sourceRef: session.id
                });
            }
            return session;
        },

        // ==========================================
        // 🏛️ 修 · 五艺底层技能进度
        // ==========================================
        getSkillsProgress() {
            return get('skills_progress', {});
        },
        getSkillProgress(skillId) {
            const all = this.getSkillsProgress();
            return all[skillId] || {
                currentUnit: 1,
                completedUnits: [],
                units: {}
            };
        },
        getUnitProgress(skillId, unitNumber) {
            const skillProg = this.getSkillProgress(skillId);
            return (skillProg.units && skillProg.units[unitNumber]) || {
                know: false,
                observe: false,
                practice: false,
                reflect: false,
                reflectionText: '',
                mood: ''
            };
        },
        /**
         * 修炼等级换算
         * 「精通」不是"做完了"，而是通关全部单元并通过结业检验（verified=true）
         */
        calculateLevel(completedCount, totalCount, verified = false) {
            if (completedCount === 0) return '初心';
            const ratio = completedCount / totalCount;
            if (ratio >= 1) return verified ? '精通' : '通达';
            if (ratio >= 0.7) return '通达';
            if (ratio >= 0.4) return '进阶';
            return '入门';
        },
        isSkillUnlocked(skillId) {
            const skills = window.CiKeSkillsData || [];
            const skill = skills.find(s => s.id === skillId);
            if (!skill || !skill.unlockCondition) return true;

            const cond = skill.unlockCondition;
            const prereqProgress = this.getSkillProgress(cond.skillId);
            return (prereqProgress.completedUnits || []).includes(cond.unitNumber);
        },
        completeSkillStep(skillId, unitNumber, stepType, extraData = {}) {
            const all = this.getSkillsProgress();
            if (!all[skillId]) {
                all[skillId] = {
                    currentUnit: 1,
                    completedUnits: [],
                    units: {}
                };
            }
            const skillProg = all[skillId];
            if (!skillProg.units[unitNumber]) {
                skillProg.units[unitNumber] = {
                    know: false,
                    observe: false,
                    practice: false,
                    reflect: false,
                    reflectionText: '',
                    mood: ''
                };
            }

            const unitProg = skillProg.units[unitNumber];
            unitProg[stepType] = true;

            if (stepType === 'reflect' && extraData.reflectionText) {
                unitProg.reflectionText = extraData.reflectionText;
                unitProg.mood = extraData.mood || '🙂';

                // 自动同步到「🪞 镜 · 记录」时间线中
                const skills = window.CiKeSkillsData || [];
                const skill = skills.find(s => s.id === skillId);
                const skillTitle = skill ? skill.title : '五艺';
                
                this.addRecord({
                    type: 'thought',
                    content: `【🏛️ ${skillTitle} · 单元 ${unitNumber} 反思】\n${extraData.reflectionText}`,
                    mood: extraData.mood || '🙂',
                    sourceModule: 'skills',
                    sourceRef: `${skillId}:${unitNumber}`
                });
            }

            // 检查单元是否4步全完成
            if (unitProg.know && unitProg.observe && unitProg.practice && unitProg.reflect) {
                if (!skillProg.completedUnits.includes(unitNumber)) {
                    skillProg.completedUnits.push(unitNumber);
                }
                if (skillProg.currentUnit <= unitNumber) {
                    skillProg.currentUnit = unitNumber + 1;
                }
            }

            set('skills_progress', all);
            return unitProg;
        },
        getActiveSkillUnit() {
            const skills = window.CiKeSkillsData || [];
            if (!skills.length) return null;

            for (const skill of skills) {
                if (this.isSkillUnlocked(skill.id)) {
                    const prog = this.getSkillProgress(skill.id);
                    const currentUnitNum = prog.currentUnit || 1;
                    const unit = skill.units.find(u => u.unitNumber === currentUnitNum);
                    if (unit && !(prog.completedUnits || []).includes(currentUnitNum)) {
                        const unitProg = this.getUnitProgress(skill.id, currentUnitNum);
                        return { skill, unit, unitProg };
                    }
                }
            }

            const firstSkill = skills[0];
            return {
                skill: firstSkill,
                unit: firstSkill.units[0],
                unitProg: this.getUnitProgress(firstSkill.id, 1)
            };
        },

        // ==========================================
        // 🏆 结业检验 · 精通认定 Verifications
        // {verifiedAt, evidence, verified}
        // ==========================================
        getVerifications() {
            return get('verifications', {});
        },
        getVerification(skillId) {
            return this.getVerifications()[skillId] || null;
        },
        /**
         * 提交结业检验，认定「精通」
         * 通过后自动同步一条记录到「🪞 镜」，作为成长里程碑
         */
        saveVerification(skillId, data = {}) {
            const all = this.getVerifications();
            const isFirstTime = !all[skillId];
            all[skillId] = {
                ...(all[skillId] || {}),
                evidence: data.evidence || '',
                verified: true,
                verifiedAt: Date.now()
            };
            set('verifications', all);

            if (isFirstTime) {
                const skills = window.CiKeSkillsData || [];
                const skill = skills.find(s => s.id === skillId);
                const skillTitle = skill ? skill.title : '五艺';
                const icon = skill ? skill.icon : '🏛️';
                this.addRecord({
                    type: 'action',
                    content: `【🏆 结业检验通过 · ${skillTitle}】\n依据检验标准「${skill ? skill.verificationStandard : ''}」，我完成了检验关挑战：\n${data.evidence || ''}`,
                    mood: '🔥',
                    sourceModule: 'skills_verification',
                    sourceRef: skillId
                });
            }

            return all[skillId];
        },
        /** 是否已认定精通：通关全部单元 + 通过结业检验 */
        isSkillMastered(skillId) {
            const skills = window.CiKeSkillsData || [];
            const skill = skills.find(s => s.id === skillId);
            if (!skill) return false;
            const prog = this.getSkillProgress(skillId);
            const allUnitsDone = (prog.completedUnits || []).length >= skill.units.length;
            return allUnitsDone && !!this.getVerification(skillId);
        },

        // ==========================================
        // 🔍 自省洞察引擎 Insight Engine
        // 本地规则引擎：只帮用户"看见"模式，不给建议、不做评判
        // 输出结构对齐技术架构文档《AI 自省报告》数据契约，未来可无缝替换为云端 LLM
        // ==========================================

        // 主题词索引（用于模式识别）
        _insightThemes: {
            '职业方向': ['职业', '工作', '事业', '方向', '转行', '跳槽', '行业', '岗位', '创业', '项目'],
            '时间管理': ['时间', '忙', '计划', '拖延', '效率', '安排', 'deadline', '来不及'],
            '学习成长': ['学习', '知识', '技能', '读书', '课程', '成长', '提升', '修炼', '练习'],
            '情绪状态': ['焦虑', '情绪', '压力', '烦', '累', '开心', '难过', '平静', '迷茫', '内耗'],
            '人际关系': ['朋友', '家人', '同事', '关系', '沟通', '社交', '父母', '孩子', '伴侣'],
            '金钱财务': ['钱', '收入', '支出', '存钱', '投资', '财务', '预算', '花销'],
            '身心健康': ['健康', '运动', '睡眠', '锻炼', '身体', '作息', '跑步', '休息']
        },

        // 情绪表情 → 语义（用于趋势描述）
        _insightMoodMap: {
            '😤': { label: '烦躁', tone: -2 },
            '😐': { label: '平静', tone: 0 },
            '🙂': { label: '平稳', tone: 1 },
            '😊': { label: '愉悦', tone: 2 },
            '🔥': { label: '高能', tone: 2 }
        },

        /** 抽取指定时间窗内的原始数据（offsetDays 用于取上一周期做对比） */
        _gatherPeriodData(days, offsetDays = 0) {
            const end = Date.now() - offsetDays * 86400000;
            const start = end - days * 86400000;
            const inRange = ts => ts >= start && ts < end;
            return {
                start,
                end,
                records: this.getRecords().filter(r => inRange(r.createdAt)),
                checkins: this.getCheckins().filter(c => inRange(c.createdAt)),
                sessions: this.getFocusSessions().filter(s => inRange(s.completedAt))
            };
        },

        /**
         * 生成自省报告
         * @param {'week'|'month'} period
         * @returns 对齐架构文档契约的结构化洞察
         */
        generateInsightReport(period = 'week') {
            const days = period === 'month' ? 30 : 7;
            const curData = this._gatherPeriodData(days, 0);
            const prevData = this._gatherPeriodData(days, days);

            const fmt = ts => {
                const d = new Date(ts);
                return `${d.getMonth() + 1}月${d.getDate()}日`;
            };
            const periodLabel = `${fmt(curData.start)} ~ ${fmt(curData.end - 1)}`;

            const records = curData.records;
            const sessions = curData.sessions;

            // ---- 1. 主题识别 ----
            const themeCounts = [];
            Object.keys(this._insightThemes).forEach(name => {
                const kws = this._insightThemes[name];
                let count = 0;
                const hits = [];
                records.forEach(r => {
                    const text = r.content || '';
                    if (kws.some(k => text.includes(k))) {
                        count++;
                        hits.push(r);
                    }
                });
                if (count > 0) themeCounts.push({ name, count, hits });
            });
            themeCounts.sort((a, b) => b.count - a.count);

            // ---- 2. 情绪趋势 ----
            const moodCounts = {};
            const moodByDay = {};
            records.forEach(r => {
                if (!r.mood) return;
                moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
                const day = new Date(r.createdAt).toDateString();
                if (!moodByDay[day]) moodByDay[day] = {};
                moodByDay[day][r.mood] = (moodByDay[day][r.mood] || 0) + 1;
            });

            let topMood = null;
            let topMoodCount = 0;
            Object.keys(moodCounts).forEach(m => {
                if (moodCounts[m] > topMoodCount) {
                    topMood = m;
                    topMoodCount = moodCounts[m];
                }
            });

            // 找出情绪最沉与最有能量的一天
            let lowDay = null, lowScore = Infinity;
            let highDay = null, highScore = -Infinity;
            Object.keys(moodByDay).forEach(day => {
                let score = 0, total = 0;
                Object.keys(moodByDay[day]).forEach(m => {
                    const meta = this._insightMoodMap[m];
                    score += (meta ? meta.tone : 0) * moodByDay[day][m];
                    total += moodByDay[day][m];
                });
                const avg = total > 0 ? score / total : 0;
                if (avg < lowScore) { lowScore = avg; lowDay = day; }
                if (avg > highScore) { highScore = avg; highDay = day; }
            });
            const dayLabel = dayStr => {
                const d = new Date(dayStr);
                const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                return `${d.getMonth() + 1}月${d.getDate()}日 ${names[d.getDay()]}`;
            };

            // ---- 3. 专注统计 ----
            const focusMinutes = Math.round(sessions.reduce((s, x) => s + x.duration, 0) / 60);
            const prevFocusMinutes = Math.round(prevData.sessions.reduce((s, x) => s + x.duration, 0) / 60);

            // 专注序列：本周按天，本月按周聚合
            const focusSeries = [];
            if (period === 'week') {
                const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const ds = d.toDateString();
                    const mins = Math.round(sessions.filter(s => new Date(s.completedAt).toDateString() === ds)
                        .reduce((sum, s) => sum + s.duration, 0) / 60);
                    focusSeries.push({ label: i === 0 ? '今天' : dayNames[d.getDay()], minutes: mins });
                }
            } else {
                for (let w = 3; w >= 0; w--) {
                    const end = Date.now() - w * 7 * 86400000;
                    const start = end - 7 * 86400000;
                    const mins = Math.round(sessions.filter(s => s.completedAt >= start && s.completedAt < end)
                        .reduce((sum, s) => sum + s.duration, 0) / 60);
                    focusSeries.push({ label: w === 0 ? '本周' : `前${w}周`, minutes: mins });
                }
            }

            // ---- 4. 修炼投入 ----
            const skillReflections = records.filter(r => r.sourceModule === 'skills');
            const skillTally = {};
            skillReflections.forEach(r => {
                const sid = (r.sourceRef || '').split(':')[0];
                if (sid) skillTally[sid] = (skillTally[sid] || 0) + 1;
            });
            const skills = window.CiKeSkillsData || [];
            let topSkill = null, topSkillCount = 0;
            Object.keys(skillTally).forEach(sid => {
                if (skillTally[sid] > topSkillCount) { topSkillCount = skillTally[sid]; topSkill = sid; }
            });

            // ---- 5. 签到 ----
            const morningCount = curData.checkins.filter(c => c.type === 'morning').length;
            const eveningCount = curData.checkins.filter(c => c.type === 'evening').length;

            // ---- 组装 patterns（只陈述观察，不给建议）----
            const patterns = [];
            const prevCount = prevData.records.length;
            if (records.length > 0) {
                let base = `这${period === 'month' ? '个月' : '周'}你写下了 ${records.length} 条记录`;
                if (prevCount > 0) {
                    const diff = records.length - prevCount;
                    if (diff > 0) base += `，比上${period === 'month' ? '个' : ''}周期多了 ${diff} 条`;
                    else if (diff < 0) base += `，比上${period === 'month' ? '个' : ''}周期少了 ${Math.abs(diff)} 条`;
                    else base += `，与上${period === 'month' ? '个' : ''}周期持平`;
                }
                patterns.push(base + '。');
            }
            if (themeCounts.length > 0) {
                const t = themeCounts[0];
                patterns.push(`其中 ${t.count} 条和「${t.name}」相关——看起来这是你近期最在意的部分。`);
                if (themeCounts[1] && themeCounts[1].count >= 2) {
                    patterns.push(`「${themeCounts[1].name}」出现了 ${themeCounts[1].count} 次，它是另一条反复浮现的线索。`);
                }
            }
            const confusionCount = records.filter(r => r.type === 'confusion').length;
            if (confusionCount >= 2) {
                patterns.push(`你记录了 ${confusionCount} 次困惑。困惑不是问题，它是思考正在发生的证据。`);
            }
            if (skillReflections.length > 0) {
                const topSkillName = topSkill ? (skills.find(s => s.id === topSkill) || {}).title : '';
                patterns.push(`这一${period === 'month' ? '个月' : '周'}你在五艺里沉淀了 ${skillReflections.length} 次反思${topSkillName ? `，「${topSkillName}」占了 ${topSkillCount} 次` : ''}。`);
            }

            // ---- 情绪趋势描述 ----
            let moodTrend = '';
            if (topMood) {
                moodTrend = `出现最多的心情是 ${topMood}（${this._insightMoodMap[topMood] ? this._insightMoodMap[topMood].label : ''}），共 ${topMoodCount} 次。`;
                if (lowDay && highDay && lowDay !== highDay) {
                    moodTrend += ` ${dayLabel(lowDay)}的气压最低，而${dayLabel(highDay)}是你状态最好的一天——注意到了吗？`;
                }
            } else {
                moodTrend = '这一周期还没有记录心情，下次记录时顺手点一下表情，就能看见情绪起伏的轨迹。';
            }

            // ---- 修炼洞察 ----
            let skillInsight = '';
            const totalDone = skills.reduce((sum, s) => sum + (this.getSkillProgress(s.id).completedUnits || []).length, 0);
            if (skills.length > 0) {
                const active = skills.map(s => ({
                    title: s.title,
                    done: (this.getSkillProgress(s.id).completedUnits || []).length,
                    total: s.units.length
                })).filter(x => x.done > 0);
                if (active.length > 0) {
                    const first = active[0];
                    skillInsight = `五艺上你已累计通关 ${totalDone} 个单元。${first.title}推进到 ${first.done}/${first.total}。`;
                    const untouched = skills.filter(s => (this.getSkillProgress(s.id).completedUnits || []).length === 0 && this.isSkillUnlocked(s.id));
                    if (untouched.length > 0) {
                        skillInsight += ` 而「${untouched[0].title}」还没有开始——是时候了吗？`;
                    }
                } else {
                    skillInsight = '五艺之门已经打开，但还没有迈出第一步。哪一项最贴近你此刻的困境？';
                }
            }

            // ---- 专注总结 ----
            let focusSummary = '';
            if (sessions.length > 0) {
                focusSummary = `这一周期你完成了 ${sessions.length} 次专注，累计 ${focusMinutes} 分钟（约 ${(focusMinutes / 60).toFixed(1)} 小时）。`;
                if (prevFocusMinutes > 0) {
                    const diff = focusMinutes - prevFocusMinutes;
                    if (diff > 0) focusSummary += ` 比上一周期多了 ${diff} 分钟，这份耐心在累积。`;
                    else if (diff < 0) focusSummary += ` 比上一周期少了 ${Math.abs(diff)} 分钟。`;
                }
            } else {
                focusSummary = '这一周期没有专注记录。注意力去哪了？这个问题值得你自己回答。';
            }

            // ---- 引用用户原文（增加共鸣感）----
            let quote = '';
            if (themeCounts.length > 0 && themeCounts[0].hits.length > 0) {
                const src = themeCounts[0].hits[0].content || '';
                const clean = src.replace(/【[^】]*】/g, '').trim().split('\n').filter(l => l.trim())[0] || '';
                quote = clean.length > 60 ? clean.substring(0, 60) + '…' : clean;
            }

            const hasData = records.length > 0 || sessions.length > 0 || curData.checkins.length > 0;

            return {
                period,
                days,
                periodLabel,
                hasData,
                recordCount: records.length,
                prevRecordCount: prevCount,
                focusMinutes,
                prevFocusMinutes,
                focusSessionCount: sessions.length,
                morningCount,
                eveningCount,
                themes: themeCounts.map(t => ({ name: t.name, count: t.count })),
                moodCounts,
                topMood,
                focusSeries,
                skillReflections: skillReflections.length,
                patterns,
                moodTrend,
                skillInsight,
                focusSummary,
                quote
            };
        },

        // ==========================================
        // 💾 数据主权：全量导出与导入
        // ==========================================
        exportDataJSON() {
            const exportData = {
                app: 'CiKe (此刻)',
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                data: {}
            };

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(PREFIX)) {
                    const cleanKey = key.substring(PREFIX.length);
                    exportData.data[cleanKey] = get(cleanKey, null);
                }
            }

            return JSON.stringify(exportData, null, 2);
        },
        exportMarkdownSummary() {
            const records = this.getRecords();
            const goals = this.getGoals();
            const sessions = this.getFocusSessions();

            let md = `# 「此刻」个人成长数据导出\n\n> 导出时间：${new Date().toLocaleString('zh-CN')}\n\n`;

            md += `## 🧭 北极星目标 (${goals.length}/3)\n\n`;
            goals.forEach((g, idx) => {
                md += `### ${idx + 1}. ${g.title}\n`;
                md += `- **为什么重要**：${g.why}\n`;
                md += `- **创建日期**：${new Date(g.createdAt).toLocaleDateString('zh-CN')}\n`;
                if (g.entries && g.entries.length) {
                    md += `- **方向日记**：\n`;
                    g.entries.forEach(e => {
                        md += `  - [${new Date(e.createdAt).toLocaleDateString('zh-CN')}] ${e.content}\n`;
                    });
                }
                md += `\n`;
            });

            md += `## 🪞 镜 · 历练与思考记录 (${records.length}条)\n\n`;
            records.forEach(r => {
                const typeName = r.type === 'thought' ? '💭想法' : (r.type === 'action' ? '⚡行动' : '❓困惑');
                md += `### [${new Date(r.createdAt).toLocaleString('zh-CN')}] ${typeName} ${r.mood || ''}\n`;
                md += `${r.content}\n\n`;
            });

            md += `## 🔥 专注历程 (${sessions.length}次)\n\n`;
            sessions.forEach(s => {
                md += `- **${s.task}**：时长 ${Math.round(s.duration / 60)} 分钟 | ${new Date(s.completedAt).toLocaleString('zh-CN')}\n`;
                if (s.reflection) md += `  > ${s.reflection}\n`;
            });

            // 🏛️ 五艺修炼进度与精通认定
            const skills = window.CiKeSkillsData || [];
            if (skills.length) {
                md += `\n## 🏛️ 五艺修炼进度\n\n`;
                skills.forEach(sk => {
                    const prog = this.getSkillProgress(sk.id);
                    const done = (prog.completedUnits || []).length;
                    const level = this.calculateLevel(done, sk.units.length, this.isSkillMastered(sk.id));
                    md += `### ${sk.icon} ${sk.title} · ${level} (${done}/${sk.units.length} 单元)\n`;
                    md += `- 核心原理：${sk.corePrinciple}\n`;
                    (sk.units || []).forEach(u => {
                        const up = (prog.units && prog.units[u.unitNumber]) || {};
                        const steps = ['know', 'observe', 'practice', 'reflect'].filter(k => up[k]).length;
                        md += `  - 单元${u.unitNumber} ${u.title}：${steps}/4 步\n`;
                        if (up.reflectionText) md += `    > ${up.reflectionText}\n`;
                    });
                    const v = this.getVerification(sk.id);
                    if (v && v.verified) {
                        md += `- 🏆 **已通过结业检验**（${new Date(v.verifiedAt).toLocaleDateString('zh-CN')}）：${v.evidence}\n`;
                    }
                    md += `\n`;
                });
            }

            return md;
        },
        importDataJSON(jsonString) {
            try {
                const parsed = JSON.parse(jsonString);
                if (!parsed || !parsed.data) {
                    throw new Error('无效的备份数据结构');
                }
                Object.keys(parsed.data).forEach(cleanKey => {
                    set(cleanKey, parsed.data[cleanKey]);
                });
                return true;
            } catch (e) {
                console.error('[Store] 导入数据失败:', e);
                return false;
            }
        },

        // ==========================================
        // 🔧 清理全部数据
        // ==========================================
        clearAll() {
            Object.keys(localStorage)
                .filter(key => key.startsWith(PREFIX))
                .forEach(key => localStorage.removeItem(key));
            console.log('[Store] 所有数据已清空');
        }
    };
})();
