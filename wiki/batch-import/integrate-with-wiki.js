// Wiki.js 頁面整合腳本
// 將此腳本添加到 Wiki.js 的自定義 HTML 中

(function() {
    // 添加批量導入按鈕到 Wiki.js 導航欄
    function addBatchImportButton() {
        const nav = document.querySelector('.v-toolbar__content .v-btn-group');
        if (nav && !document.getElementById('batch-import-btn')) {
            const importBtn = document.createElement('button');
            importBtn.id = 'batch-import-btn';
            importBtn.className = 'v-btn v-btn--flat theme--dark';
            importBtn.innerHTML = '<i class="material-icons">cloud_upload</i> 批量導入';
            importBtn.onclick = openBatchImporter;
            nav.appendChild(importBtn);
        }
    }
    
    // 打開批量導入工具
    function openBatchImporter() {
        const modal = document.createElement('div');
        modal.id = 'batch-import-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
            align-items: center; justify-content: center;
        `;
        
        const iframe = document.createElement('iframe');
        iframe.src = 'http://localhost:5000';
        iframe.style.cssText = `
            width: 90%; height: 90%; border: none; border-radius: 8px;
            background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute; top: 20px; right: 20px; background: white;
            border: none; width: 40px; height: 40px; border-radius: 50%;
            font-size: 20px; cursor: pointer; z-index: 10001;
        `;
        closeBtn.onclick = () => document.body.removeChild(modal);
        
        modal.appendChild(iframe);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
    }
    
    // 等待頁面加載完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addBatchImportButton);
    } else {
        addBatchImportButton();
    }
    
    // 監聽路由變化（SPA）
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(addBatchImportButton, 1000);
        }
    }).observe(document, {subtree: true, childList: true});
})();
