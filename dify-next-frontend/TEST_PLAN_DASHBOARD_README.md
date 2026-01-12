# Test Plan 戰情室 - ODM 測試進度統計系統

## 📋 功能概述

Test Plan 戰情室是一個整合在 dify-next-frontend (端口 3001) 的測試進度統計介面，用於統計和查看 TV/MNT/PD 三個分類下各家 ODM 正在進行的測試項目數量和狀態。

## 🚀 功能特色

- ✅ **三大分類統計** - 支持 TV、MNT、PD 三個測試計劃分類
- ✅ **ODM 進度卡片** - 一目了然查看各 ODM 的測試進度統計
- ✅ **實時數據查詢** - 即時從 Urtracker 獲取最新測試數據
- ✅ **機種篩選功能** - 可以選擇特定機種查看測試項目
- ✅ **測試項目詳情** - 顯示完整的測試項目列表和狀態
- ✅ **搜索和排序** - 支持全文搜索和多欄位排序
- ✅ **分頁顯示** - 每頁 20 筆數據，方便瀏覽
- ✅ **Excel 下載** - 一鍵下載原始 Excel 報表
- ✅ **響應式設計** - 支持桌面和移動設備

## 📁 文件結構

```
dify-next-frontend/
├── pages/
│   ├── test-plan-dashboard.tsx    # Test Plan 戰情室主頁面
│   └── dashboard.tsx              # Dashboard (已添加入口)
├── components/
│   └── TestPlan/
│       ├── ODMStatsCard.tsx       # ODM 統計卡片組件
│       └── TestPlanTable.tsx      # 測試項目表格組件
└── services/
    └── testPlanService.ts         # Test Plan API 服務層
```

## 🔗 訪問方式

### 1. 通過 Dashboard 訪問
1. 訪問 `http://localhost:3001/dashboard`
2. 點擊「Test Plan 戰情室」卡片

### 2. 直接訪問
訪問 `http://localhost:3001/test-plan-dashboard`

## 🎯 使用說明

### 主要功能流程

#### 1. 查看 ODM 統計
1. 選擇分類（TV/MNT/PD）
2. 點擊「📊 載入統計數據」按鈕
3. 查看各 ODM 的統計卡片，包含：
   - **進行中項目數量** - 正在執行的測試項目總數
   - **Tracking 項目** - 處於 Tracking 狀態的項目
   - **已完成項目** - 已經完成的測試項目
   - **完成度百分比** - 視覺化的進度條
   - **進行中機種數量** - 有多少個機種在測試中

#### 2. 查看 ODM 詳細測試項目
1. 點擊任一 ODM 統計卡片
2. 系統會顯示該 ODM 所有正在進行的測試項目
3. 可以通過下拉選單篩選特定機種
4. 測試項目表格顯示：
   - Issue Code
   - State（狀態標籤）
   - Priority（優先級標籤）
   - Model Name（機種名稱）
   - Brand（品牌）
   - Assignee（負責人）
   - Create Time（創建時間）
   - Due Date（到期日期）

#### 3. 搜索和排序
- 使用搜索框可以搜索任何欄位的內容
- 點擊表格欄位標題可以排序（升序/降序）
- 支持分頁瀏覽，每頁 20 筆數據

#### 4. 下載 Excel 報表
- 在 ODM 詳細視圖中點擊「📥 下載 Excel」按鈕
- 下載該 ODM 的完整測試計劃 Excel 文件

## 📊 支持的 ODM 廠商

### TV 分類 (7 家)
- CHH (長虹)
- HKC(A)
- HKC(B)
- KTC
- MSF
- SKY
- BOE

### MNT 分類 (10 家)
- CTX
- Deweco
- Hannovo
- HengFAKJ
- KTC_MNT
- LNT_AOC
- LNT_Philips
- Ostar
- TJ
- MTC

### PD 分類 (2 家)
- CEDAR
- FABULUX

## 🛠️ 技術架構

