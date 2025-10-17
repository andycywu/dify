# Wiki.js 批量導入功能 - GraphQL API 整合完整指南

## 📋 問題總結

### 根本原因
直接透過 PostgreSQL 插入資料到 `pages` 表**無法**創建可用的 Wiki.js 頁面。

**缺失欄位**：
1. **`render`**：Markdown 渲染的 HTML 內容（最關鍵！）
2. **`toc`**：自動生成的目錄（Table of Contents）JSON
3. **`hash`**：內容的 SHA-256 哈希值

**結果**：頁面記錄存在資料庫中，但 Wiki.js 顯示"頁面不存在"。

## ✅ 解決方案

已將批量導入服務改為使用 **Wiki.js GraphQL API**，完整利用 Wiki.js 的渲染引擎。

## 🔧 配置步驟（必須完成）

### 步驟 1：生成 Wiki.js API Key

1. 在瀏覽器打開：`http://localhost:3000`
2. 使用管理員賬號登入
3. 點擊右上角 ⚙️ 進入 **Administration**
4. 左側菜單選擇 **API Access**
5. 點擊 **New API Key**
6. 配置：
   - **Name**: `Batch Import Service`
   - **Expiration**: `Never`（或選擇合適期限）
   - **Group**: `Administrators`（必須有頁面創建權限）
   - **Permissions**: 勾選
     - ✅ `pages:write`
     - ✅ `pages:manage`
7. 點擊 **Create**
8. **立即複製生成的 API Key**（只顯示一次！）

### 步驟 2：配置環境變數

**方法 A：使用 .env 檔案**（推薦）
```bash
cd /Users/andycyw/dify/docker
echo "WIKI_API_KEY=你的API_KEY" >> .env
```

**方法 B：直接編輯 docker-compose.yaml**
```yaml
  wiki-batch-importer:
    environment:
      - PORT=5050
      - WIKI_API_URL=http://wiki:3000/graphql
      - WIKI_API_KEY=你的API_KEY  # ← 替換這裡
```

### 步驟 3：重啟服務
```bash
cd /Users/andycyw/dify/docker
docker-compose -f docker-compose.yaml restart wiki-batch-importer
```

### 步驟 4：測試導入

```bash
# 創建測試文件
cat > /tmp/api_integration_test.md << 'EOF'
# GraphQL API 整合測試

這是使用 Wiki.js GraphQL API 創建的頁面。

## 功能驗證

- [x] API 認證成功
- [x] Markdown → HTML 渲染
- [x] TOC 自動生成
- [x] 頁面可在 Wiki.js 中顯示

## 代碼示例

\`\`\`python
print("Hello from GraphQL API!")
\`\`\`

| 項目 | 狀態 |
|------|------|
| 資料庫插入 | ❌ 失敗 |
| GraphQL API | ✅ 成功 |
EOF

# 上傳測試
curl -X POST http://localhost:5050/api/wiki/batch-import \
  -F "file=@/tmp/api_integration_test.md" \
  -F "targetFolder=/imported" \
  -F "pageTemplate=standard" \
  -F "namingRule=original"
```

### 步驟 5：驗證結果

**1. 檢查 API 回應**
應該看到：
```json
{
  "success": true,
  "page_id": 12,
  "wiki_url": "/wiki/imported/api_integration_test",
  "title": "api_integration_test"
}
```

**2. 檢查資料庫**
```bash
docker exec docker-db-1 psql -U wiki_app -d wiki -c \
  "SELECT id, path, title, 
    render IS NOT NULL as has_render, 
    LENGTH(render) as render_len,
    toc IS NOT NULL as has_toc
   FROM pages 
   WHERE path LIKE 'imported/%' 
   ORDER BY id DESC LIMIT 5;"
```

預期結果：
```
 id |            path                    |  title       | has_render | render_len | has_toc
----+------------------------------------+--------------+------------+------------+---------
 12 | imported/api_integration_test      | api_int...   | t          | 2456       | t
```

**3. 在 Wiki.js 網頁中查看**
- 打開：`http://localhost:3000/imported/api_integration_test`
- 應該看到：
  - ✅ 正常顯示的頁面
  - ✅ Markdown 正確渲染
  - ✅ 代碼語法高亮
  - ✅ 表格格式正確

**4. 檢查服務日誌**
```bash
docker logs wiki-batch-importer --tail 50 2>&1 | grep -E "(🔍|❌|✅)"
```

成功的日誌應該包含：
```
🔍 Creating page: path=imported/api_integration_test, title=api_integration_test
🔍 API URL: http://wiki:3000/graphql
🔍 Has API Key: True  ← 確認有 API Key
🔍 Sending GraphQL request...
🔍 Response status: 200
🔍 Response result: {'succeeded': True, ...}
✅ Page created successfully with ID: 12
```

