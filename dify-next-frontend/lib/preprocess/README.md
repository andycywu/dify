# 🚀 前處理系統 (Preprocessing System)

## 📝 概述

這個前處理系統為 dify-next-frontend 的 Knowledge Management 功能新增了**全格式文件自動轉換**能力。

### 支援格式
- ✅ **文字格式**: TXT, Markdown, MDX, Properties
- ✅ **文件格式**: PDF, DOCX
- ✅ **表格格式**: CSV, Excel (XLSX, XLS)
- ✅ **網頁格式**: HTML, HTM
- ✅ **字幕格式**: WebVTT

### 核心功能
1. **自動格式偵測**：根據副檔名與 MIME type 判斷
2. **智能解析**：每種格式使用專用 parser
3. **標準化輸出**：統一轉換成 Markdown chunks（格式 A）
4. **錯誤容錯**：前處理失敗自動 fallback 到原始上傳

---

## 🏗️ 架構

```
用戶上傳檔案
    │
    ▼
前處理 API (/api/documents/preprocess)
    │
    ├─► detectFileType()    # 偵測格式
    ├─► parseFile()          # 解析內容
    ├─► chunkMarkdown()      # 切分成 chunks
    └─► 回傳 Markdown string
    │
    ▼
送到 Dify API (以 text 模式)
    │
    ▼
儲存到 Knowledge Base
```

---

## 📦 安裝

### 1. 安裝依賴套件

```bash
cd dify-next-frontend

npm install --save \
  pdf-parse \
  mammoth \
  xlsx \
  csv-parse \
  cheerio \
  node-html-markdown \
  formidable \
  @types/formidable \
  gray-matter

npm install --save-dev @types/node
```

### 2. 檢查檔案

```bash
# 在 Linux/Mac 上
chmod +x check-preprocessing-files.sh
./check-preprocessing-files.sh

# 在 Windows 上
# 手動檢查 PREPROCESSING_INSTALLATION.md 中的檔案清單
```

### 3. 建置

```bash
npm run build
```

### 4. 啟動

```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

---

## 🧪 測試

### 1. 基本測試

1. 登入 admin 帳號
2. 進入 Knowledge Management
3. 選擇一個 Dataset
4. 點擊 "Add Document"
5. 選擇 "From File" tab
6. 應該會看到 "✨ 自動前處理已啟用" 提示
7. 上傳測試檔案

### 2. 建議測試順序

```bash
# 簡單 → 複雜
1. TXT 檔案      (最簡單)
2. Markdown      
3. CSV           
4. Properties    
5. HTML          
6. VTT           
7. Excel         (較複雜)
8. PDF           (較複雜)
9. DOCX          (最複雜)
```

### 3. 驗證結果

- ✅ 檔案成功上傳
- ✅ 轉換成 Markdown 格式
- ✅ 內容正確顯示
- ✅ 可搜尋到內容

---

## 🔧 API 使用

### POST /api/documents/preprocess

**Request:**
```http
POST /api/documents/preprocess
Content-Type: multipart/form-data

file: <binary file>
```

**Response (成功):**
```json
{
  "success": true,
  "markdown": "# Title\n\nContent...\n\n---",
  "chunks": [
    {
      "title": "Title",
      "body": "Content...",
      "metadata": {}
    }
  ],
  "metadata": {
    "originalFileType": "pdf",
    "chunkCount": 5,
    "totalCharacters": 2048,
    "processingTimeMs": 1234
  }
}
```

**Response (失敗):**
```json
{
  "success": false,
  "markdown": "",
  "chunks": [],
  "metadata": {
    "originalFileType": "unknown",
    "chunkCount": 0,
    "totalCharacters": 0,
    "processingTimeMs": 100
  },
  "error": "Unsupported file type: unknown"
}
```

---

## 🔌 程式化使用

```typescript
import { preprocessFile } from '@/lib/preprocess';

// 使用範例
const buffer = await fs.readFile('document.pdf');
const result = await preprocessFile(buffer, 'document.pdf', 'application/pdf');

if (result.success) {
  console.log('Markdown:', result.markdown);
  console.log('Chunks:', result.chunks.length);
} else {
  console.error('Error:', result.error);
}
```

---

## 📚 格式 A 說明

所有檔案最終都會轉換成「格式 A」：

```markdown
# <標題>

