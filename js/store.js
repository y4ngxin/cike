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
                completed: false,
                createdAt: Date.now()
            };
            tasks.unshift(newTask);
            set('plan_tasks', tasks);
            return newTask;
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
                return this.setTodayFocus({ task: task.text });
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
            const task = typeof focusData === 'string' ? focusData : (focusData && focusData.task);
            const focus = {
                id: generateId(),
                task: task || '自由专注',
                date: getTodayStr(),
                completed: false
            };
            set('today_focus', focus);
            return focus;
        },
        completeTodayFocus() {
            const focus = this.getTodayFocus();
            if (focus) {
                focus.completed = true;
                set('today_focus', focus);
            }
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
        calculateLevel(completedCount, totalCount) {
            if (completedCount === 0) return '初心';
            const ratio = completedCount / totalCount;
            if (ratio >= 1) return '精通';
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
