/**
 * ⚙️ 设置与数据主权中心 (Settings & Data Privacy Page)
 */

window.SettingsPage = {
    render: function(container) {
        const store = window.CiKeStore;
        const settings = store.getSettings();

        let html = `
            <div class="settings-page-container" style="max-width: 430px; margin: 0 auto; color: var(--color-text); padding-bottom: 50px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <button id="btn-back-settings" style="background: none; border: none; font-size: 15px; cursor: pointer; color: var(--color-accent); padding: 4px 0;">← 返回</button>
                    <span style="font-size: 16px; font-weight: bold;">设置与数据</span>
                    <span style="width: 40px;"></span>
                </div>

                <!-- 外观主题 -->
                <div class="card" style="padding: 16px; margin-bottom: 16px;">
                    <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 12px 0;">🎨 外观主题</h3>
                    <div style="display: flex; gap: 12px;">
                        <button id="theme-btn-paper" class="btn" style="flex: 1; padding: 10px; border: 2px solid ${settings.theme !== 'dark' ? 'var(--color-accent)' : 'var(--color-border)'}; background: #FAF6F1; color: #3D3530; border-radius: 10px; font-size: 13px; font-weight: bold;">
                            📜 米白纸张
                        </button>
                        <button id="theme-btn-dark" class="btn" style="flex: 1; padding: 10px; border: 2px solid ${settings.theme === 'dark' ? 'var(--color-accent)' : 'var(--color-border)'}; background: #1E2530; color: #E0E0E0; border-radius: 10px; font-size: 13px; font-weight: bold;">
                            🌙 护眼暗夜
                        </button>
                    </div>
                </div>

                <!-- 默认专注白噪音 -->
                <div class="card" style="padding: 16px; margin-bottom: 16px;">
                    <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0;">🎧 专注背景音偏好</h3>
                    <p style="font-size: 12px; color: var(--color-text-light); margin: 0 0 10px 0;">纯 Web Audio 离线算法合成，不占存储，无网络开销。</p>
                    <select id="select-default-noise" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--color-border); background: white; font-size: 14px; color: var(--color-text);">
                        <option value="none" ${settings.whiteNoiseDefault === 'none' ? 'selected' : ''}>安静无声 (默认)</option>
                        <option value="rain" ${settings.whiteNoiseDefault === 'rain' ? 'selected' : ''}>🌧️ 淅沥细雨</option>
                        <option value="waves" ${settings.whiteNoiseDefault === 'waves' ? 'selected' : ''}>🌊 舒缓海浪</option>
                        <option value="white" ${settings.whiteNoiseDefault === 'white' ? 'selected' : ''}>📻 平缓白噪音</option>
                    </select>
                </div>

                <!-- 数据主权与备份导出 -->
                <div class="card" style="padding: 16px; margin-bottom: 16px;">
                    <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 6px 0;">💾 数据备份与自由导出</h3>
                    <p style="font-size: 12px; color: var(--color-text-light); margin: 0 0 14px 0;">你的日记、目标与修炼记录属于你。你可以随时完整下载。</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button id="btn-export-json" class="btn btn-secondary" style="padding: 10px; font-size: 13px; border-radius: 8px;">
                            📥 导出完整数据备份 (JSON 格式)
                        </button>
                        <button id="btn-export-md" class="btn btn-secondary" style="padding: 10px; font-size: 13px; border-radius: 8px;">
                            📝 导出为 Markdown 文档 (日记合集)
                        </button>
                        
                        <div style="position: relative; overflow: hidden; margin-top: 4px;">
                            <button id="btn-trigger-import" class="btn" style="background: #E8E2DB; color: #3D3530; width: 100%; padding: 10px; font-size: 13px; border-radius: 8px; border: none;">
                                📤 导入备份数据恢复
                            </button>
                            <input type="file" id="input-import-file" accept=".json" style="position: absolute; left: 0; top: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer;">
                        </div>
                    </div>
                </div>

                <!-- 隐私与清空 -->
                <div class="card" style="padding: 16px; margin-bottom: 16px;">
                    <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 6px 0; color: #C0392B;">⚠️ 隐私与重置</h3>
                    <p style="font-size: 12px; color: var(--color-text-light); margin: 0 0 12px 0;">所有记录仅保存在你的本地浏览器中，绝不上报隐私。</p>
                    <button id="btn-clear-all" class="btn" style="background: #FDEDEC; color: #C0392B; border: 1px solid #F5B7B1; padding: 10px; font-size: 13px; border-radius: 8px; width: 100%;">
                        清空所有本地数据
                    </button>
                </div>

                <!-- 关于 -->
                <div style="text-align: center; padding: 16px 0; color: var(--color-text-light); font-size: 12px; line-height: 1.6;">
                    <strong>「此刻」CiKe v1.0.0</strong><br>
                    看见自己 · 修炼自己 · 成为自己<br>
                    纯本地存储 · 零广告 · 零算法推荐
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container);
    },

    bindEvents: function(container) {
        const store = window.CiKeStore;

        container.querySelector('#btn-back-settings').addEventListener('click', () => {
            window.CiKeRouter.goBack();
        });

        // 切换米白主题
        container.querySelector('#theme-btn-paper').addEventListener('click', () => {
            store.saveSettings({ theme: 'paper' });
            this.render(container);
        });

        // 切换暗黑主题
        container.querySelector('#theme-btn-dark').addEventListener('click', () => {
            store.saveSettings({ theme: 'dark' });
            this.render(container);
        });

        // 白噪音偏好
        container.querySelector('#select-default-noise').addEventListener('change', (e) => {
            store.saveSettings({ whiteNoiseDefault: e.target.value });
        });

        // 导出 JSON
        container.querySelector('#btn-export-json').addEventListener('click', () => {
            const jsonStr = store.exportDataJSON();
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cike-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // 导出 Markdown
        container.querySelector('#btn-export-md').addEventListener('click', () => {
            const mdStr = store.exportMarkdownSummary();
            const blob = new Blob([mdStr], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cike-journal-${new Date().toISOString().split('T')[0]}.md`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // 导入数据恢复
        const inputFile = container.querySelector('#input-import-file');
        inputFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                const content = evt.target.result;
                const ok = store.importDataJSON(content);
                if (ok) {
                    alert('数据已成功恢复！应用将重新加载。');
                    window.location.reload();
                } else {
                    alert('导入失败，请检查文件格式是否有效。');
                }
            };
            reader.readAsText(file);
        });

        // 清除数据
        container.querySelector('#btn-clear-all').addEventListener('click', () => {
            if (confirm('警告：此操作将清除你在本设备的所有日记、目标与修炼进度，且无法撤销！\n\n确定继续吗？')) {
                store.clearAll();
                alert('所有本地数据已重置。');
                window.location.reload();
            }
        });
    }
};
