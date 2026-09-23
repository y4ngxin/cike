/**
 * 🪞 镜 · 历练与思考记录 (Mirror Page)
 * 支持多维分类筛选、关键词即时搜索、单条编辑与删除
 */

(function() {
    let currentFilter = 'all'; // 'all' | 'thought' | 'action' | 'confusion' | 'skills'
    let currentSearch = '';

    window.CiKeMirror = {
        render: function(container) {
            container = container || document.getElementById('page-mirror');
            if (!container) return;
            
            const store = window.CiKeStore;
            let records = store ? store.getRecords() : [];
            records.sort((a, b) => b.createdAt - a.createdAt);

            // 1. 过滤类型
            if (currentFilter === 'skills') {
                records = records.filter(r => r.sourceModule === 'skills');
            } else if (currentFilter !== 'all') {
                records = records.filter(r => r.type === currentFilter && r.sourceModule !== 'skills');
            }

            // 2. 搜索关键词
            if (currentSearch.trim()) {
                const q = currentSearch.toLowerCase();
                records = records.filter(r => (r.content || '').toLowerCase().includes(q));
            }

            // 按日期分组
            const grouped = {};
            records.forEach(r => {
                const d = new Date(r.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
                if (!grouped[d]) grouped[d] = [];
                grouped[d].push(r);
            });

            const getTypeIcon = (type, sourceModule) => {
                if (sourceModule === 'skills') return '🏛️';
                if (sourceModule === 'direction') return '🧭';
                if (sourceModule === 'focus' || sourceModule === 'focus_distraction') return '🔥';
                switch(type) {
                    case 'thought': return '💭';
                    case 'action': return '⚡';
                    case 'confusion': return '❓';
                    default: return '📝';
                }
            };

            const getTimeString = (ts) => {
                const date = new Date(ts);
                return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            };

            let listHtml = '';
            if (records.length === 0) {
                listHtml = `
                    <div style="text-align: center; padding: 50px 20px; color: #888;">
                        <div style="font-size: 36px; margin-bottom: 12px;">🪞</div>
                        <p style="font-size: 15px; margin-bottom: 4px;">没有符合条件的记录</p>
                        <p style="font-size: 13px;">点击右下角，随心记录下此刻的思绪吧</p>
                    </div>
                `;
            } else {
                for (const [date, recs] of Object.entries(grouped)) {
                    listHtml += `
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 12px; color: #888; margin-bottom: 8px; font-weight: 600; padding-left: 4px;">${date}</div>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${recs.map(r => `
                                    <div class="card record-card-item" data-id="${r.id}" style="margin-bottom: 0; padding: 14px; border-radius: 14px; position: relative;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                            <div style="display: flex; align-items: center; gap: 6px;">
                                                <span style="font-size: 18px;">${getTypeIcon(r.type, r.sourceModule)}</span>
                                                <span style="font-size: 12px; color: #999;">${getTimeString(r.createdAt)}</span>
                                                ${r.mood ? `<span style="font-size: 14px;">${r.mood}</span>` : ''}
                                            </div>
                                            <div style="display: flex; gap: 8px;">
                                                <button class="btn-edit-rec" data-id="${r.id}" title="编辑" style="background: none; border: none; font-size: 12px; color: #888; cursor: pointer; padding: 2px 4px;">✎</button>
                                                <button class="btn-del-rec" data-id="${r.id}" title="删除" style="background: none; border: none; font-size: 12px; color: #BBB; cursor: pointer; padding: 2px 4px;">✕</button>
                                            </div>
                                        </div>
                                        <div class="record-text-content" style="font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; color: #332B25;">${r.content}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            }

            container.innerHTML = `
                <div class="cike-mirror-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 90px; min-height: 100vh; position: relative;">
                    <div class="page-header" style="margin-bottom: 14px;">
                        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">🪞 镜 · 记录</h2>
                        <p class="subtitle" style="color: var(--color-text-light); font-size: 14px; margin: 0;">诚实地面对自己，所有的成长都有迹可循</p>
                    </div>

                    <!-- 搜索框 -->
                    <div style="margin-bottom: 12px;">
                        <input type="text" id="mirror-search-input" value="${currentSearch}" placeholder="🔍 搜索记录与反思..." style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--color-border); font-size: 13px; margin-bottom: 0; box-sizing: border-box;">
                    </div>

                    <!-- 分类筛选胶囊 Tab -->
                    <div class="filter-tabs" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 14px; -webkit-overflow-scrolling: touch;">
                        <button class="filter-tab-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all" style="white-space: nowrap; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--color-border); background: ${currentFilter === 'all' ? 'var(--color-accent)' : 'white'}; color: ${currentFilter === 'all' ? 'white' : 'var(--color-text)'}; font-size: 12px; cursor: pointer; font-weight: 500;">全部</button>
                        <button class="filter-tab-btn ${currentFilter === 'thought' ? 'active' : ''}" data-filter="thought" style="white-space: nowrap; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--color-border); background: ${currentFilter === 'thought' ? 'var(--color-accent)' : 'white'}; color: ${currentFilter === 'thought' ? 'white' : 'var(--color-text)'}; font-size: 12px; cursor: pointer; font-weight: 500;">💭 想法</button>
                        <button class="filter-tab-btn ${currentFilter === 'action' ? 'active' : ''}" data-filter="action" style="white-space: nowrap; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--color-border); background: ${currentFilter === 'action' ? 'var(--color-accent)' : 'white'}; color: ${currentFilter === 'action' ? 'white' : 'var(--color-text)'}; font-size: 12px; cursor: pointer; font-weight: 500;">⚡ 行动</button>
                        <button class="filter-tab-btn ${currentFilter === 'confusion' ? 'active' : ''}" data-filter="confusion" style="white-space: nowrap; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--color-border); background: ${currentFilter === 'confusion' ? 'var(--color-accent)' : 'white'}; color: ${currentFilter === 'confusion' ? 'white' : 'var(--color-text)'}; font-size: 12px; cursor: pointer; font-weight: 500;">❓ 困惑</button>
                        <button class="filter-tab-btn ${currentFilter === 'skills' ? 'active' : ''}" data-filter="skills" style="white-space: nowrap; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--color-border); background: ${currentFilter === 'skills' ? 'var(--color-accent)' : 'white'}; color: ${currentFilter === 'skills' ? 'white' : 'var(--color-text)'}; font-size: 12px; cursor: pointer; font-weight: 500;">🏛️ 修炼反思</button>
                    </div>
                    
                    ${listHtml}
                    
                    <!-- 浮动新建按钮 -->
                    <button id="btn-mirror-add" style="position: fixed; bottom: 75px; right: 20px; background: var(--color-accent); color: white; border: none; padding: 14px 20px; border-radius: 30px; font-size: 15px; font-weight: bold; box-shadow: 0 4px 14px rgba(212, 165, 116, 0.45); cursor: pointer; z-index: 10;">
                        + 新记录
                    </button>
                </div>
            `;

            this.bindEvents(container);
        },

        bindEvents: function(container) {
            const store = window.CiKeStore;

            // 新建记录
            const btnAdd = container.querySelector('#btn-mirror-add');
            if (btnAdd) {
                btnAdd.addEventListener('click', () => {
                    window.CiKeRouter.navigate('new-record');
                });
            }

            // 搜索过滤
            const searchInput = container.querySelector('#mirror-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    currentSearch = e.target.value;
                    this.render(container);
                    // 保持输入焦点
                    const newEl = container.querySelector('#mirror-search-input');
                    if (newEl) {
                        newEl.focus();
                        newEl.setSelectionRange(newEl.value.length, newEl.value.length);
                    }
                });
            }

            // 分类胶囊切换
            container.querySelectorAll('.filter-tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    currentFilter = e.target.getAttribute('data-filter');
                    this.render(container);
                });
            });

            // 编辑记录
            container.querySelectorAll('.btn-edit-rec').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    const record = store.getRecords().find(r => r.id === id);
                    if (record) {
                        const newContent = prompt('修改记录内容：', record.content);
                        if (newContent !== null && newContent.trim()) {
                            store.updateRecord(id, newContent.trim(), record.mood);
                            this.render(container);
                        }
                    }
                });
            });

            // 删除记录
            container.querySelectorAll('.btn-del-rec').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    if (confirm('确定删除此条记录吗？')) {
                        store.deleteRecord(id);
                        this.render(container);
                    }
                });
            });
        }
    };
})();