### 前端組件
- **testPlanService.ts** - 封裝 Urtracker API 調用
  - `getAllCategoriesStats()` - 獲取所有分類的統計數據
  - `getODMModelTestItems()` - 獲取 ODM 的測試項目
  - `downloadTestPlanExcel()` - 下載 Excel 報表

- **ODMStatsCard** - ODM 統計卡片
  - 顯示進行中/Tracking/已完成數量
  - 完成度進度條
  - 機種數量統計

- **TestPlanTable** - 測試項目表格
  - 搜索功能
  - 多欄位排序
  - 分頁顯示

### API 路由
使用與 AIC 戰情室相同的 API 架構：
- `/api/urtracker/parse/[projectId]` - 解析 Excel 為 JSON
- `/api/urtracker/download/[projectId]` - 下載 Excel 文件

### 數據來源
- 從 `rest-to-soap-proxy` 服務獲取 Urtracker 數據
- 支持的專案 ID 定義在 `TEST_PLAN_PROJECTS` 常量中

## 📝 狀態判定邏輯

### 進行中項目 (In Progress)
狀態包含以下任一：
- Open
- New
- In Progress
- Assigned
- Tracking

### Tracking 項目
狀態包含 "Tracking"

### 已完成項目 (Completed)
狀態包含以下任一：
- Closed
- Resolved
- Done
- Completed

## 🎨 UI 設計

### 顏色編碼
- **紅色** - 高優先級 (High/Urgent) 或進行中項目過多 (>50)
- **黃色** - 中優先級 (Medium) 或進行中項目較多 (20-50)
- **綠色** - 低優先級 (Low) 或進行中項目較少 (<20)
- **藍色** - Tracking 狀態
- **灰色** - 已關閉狀態

### 卡片布局
- 響應式網格布局（桌面 3 列，平板 2 列，手機 1 列）
- 懸停效果增強互動性
- 進度條視覺化完成度

## 🔧 開發指南

### 添加新的 ODM
在 `testPlanService.ts` 中的 `TEST_PLAN_PROJECTS` 添加新配置：

```typescript
TV: {
  // ... existing ODMs
  NEW_ODM: { id: 1234, key: 'Test_Plan_NEW', name: 'NEW ODM Name' },
}
```

### 修改統計邏輯
在 `calculateODMStats()` 函數中調整狀態判定邏輯：

```typescript
const inProgressStates = ['Open', 'New', 'YourCustomState'];
```

### 自定義表格欄位
在 `TestPlanTable.tsx` 中添加新的表格欄位：

```tsx
<th>New Column</th>
// ...
<td>{item['New Field']}</td>
```

## 🐛 故障排除

### 問題：統計數據載入失敗
**解決方案：**
1. 確認 `rest-to-soap-proxy` 服務正在運行
2. 檢查專案 ID 是否正確
3. 查看瀏覽器控制台錯誤訊息

### 問題：某個 ODM 顯示 0 筆數據
**解決方案：**
1. 檢查該 ODM 的專案 ID 是否正確
2. 確認 Urtracker 中該專案是否有數據
3. 嘗試重新載入統計數據

### 問題：機種列表為空
**解決方案：**
- 檢查測試項目的 "Model Name" 欄位是否有數據
- 確認狀態過濾邏輯是否正確

## 📈 未來功能規劃

- [ ] 添加圖表視覺化（趨勢圖、圓餅圖）
- [ ] 支持自定義日期範圍篩選
- [ ] 導出統計報表為 PDF
- [ ] 添加測試進度提醒功能
- [ ] 支持批量操作（批量下載、批量更新）
- [ ] 添加測試覆蓋率分析
- [ ] 支持歷史數據對比

## 🔗 相關文檔

- [AIC 戰情室文檔](./AIC_DASHBOARD_README.md)
- [Urtracker 服務文檔](../rest-to-soap-proxy/README.md)
- [專案列表](../rest-to-soap-proxy/URT-projectlist.txt)

## 📞 支持

如有問題或建議，請聯繫開發團隊或提交 Issue。

---

**最後更新:** 2026-01-12  
**版本:** 1.0.0
