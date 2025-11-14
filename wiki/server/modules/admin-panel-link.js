/**
 * Wiki.js 管理中心鏈接配置
 * 
 * 此模組為管理員用戶在 Wiki.js 界面添加一個"管理中心"鏈接
 * 該鏈接會導向 dify-next-frontend 的管理面板 (http://localhost:3001)
 */

module.exports = {
  /**
   * 模組初始化
   */
  async init() {
    WIKI.logger.info('🎛️  Initializing Admin Panel Link module...');
    
    // 管理面板 URL（可通過環境變數配置）
    const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:3001';
    
    // 添加中間件，為管理員用戶注入管理面板 URL
    WIKI.app.use((req, res, next) => {
      // 檢查用戶是否已登入且為管理員
      if (req.user && req.user.groups) {
        const isAdmin = req.user.groups.some(group => {
          const groupName = group.name.toLowerCase();
          return groupName === 'administrators' || 
                 groupName === 'admin' || 
                 group.id === 1; // 通常 ID 1 是管理員組
        });
        
        if (isAdmin) {
          // 為管理員設置管理面板相關變數
          res.locals.adminPanelUrl = adminPanelUrl;
          res.locals.isAdmin = true;
          res.locals.adminPanelTitle = 'TPV OBM 管理中心';
          
          WIKI.logger.debug(`Admin user detected: ${req.user.email}, panel URL: ${adminPanelUrl}`);
        }
      }
      
      next();
    });
    
    WIKI.logger.info(`✅ Admin Panel Link module initialized (URL: ${adminPanelUrl})`);
  },
  
  /**
   * 獲取管理面板配置
   */
  getConfig() {
    return {
      adminPanelUrl: process.env.ADMIN_PANEL_URL || 'http://localhost:3001',
      adminPanelTitle: 'TPV OBM 管理中心',
      enabled: true
    };
  }
};
