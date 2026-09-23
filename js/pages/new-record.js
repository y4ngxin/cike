// New Record Page
(function() {
    window.CiKeNewRecord = {
        render: function() {
            const container = document.getElementById('page-new-record');
            if (!container) return;
            
            container.innerHTML = `
                <div class="cike-new-record-container" style="padding: 24px; max-width: 430px; margin: 0 auto; color: var(--cike-text, #3D3530); height: 100vh; display: flex; flex-direction: column;">
                    <div style="display: flex; align-items: center; margin-bottom: 24px;">
                        <button onclick="window.CiKeRouter.navigate('mirror')" style="background: none; border: none; font-size: 24px; cursor: pointer; padding: 8px 16px 8px 0;">←</button>
                        <h1 style="font-size: 20px; font-weight: bold; margin: 0;">新记录</h1>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                        <button class="cike-type-card" data-type="thought" style="flex: 1; background: white; border: 2px solid var(--cike-accent, #D4A574); border-radius: 12px; padding: 16px 8px; text-align: center; cursor: pointer; transition: all 0.2s;">
                            <div style="font-size: 24px; margin-bottom: 8px;">💭</div>
                            <div style="font-size: 14px; font-weight: bold;">想法</div>
                        </button>
                        <button class="cike-type-card" data-type="action" style="flex: 1; background: white; border: 2px solid transparent; border-radius: 12px; padding: 16px 8px; text-align: center; cursor: pointer; transition: all 0.2s;">
                            <div style="font-size: 24px; margin-bottom: 8px;">✅</div>
                            <div style="font-size: 14px; font-weight: bold;">行动</div>
                        </button>
                        <button class="cike-type-card" data-type="confusion" style="flex: 1; background: white; border: 2px solid transparent; border-radius: 12px; padding: 16px 8px; text-align: center; cursor: pointer; transition: all 0.2s;">
                            <div style="font-size: 24px; margin-bottom: 8px;">❓</div>
                            <div style="font-size: 14px; font-weight: bold;">困惑</div>
                        </button>
                    </div>

                    <textarea id="record-content" style="flex: 1; width: 100%; padding: 16px; border-radius: 16px; border: none; background: white; font-family: inherit; font-size: 16px; resize: none; box-sizing: border-box; box-shadow: 0 4px 12px rgba(0,0,0,0.03); margin-bottom: 24px;" placeholder="写下你的灵感或思考..."></textarea>

                    <button id="save-record" style="width: 100%; background: var(--cike-accent, #D4A574); color: white; border: none; padding: 16px; border-radius: 16px; font-size: 18px; font-weight: bold; min-height: 56px; cursor: pointer;">保存</button>
                </div>
            `;

            let selectedType = 'thought';
            const typeCards = container.querySelectorAll('.cike-type-card');
            const textarea = container.querySelector('#record-content');

            const placeholders = {
                'thought': '写下你的灵感或思考...',
                'action': '记录你做了什么...',
                'confusion': '写下你的迷茫和疑问...'
            };

            typeCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    const target = e.target.closest('.cike-type-card');
                    selectedType = target.getAttribute('data-type');
                    
                    typeCards.forEach(c => c.style.borderColor = 'transparent');
                    target.style.borderColor = 'var(--cike-accent, #D4A574)';
                    
                    textarea.placeholder = placeholders[selectedType];
                });
            });

            container.querySelector('#save-record').addEventListener('click', () => {
                const content = textarea.value.trim();
                if (!content) {
                    alert('请填写记录内容。');
                    return;
                }

                if (window.CiKeStore) {
                    window.CiKeStore.saveRecord({
                        type: selectedType,
                        content: content
                    });
                }

                if (window.CiKeRouter) {
                    window.CiKeRouter.navigate('mirror');
                }
            });
        }
    };
})();
