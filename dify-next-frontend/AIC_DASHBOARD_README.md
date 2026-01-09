# AIC 戰情室 - Urtracker 數據查詢系統

## 📋 功能概述

AIC 戰情室是一個整合在 dify-next-frontend (端口 3001) 的 Urtracker 數據查詢介面，用於查看和下載 TV/PD/MNT/AVA 四個專案的最新數據。

## 🚀 功能特色

- ✅ 即時查詢 Urtracker 專案數據
- ✅ 支持 TV、PD、MNT、AVA 四個專案
- ✅ 支持按狀態篩選 (全部/開啟中/已關閉)
- ✅ 一鍵下載 Excel 文件
- ✅ **數據表格展示（已實現！）**
- ✅ **搜索功能** - 全文搜索所有欄位
- ✅ **排序功能** - 點擊欄位標題排序
- ✅ **分頁功能** - 每頁 20 筆數據
- ✅ 響應式設計，支持桌面和移動設備

## 📁 文件結構

```
dify-next-frontend/
├── pages/
│   ├── aic-dashboard.tsx          # AIC 戰情室主頁面
│   ├── dashboard.tsx              # Dashboard 頁面（已添加導航）
│   └── api/
│       └── urtracker/
│           ├── status.ts          # 登入狀態 API
│           ├── projects.ts        # 專案列表 API
│           ├── download/
│           │   └── [projectKey].ts # 下載 Excel API
│           └── parse/
│               └── [projectKey].ts # 解析 Excel 為 JSON API
├── components/
│   └── Urtracker/
│       └── UrtrackerTable.tsx     # 數據表格組件
└── services/
    └── urtrackerService.ts        # Urtracker API 服務層
```

## 🔗 訪問方式

### 1. 通過 Dashboard 訪問
1. 訪問 `http://localhost:3001/dashboard`
2. 點擊「AIC 戰情室」卡片

### 2. 直接訪問
訪問 `http://localhost:3001/aic-dashboard`

## 🎯 使用說明

### 查詢和顯示數據流程

1. **選擇專案**
   - 點擊 TV、PD、MNT 或 AVA 按鈕選擇要查詢的專案

2. **選擇狀態篩選**
   - 全部：顯示所有 Issues
   - 開啟中 (Open)：只顯示未關閉的 Issues
   - 已關閉 (Closed)：只顯示已關閉的 Issues

3. **載入數據**
   - 點擊「📊 載入數據」按鈕查看數據表格
   - 數據會以表格形式顯示，包含以下欄位：
     - Issue Code
     -顯示的欄位

當前表格顯示以下 Excel 欄位：

| 欄位 | 說明 | 特殊處理 |
|------|------|----------|
| Issue Code | 問題代碼 | 藍色字體，主要識別碼 |
| State | 狀態 | 綠色標籤(Open/New)、灰色標籤(Closed) |
| Priority | 優先級 | 紅色(High/Urgent)、黃色(Medium)、藍色(Low) |
| Brand | 品牌 | - |
| Model Name | 型號名稱 | - |
| Assignee | 指派人員 | - |
| Create Time | 創建時間 | - |
| Due Date | 到期日期 | - |
| Description | 描述 | 截斷顯示 |

### 未顯示但可用的欄位

Excel 中還有以下欄位可以添加顯示：
- ParentID
- ChildCount
- Is Closed
- Close Time
- Create User
- Record Num
- Last Process User
- Last Process Time
- Classification
- Issue Category
- Region
- Vendor
- Impact
- Action
- Supervisor/Owner

如需顯示這些欄位，可以修改 `UrtrackerTable.tsx` 組件。el 文件**
   ```bash
   # 訪問 AIC 戰情室頁面
   http://localhost:3001/aic-dashboard
   
   # 下載任一專案的 Excel 文件
   # 打開 Excel 查看所有可用欄位
   ```

2. **告訴我您想顯示的欄位**
   例如：
   - Issue ID
   - Subject (主題)
   - Status (狀態)
   - Priority (優先級)
   - Assigned To (指派給)
   - Created Date (創建日期)
   - Updated Date (更新日期)
   - Description (描述)
   - ... 等等