<內容>

---
```

### 範例 1: TXT/Markdown
```markdown
# 產品說明

這是產品的詳細介紹...

---
```

### 範例 2: CSV/Excel
```markdown
# Row 1

**Name:** John
**Age:** 30
**City:** Taipei

---

# Row 2

**Name:** Mary
**Age:** 25
**City:** Kaohsiung

---
```

### 範例 3: PDF/DOCX
```markdown
# Chapter 1: Introduction

This is the first chapter...

---

# Chapter 2: Methods

This is the second chapter...

---
```

---

## ⚙️ 配置

### Chunking 設定

編輯 `lib/preprocess/config.ts`:

```typescript
export const DEFAULT_CHUNK_OPTIONS = {
  maxChunkSize: 2000,           // 最大字元數
  separator: '\n\n---\n\n',     // 分隔符號
  preserveHeadings: true        // 保留標題結構
};
```

### 檔案大小限制

編輯 `next.config.js`:

```javascript
api: {
  bodyParser: {
    sizeLimit: '15mb'  // 調整大小限制
  }
}
```

---

## 🐛 疑難排解

### 問題 1: 找不到模組
```bash
npm install
```

### 問題 2: TypeScript 錯誤
```bash
npm install --save-dev @types/node @types/formidable
```

### 問題 3: PDF 解析失敗
```bash
# 確認已安裝 pdf-parse
npm list pdf-parse

# 重新安裝
npm install --save pdf-parse
```

### 問題 4: 檔案太大 (413)
```bash
# 檢查 next.config.js
# 如果在 nginx 後面，調整 nginx:
# client_max_body_size 15M;
```

### 問題 5: 前處理一直失敗
```bash
# 檢查 browser console
# 檢查 server logs
# 確認所有套件都已安裝

npm list pdf-parse mammoth xlsx csv-parse cheerio node-html-markdown formidable
```

---

## 📊 效能指標

| 檔案類型 | 檔案大小 | 預期處理時間 |
|---------|---------|------------|
| TXT     | 1MB     | < 100ms    |
| Markdown| 1MB     | < 200ms    |
| CSV     | 1MB     | < 300ms    |
| Excel   | 5MB     | < 2s       |
| HTML    | 1MB     | < 500ms    |
| DOCX    | 5MB     | < 3s       |
| PDF     | 10MB    | < 10s      |

---

## 🔒 安全性

- ✅ 檔案大小限制（15MB）
- ✅ 支援格式白名單
- ✅ MIME type 驗證
- ✅ 自動清理暫存檔
- ✅ 錯誤訊息不洩漏敏感資訊

---

## 🚀 擴展

### 新增格式支援

1. 建立新 parser: `lib/preprocess/parsers/parseNewFormat.ts`

```typescript
import { NormalizedDocument, FileType } from '../types';

export async function parseNewFormat(
  buffer: Buffer,
  fileName: string
): Promise<NormalizedDocument> {
  // 實作解析邏輯
  return {
    title: fileName,
    content: '...',
    metadata: { ... }
  };
}
```

2. 更新 `FileType` enum 在 `types.ts`

3. 更新 parser router 在 `parsers/index.ts`

4. 測試新格式

---

## 📄 授權

與 dify-next-frontend 專案相同

---

## 🙏 致謝

使用的開源套件：
- [pdf-parse](https://www.npmjs.com/package/pdf-parse)
- [mammoth](https://www.npmjs.com/package/mammoth)
- [xlsx](https://www.npmjs.com/package/xlsx)
- [csv-parse](https://www.npmjs.com/package/csv-parse)
- [cheerio](https://www.npmjs.com/package/cheerio)
- [node-html-markdown](https://www.npmjs.com/package/node-html-markdown)
- [formidable](https://www.npmjs.com/package/formidable)

---

**需要協助？請查看 [PREPROCESSING_INSTALLATION.md](./PREPROCESSING_INSTALLATION.md) 和 [PREPROCESSING_IMPLEMENTATION_SUMMARY.md](./PREPROCESSING_IMPLEMENTATION_SUMMARY.md)**
