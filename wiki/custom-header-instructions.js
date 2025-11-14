/**
 * Custom Header Template for Wiki.js
 * 為管理員添加"管理中心"鏈接到 Wiki.js 頂部導航欄
 */

// 此檔案說明如何在 Wiki.js 中添加管理中心按鈕
//
// 實施方式有兩種：
//
// 方式 A：通過 Wiki.js 自定義頭部腳本 (推薦)
// 1. 以管理員身份登入 Wiki.js
// 2. 進入 Administration > Theme
// 3. 在 "Custom Header" 區域添加以下代碼：

/*
<script>
(function() {
  // 檢查是否為管理員（通過檢查是否有 Admin 按鈕）
  const adminButton = document.querySelector('a[href="/a"]');

  if (adminButton) {
    // 創建管理中心按鈕
    const adminPanelUrl = 'http://localhost:3001';
    const nav = document.querySelector('.v-toolbar__items');

    if (nav) {
      const adminPanelBtn = document.createElement('a');
      adminPanelBtn.href = adminPanelUrl;
      adminPanelBtn.target = '_blank';
      adminPanelBtn.className = 'v-btn v-btn--flat theme--dark';
      adminPanelBtn.innerHTML = `
        <div class="v-btn__content">
          <i class="v-icon mdi mdi-cog-outline mr-2"></i>
          TPV 管理中心
        </div>
      `;
      adminPanelBtn.style.cssText = 'color: #ffd700 !important; margin-left: 8px;';

      // 插入到導航欄
      nav.appendChild(adminPanelBtn);

      console.log('✅ TPV 管理中心按鈕已添加');
    }
  }
})();
</script>

<style>
.admin-panel-highlight {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  padding: 2px 8px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
</style>
*/

// 方式 B：通過自定義 Theme (進階)
// 1. 創建自定義 Theme 文件
// 2. 覆蓋導航欄組件
// 3. 在 Wiki.js 中啟用自定義 Theme

module.exports = {
  // 此檔案僅作為文檔說明
  // 實際實施請使用上述方式 A 或 

  instructions: {
    methodA: '通過 Wiki.js Administration > Theme > Custom Header 添加腳本',
    methodB: '創建自定義 Theme 並覆蓋導航欄組件',
    recommended: 'methodA'
  }
};