3. **我會為您實現數據表格顯示**
   - 添加 `xlsx` 庫來解析 Excel
   - 創建數據表格組件
   - 實現搜索、排序、分頁功能
   - 添加數據統計和圖表

## 🛠️ 技術架構

### 前端
- **框架**: Next.js + TypeScript + React
- **樣式**: Tailwind CSS
- **狀態管理**: React Hooks (useState, useEffect)

### API 層
- **API 路由**: Next.js API Routes (避免 CORS 問題)
- **代理**: 通過 `/api/urtracker/*` 代理到 `rest-to-soap-proxy:5001`

### 後端服務
- **rest-to-soap-proxy**: 提供 Urtracker HTTPS API
- **端口**: 5001 (內部) / 5100 (外部)
- **認證**: 自動使用環境變數憑證登入

## 📝 環境變數

確保 `rest-to-soap-proxy` 服務已配置：

```env
# rest-to-soap-proxy/.env
URTRACKER_USERNAME=your_username
URTRACKER_PASSWORD=your_password
```

## 🔧 開發指南

### 安裝依賴
```bash
cd dify-next-frontend
npm install
```

### 啟動開發服務器
```bash
npm run dev
```

### 添加 Excel 解析功能（已完成）✅
xlsx 庫已安裝並配置完成。數據解析 API 已創建。

## 🐛 故障排除

### 1. 無法連接到 Urtracker 服務
**錯誤**: "無法連接到 Urtracker 服務"

**解決方案**:
```bash
# 檢查 rest-to-soap-proxy 服務狀態
docker ps | grep rest-to-soap-proxy

# 如果服務未運行，啟動它
cd rest-to-soap-proxy
docker-compose up -d
```

### 2. 下載失敗
**錯誤**: "下載失敗" 或 401 錯誤

**解決方案**:
- 檢查 `rest-to-soap-proxy` 的環境變數是否配置正確
- 確認 Urtracker 帳號密碼正確
- 查看 rest-to-soap-proxy 日誌：
  ```bash
  docker logs rest-to-soap-proxy
  ```

### 3. CORS 錯誤
由於使用了 Next.js API Routes 作為代理，應該不會遇到 CORS 問題。如果遇到，請檢查：
- API 功能狀態

### 已完成功能 ✅
- [x] 創建基礎頁面和 UI
- [x] 實現 Excel 下載功能
- [x] 添加專案和狀態篩選
- [x] 安裝和配置 xlsx 庫
- [x] 創建 Excel 解析 API
- [x] 解析 Excel 數據為 JSON
- [x] 創建數據表格組件
- [x] 顯示主要欄位數據
- [x] 實現搜索功能
- [x] 實現排序功能
- [x] 實現分頁功能
- [x] 狀態和優先級標籤顏色

### 可選的進階功能
- [ ] 數據統計卡片（總數、Open/Closed 數量）
- [ ] 圖表視覺化（品牌分布、優先級分布）
- [ ] 數據導出（CSV、JSON）
- [ ] 自定義欄位顯示設置（用戶選擇要顯示的欄位）
- [ ] 數據刷新和緩存
- [ ] Issue 詳情彈窗
- [ ] 批量操作功能
- [ ] 數據導出（CSV、JSON）
- [ ] 自定義欄位顯示設置
- [ ] 數據刷新和緩存

## 🔗 相關文檔

- [rest-to-soap-proxy API 文檔](../rest-to-soap-proxy/API-USAGE-GUIDE.md)
- [rest-to-soap-proxy README](../rest-to-soap-proxy/README-NEW.md)
- [Docker 部署指南](../rest-to-soap-proxy/DOCKER-DEPLOY.md)

## 📞 支持

如有問題或需要協助，請：
1. 查看相關文檔
2. 檢查服務日誌
3. 聯繫開發團隊

---
2.0.0  
**最後更新**: 2026-01-09  
**狀態**: ✅ 核心功能已完成，數據表格正常運作
**狀態**: ✅ 基礎功能已完成，等待用戶確認欄位需求