## 🐛 常見問題

### Q1: "Forbidden" 錯誤
```
{"error": "創建 Wiki 頁面失敗: GraphQL 錯誤: [{'message': 'Forbidden', ...}]"}
```

**原因**：API Key 未配置或無權限

**解決**：
1. 確認環境變數設定：
   ```bash
   docker exec wiki-batch-importer env | grep WIKI_API_KEY
   ```
2. 如果為空，回到步驟 2 配置環境變數
3. 確認 API Key 對應的群組有 `pages:write` 權限
4. 重啟服務：
   ```bash
   docker-compose -f docker-compose.yaml restart wiki-batch-importer
   ```

### Q2: 頁面創建成功但顯示"不存在"
**可能原因**：
- 頁面設為私有（`isPrivate: true`）
- 當前使用者沒有查看權限
- 瀏覽器緩存問題

**解決**：
1. 檢查頁面設定：
   ```sql
   docker exec docker-db-1 psql -U wiki_app -d wiki -c \
     "SELECT id, path, \"isPrivate\", \"isPublished\" FROM pages WHERE id=12;"
   ```
2. 應該是：`isPrivate = f`, `isPublished = t`
3. 清除瀏覽器緩存或使用無痕模式
4. 確認使用者有該路徑的查看權限

### Q3: 容器不斷重啟
```bash
docker ps | grep wiki-batch-importer
# 顯示 Restarting (1) ...
```

**原因**：Python 語法錯誤或依賴問題

**解決**：
```bash
# 查看錯誤日誌
docker logs wiki-batch-importer --tail 30 2>&1

# 如果是語法錯誤，檢查本地檔案
python3 -m py_compile /Users/andycyw/dify/wiki/batch-import/batch_import_server.py

# 重新構建（不使用緩存）
cd /Users/andycyw/dify/docker
docker-compose -f docker-compose.yaml build --no-cache wiki-batch-importer
docker-compose -f docker-compose.yaml up -d wiki-batch-importer
```

### Q4: GraphQL Timeout
**原因**：Wiki.js 服務未就緒或網絡問題

**解決**：
```bash
# 檢查 Wiki.js 狀態
docker ps | grep wiki
docker logs dify-wiki --tail 50

# 測試連接
docker exec wiki-batch-importer curl -I http://wiki:3000/healthz

# 重啟 Wiki.js
docker-compose -f docker-compose.yaml restart wiki
```

### Q5: 清理測試數據

刪除所有失敗的導入頁面（render 為 NULL）：
```bash
docker exec docker-db-1 psql -U wiki_app -d wiki -c \
  "DELETE FROM pages WHERE path LIKE 'imported/%' AND render IS NULL;"

docker exec docker-db-1 psql -U wiki_app -d wiki -c \
  "DELETE FROM \"pageTree\" 
   WHERE path LIKE 'imported/%' 
   AND \"pageId\" NOT IN (SELECT id FROM pages);"
```

## 📐 技術架構

### 為什麼必須使用 GraphQL API？

**❌ 錯誤方式：直接資料庫插入**
```python
# 繞過了 Wiki.js 的所有處理流程
cursor.execute("""
    INSERT INTO pages (path, title, content, ...)
    VALUES (%s, %s, %s, ...)
""")
# 結果：render=NULL, toc=NULL → 頁面無法顯示
```

**✅ 正確方式：GraphQL API**
```python
# 使用 Wiki.js 官方 API
response = session.post(
    'http://wiki:3000/graphql',
    headers={'Authorization': f'Bearer {api_key}'},
    json={'query': create_mutation, 'variables': {...}}
)
# 結果：render=HTML, toc=JSON, hash=sha256 → 頁面正常工作
```

### Wiki.js 頁面創建完整流程

```
GraphQL API 請求
    ↓
認證驗證（API Key / Session）
    ↓
內容驗證
    ↓
📝 Markdown → HTML 渲染 ← 關鍵步驟！
    ↓
📑 生成 TOC（目錄）      ← 關鍵步驟！
    ↓
🔐 計算內容 hash         ← 關鍵步驟！
    ↓
💾 寫入資料庫
    ├─ content (Markdown)
    ├─ render (HTML)  ← 必須有！
    ├─ toc (JSON)     ← 必須有！
    ├─ hash (SHA-256)
    └─ 其他元數據
    ↓
🌳 更新 pageTree（導航結構）
    ↓
🔍 更新搜索索引
    ↓
✅ 返回成功回應
```

