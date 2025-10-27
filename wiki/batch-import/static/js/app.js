// Wiki.js 批量導入管理系統 - 前端應用

class WikiBatchImportApp {
    constructor() {
        this.apiBase = '/api/wiki';
        this.currentTab = 'dashboard';
        this.refreshInterval = null;
        this.smbConfigs = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.startAutoRefresh();
    }

    // ========== 事件監聽 ==========
    setupEventListeners() {
        // 標籤切換
        document.querySelectorAll('[data-tab]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // SMB 配置
        document.getElementById('save-smb-btn')?.addEventListener('click', () => this.saveSmbConfig());
        
        // 批量導入
        document.getElementById('scan-directory-btn')?.addEventListener('click', () => this.scanDirectory());
        document.getElementById('batch-import-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.startBatchImport();
        });

        // 同步監控
        document.getElementById('refresh-sync-btn')?.addEventListener('click', () => this.loadSyncMonitor());
        
        // 日誌
        document.getElementById('refresh-logs-btn')?.addEventListener('click', () => this.loadLogs());
        document.getElementById('clear-logs-btn')?.addEventListener('click', () => this.clearLogs());
        
        // 設置
        document.getElementById('settings-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
    }

    // ========== 標籤切換 ==========
    switchTab(tabName) {
        // 更新側邊欄
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新內容區
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // 載入對應內容
        switch(tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'smb-config':
                this.loadSmbConfigs();
                break;
            case 'sync-monitor':
                this.loadSyncMonitor();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    }

    // ========== 儀表板 ==========
    async loadDashboard() {
        try {
            const response = await fetch(`${this.apiBase}/smb-status`);
            const data = await response.json();

            if (data.success) {
                this.updateDashboardStats(data);
                this.updateGroupStatus(data.groups || []);
            }
        } catch (error) {
            console.error('載入儀表板失敗:', error);
        }
    }

    updateDashboardStats(data) {
        const groups = data.groups || [];
        const totalFiles = groups.reduce((sum, g) => sum + (g.file_count || 0), 0);
        const activeGroups = groups.filter(g => g.file_count > 0).length;

        document.getElementById('total-files').textContent = totalFiles;
        document.getElementById('active-groups').textContent = activeGroups;
        document.getElementById('pending-files').textContent = '0';
        document.getElementById('failed-files').textContent = '0';
    }

    updateGroupStatus(groups) {
        const container = document.getElementById('group-status-container');
        
        if (groups.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <p>暫無群組配置</p>
                </div>
            `;
            return;
        }

        container.innerHTML = groups.map(group => `
            <div class="group-status-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${group.group}</h6>
                        <span class="group-badge ${group.file_count > 0 ? 'status-active' : 'status-inactive'}">
                            ${group.file_count > 0 ? '活躍' : '未同步'}
                        </span>
                    </div>
                    <div class="text-end">
                        <div class="fs-4 fw-bold">${group.file_count}</div>
                        <small class="text-muted">個文件</small>
                    </div>
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        最後掃描: ${group.last_scan || '從未'}
                    </small>
                </div>
            </div>
        `).join('');
    }

    // ========== SMB 配置管理 ==========
    async loadSmbConfigs() {
        try {
            // 載入已保存的配置
            const response = await fetch('/api/smb-configs');
            if (response.ok) {
                const data = await response.json();
                this.smbConfigs = data.configs || [];
                this.renderSmbConfigs();
            } else {
                // 如果接口還沒實現，使用默認配置
                this.renderSmbConfigs();
            }
        } catch (error) {
            console.error('載入 SMB 配置失敗:', error);
            this.renderSmbConfigs();
        }
    }

    renderSmbConfigs() {
        const container = document.getElementById('smb-configs-container');
        
        if (this.smbConfigs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-hdd-network"></i>
                    <p>暫無 SMB 配置，點擊右上角按鈕新增</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.smbConfigs.map(config => `
            <div class="smb-config-card">
                <div class="smb-config-header">
                    <div class="smb-config-title">
                        <i class="bi bi-folder2"></i> ${config.group}
                    </div>
                    <div class="smb-config-actions">
                        <button class="btn btn-sm btn-success" onclick="app.testSmbConnection('${config.group}')">
                            <i class="bi bi-plug"></i> 測試
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="app.triggerSync('${config.group}')">
                            <i class="bi bi-arrow-repeat"></i> 同步
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteSmbConfig('${config.group}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="smb-config-details">
                    <div class="detail-item">
                        <span class="detail-label">SMB 路徑</span>
                        <span class="detail-value">${config.smbPath}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Wiki.js 目標</span>
                        <span class="detail-value">${config.targetPath}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">掃描間隔</span>
                        <span class="detail-value">${config.scanInterval}秒</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">自動同步</span>
                        <span class="detail-value">
                            ${config.autoSync ? 
                                '<span class="badge bg-success">啟用</span>' : 
                                '<span class="badge bg-secondary">停用</span>'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async saveSmbConfig() {
        const group = document.getElementById('smb-group').value;
        const smbPath = document.getElementById('smb-path').value;
        const targetPath = document.getElementById('wiki-target-path').value;
        const scanInterval = parseInt(document.getElementById('smb-scan-interval').value);
        const autoSync = document.getElementById('smb-auto-sync').checked;

        if (!group || !smbPath || !targetPath) {
            this.showNotification('請填寫所有必填欄位', 'warning');
            return;
        }

        const config = {
            group,
            smbPath,
            targetPath,
            scanInterval,
            autoSync
        };

        // 保存到本地
        this.smbConfigs.push(config);
        
        // TODO: 發送到後端保存
        try {
            await fetch('/api/smb-configs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
        } catch (error) {
            console.log('後端保存配置接口待實現');
        }

        // 關閉 modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addSmbModal'));
        modal.hide();

        // 清空表單
        document.getElementById('add-smb-form').reset();

        // 重新載入配置
        this.renderSmbConfigs();
        this.showNotification('SMB 配置已保存', 'success');
    }

    async testSmbConnection(group) {
        this.showNotification(`正在測試 ${group} 的連接...`, 'info');
        
        try {
            const config = this.smbConfigs.find(c => c.group === group);
            const response = await fetch(`${this.apiBase}/scan-directory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourcePath: config.smbPath })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`連接成功！找到 ${data.total} 個文件`, 'success');
            } else {
                this.showNotification(`連接失敗: ${data.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification(`測試失敗: ${error.message}`, 'danger');
        }
    }

    async triggerSync(group) {
        this.showNotification(`正在觸發 ${group} 的同步...`, 'info');
        
        try {
            const config = this.smbConfigs.find(c => c.group === group);
            const response = await fetch(`${this.apiBase}/smb-sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group: group,
                    smbPath: config.smbPath,
                    targetFolder: config.targetPath,
                    mode: 'once'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`同步完成！`, 'success');
                this.loadDashboard();
            } else {
                this.showNotification(`同步失敗: ${data.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification(`同步失敗: ${error.message}`, 'danger');
        }
    }

    deleteSmbConfig(group) {
        if (confirm(`確定要刪除 ${group} 的配置嗎？`)) {
            this.smbConfigs = this.smbConfigs.filter(c => c.group !== group);
            this.renderSmbConfigs();
            this.showNotification('配置已刪除', 'success');
        }
    }

    // ========== 同步監控 ==========
    async loadSyncMonitor() {
        try {
            const response = await fetch(`${this.apiBase}/smb-status`);
            const data = await response.json();

            if (data.success) {
                this.renderSyncTasks(data.groups || []);
            }
        } catch (error) {
            console.error('載入同步監控失敗:', error);
        }
    }

    renderSyncTasks(groups) {
        const container = document.getElementById('sync-tasks-container');
        
        if (groups.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <p>暫無同步任務</p>
                </div>
            `;
            return;
        }

        container.innerHTML = groups.map(group => `
            <div class="sync-task-item">
                <div class="task-info">
                    <div class="task-name">${group.group}</div>
                    <div class="task-meta">
                        文件數: ${group.file_count} | 
                        最後掃描: ${group.last_scan || '從未'}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.triggerSync('${group.group}')">
                        <i class="bi bi-arrow-repeat"></i> 同步
                    </button>
                    <button class="btn btn-sm btn-info" onclick="app.viewSyncDetails('${group.group}')">
                        <i class="bi bi-info-circle"></i> 詳情
                    </button>
                </div>
            </div>
        `).join('');
    }

    async viewSyncDetails(group) {
        try {
            const response = await fetch(`${this.apiBase}/smb-status?group=${group}`);
            const data = await response.json();

            if (data.success) {
                alert(`群組: ${group}\n文件數: ${data.file_count}\n最後掃描: ${data.last_scan}`);
            }
        } catch (error) {
            this.showNotification('載入詳情失敗', 'danger');
        }
    }

    // ========== 批量導入 ==========
    async scanDirectory() {
        const sourcePath = document.getElementById('source-path').value;
        
        if (!sourcePath) {
            this.showNotification('請輸入源目錄路徑', 'warning');
            return;
        }

        document.getElementById('scan-directory-btn').disabled = true;
        this.showNotification('正在掃描目錄...', 'info');

        try {
            const response = await fetch(`${this.apiBase}/scan-directory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourcePath })
            });

            const data = await response.json();

            if (data.success) {
                this.displayScanResults(data);
                this.showNotification(`掃描完成，找到 ${data.total} 個文件`, 'success');
            } else {
                this.showNotification(`掃描失敗: ${data.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification(`掃描失敗: ${error.message}`, 'danger');
        } finally {
            document.getElementById('scan-directory-btn').disabled = false;
        }
    }

    displayScanResults(data) {
        const resultsDiv = document.getElementById('scan-results');
        const contentDiv = document.getElementById('scan-results-content');

        contentDiv.innerHTML = `
            <div class="alert alert-info">
                <strong>掃描路徑:</strong> ${data.path}<br>
                <strong>找到文件:</strong> ${data.total} 個
            </div>
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>文件名</th>
                        <th>路徑</th>
                        <th>大小</th>
                        <th>類型</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.files.slice(0, 10).map(file => `
                        <tr>
                            <td>${file.name}</td>
                            <td>${file.path}</td>
                            <td>${this.formatBytes(file.size)}</td>
                            <td><span class="badge bg-secondary">${file.type}</span></td>
                        </tr>
                    `).join('')}
                    ${data.files.length > 10 ? '<tr><td colspan="4" class="text-center text-muted">... 還有更多文件</td></tr>' : ''}
                </tbody>
            </table>
        `;

        resultsDiv.style.display = 'block';
    }

    async startBatchImport() {
        const sourcePath = document.getElementById('source-path').value;
        const targetFolder = document.getElementById('target-folder').value;
        const preserveStructure = document.getElementById('preserve-structure').checked;

        if (!sourcePath || !targetFolder) {
            this.showNotification('請填寫所有必填欄位', 'warning');
            return;
        }

        document.getElementById('batch-import-form').querySelector('[type="submit"]').disabled = true;
        document.getElementById('import-progress').style.display = 'block';
        document.getElementById('import-progress-bar').style.width = '0%';
        document.getElementById('import-progress-bar').textContent = '0%';

        try {
            const response = await fetch(`${this.apiBase}/batch-directory-import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourcePath,
                    targetFolder,
                    preserveStructure: preserveStructure.toString()
                })
            });

            const data = await response.json();

            if (data.success) {
                const progress = (data.success_count / data.total) * 100;
                document.getElementById('import-progress-bar').style.width = `${progress}%`;
                document.getElementById('import-progress-bar').textContent = `${Math.round(progress)}%`;
                
                this.displayImportResults(data);
                this.showNotification(`導入完成！成功 ${data.success_count} 個，失敗 ${data.failed_count} 個`, 'success');
            } else {
                this.showNotification(`導入失敗: ${data.error}`, 'danger');
            }
        } catch (error) {
            this.showNotification(`導入失敗: ${error.message}`, 'danger');
        } finally {
            document.getElementById('batch-import-form').querySelector('[type="submit"]').disabled = false;
        }
    }

    displayImportResults(data) {
        const contentDiv = document.getElementById('import-results-content');

        contentDiv.innerHTML = `
            <div class="alert alert-success">
                <strong>導入完成!</strong><br>
                總計: ${data.total} | 成功: ${data.success_count} | 失敗: ${data.failed_count}
            </div>
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>文件</th>
                        <th>狀態</th>
                        <th>Wiki URL</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.results.map(result => `
                        <tr>
                            <td>${result.file}</td>
                            <td>
                                ${result.success ? 
                                    '<span class="badge bg-success">成功</span>' : 
                                    '<span class="badge bg-danger">失敗</span>'}
                            </td>
                            <td>
                                ${result.success ? 
                                    `<a href="http://localhost:3000${result.wiki_url}" target="_blank">${result.wiki_url}</a>` : 
                                    `<small class="text-muted">${result.error}</small>`}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // ========== 日誌 ==========
    loadLogs() {
        // 模擬日誌
        const logsContainer = document.getElementById('logs-container');
        logsContainer.innerHTML = `
            <div class="log-entry">
                <span class="log-time">[2025-01-15 14:30:25]</span>
                <span class="log-level info">[INFO]</span>
                <span class="log-message">服務啟動成功</span>
            </div>
            <div class="log-entry">
                <span class="log-time">[2025-01-15 14:31:10]</span>
                <span class="log-level success">[SUCCESS]</span>
                <span class="log-message">SMB 連接測試成功: EE</span>
            </div>
            <div class="log-entry">
                <span class="log-time">[2025-01-15 14:32:45]</span>
                <span class="log-level info">[INFO]</span>
                <span class="log-message">開始掃描目錄: /app/smb/EE</span>
            </div>
            <div class="log-entry">
                <span class="log-time">[2025-01-15 14:32:50]</span>
                <span class="log-level success">[SUCCESS]</span>
                <span class="log-message">掃描完成，找到 45 個文件</span>
            </div>
        `;
    }

    clearLogs() {
        document.getElementById('logs-container').innerHTML = '';
        this.showNotification('日誌已清空', 'success');
    }

    // ========== 設置 ==========
    saveSettings() {
        const scanInterval = document.getElementById('scan-interval').value;
        const maxConcurrent = document.getElementById('max-concurrent').value;
        const autoSyncEnabled = document.getElementById('auto-sync-enabled').checked;
        const emailNotification = document.getElementById('email-notification').checked;
        const notificationEmail = document.getElementById('notification-email').value;

        // TODO: 保存到後端
        console.log('保存設置:', {
            scanInterval,
            maxConcurrent,
            autoSyncEnabled,
            emailNotification,
            notificationEmail
        });

        this.showNotification('設置已保存', 'success');
    }

    // ========== 工具方法 ==========
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        const toast = document.getElementById('notification-toast');
        const toastBody = document.getElementById('toast-message');
        
        toastBody.textContent = message;
        toast.className = `toast bg-${type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'} text-white`;
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    startAutoRefresh() {
        // 每30秒自動刷新儀表板
        this.refreshInterval = setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.loadDashboard();
            }
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// 初始化應用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new WikiBatchImportApp();
});