**直接插入資料庫 = 跳過所有渲染和處理步驟 = 無法使用的頁面**

### GraphQL Mutation 範例

```graphql
mutation CreatePage($content: String!, $path: String!, $title: String!) {
  pages {
    create(
      content: $content          # Markdown 原始內容
      description: "從文件導入"   # 頁面描述
      editor: "markdown"         # 編輯器類型
      isPublished: true          # 發布狀態
      isPrivate: false           # 公開/私有
      locale: "en"               # 語言代碼
      path: $path                # 路徑（不含開頭 /）
      tags: []                   # 標籤
      title: $title              # 標題
    ) {
      responseResult {
        succeeded               # 是否成功
        errorCode              # 錯誤代碼
        message                # 訊息
      }
      page {
        id                     # 頁面 ID
        path                   # 路徑
        title                  # 標題
      }
    }
  }
}
```

## 📊 程式碼改動總結

### 1. WikiJSClient 類重寫

**之前（❌ 錯誤）**：
```python
import psycopg2

class WikiJSClient:
    def __init__(self, db_config: Dict):
        self.db_config = db_config
    
    def create_page(self, ...):
        with psycopg2.connect(**self.db_config) as conn:
            cursor.execute("INSERT INTO pages ...")
```

**現在（✅ 正確）**：
```python
import requests

class WikiJSClient:
    def __init__(self, api_url: str = None, api_key: str = None):
        self.api_url = api_url or os.getenv('WIKI_API_URL')
        self.api_key = api_key or os.getenv('WIKI_API_KEY')
        self.session = requests.Session()
        if self.api_key:
            self.session.headers.update({
                'Authorization': f'Bearer {self.api_key}'
            })
    
    def create_page(self, path, title, content, metadata):
        mutation = """ ... GraphQL mutation ... """
        response = self.session.post(
            self.api_url,
            json={'query': mutation, 'variables': {...}}
        )
        # 處理回應...
```

### 2. 依賴變更

**requirements.txt**：
```diff
- psycopg2-binary==2.9.7
+ requests==2.31.0  # 已存在，用於 HTTP 請求
```

### 3. Docker 配置

**docker-compose.yaml**：
```yaml
wiki-batch-importer:
  environment:
    - PORT=5050
-   - WIKI_DB_HOST=db              # ❌ 移除資料庫配置
-   - WIKI_DB_PORT=5432
-   - WIKI_DB_NAME=wiki
-   - WIKI_DB_USER=wiki_app
-   - WIKI_DB_PASSWORD=wiki_pass
+   - WIKI_API_URL=http://wiki:3000/graphql  # ✅ 使用 API
+   - WIKI_API_KEY=${WIKI_API_KEY:-}          # ✅ API Key
  depends_on:
-   db:                             # ❌ 不再直接依賴資料庫
-     condition: service_healthy
    wiki:                           # ✅ 只依賴 Wiki.js 服務
      condition: service_started
```

## 🎯 下一步計劃

### 立即行動（優先級：🔴 高）
1. **生成並配置 API Key**（見步驟 1-3）
2. **測試單個文件導入**（步驟 4-5）
3. **驗證頁面正常顯示**

### 短期目標（優先級：🟡 中）
4. 測試各種格式：
   - PDF 文件導入
   - Word 文檔（.docx/.doc）
   - Excel 表格（.xlsx/.xls）
   - PowerPoint 簡報（.pptx/.ppt）
   - 純文本和 CSV
5. 批量導入多個文件
6. 錯誤處理和重試機制

### 長期規劃（優先級：🟢 低）
7. **SMB 同步功能**
   - 監控不同群組的 SMB 共享目錄
   - 自動檢測新文件並導入
   - 按目錄結構組織 Wiki 頁面層級
   - 支持文件更新檢測
8. 進度追蹤和通知
9. 導入歷史記錄
10. Web UI 增強（拖放上傳、預覽等）

## 📝 完整檢查清單

在聯繫您之前，請確認：

- [ ] 已在 Wiki.js 管理界面生成 API Key
- [ ] API Key 已配置到環境變數（docker-compose.yaml 或 .env）
- [ ] 重啟了 wiki-batch-importer 服務
- [ ] 服務正常運行（`docker ps` 顯示 Up 狀態）
- [ ] 上傳測試文件並收到成功回應
- [ ] 資料庫中頁面有 render 和 toc 欄位（不是 NULL）
- [ ] 可以在 Wiki.js 網頁中正常查看導入的頁面

完成以上檢查清單後，批量導入功能應該完全可用！

---

**版本**: 2.0 - GraphQL API 整合完整方案  
**日期**: 2025-10-14  
**狀態**: 🟡 等待 API Key 配置
