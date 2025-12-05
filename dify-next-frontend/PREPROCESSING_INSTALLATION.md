# 前處理系統依賴套件安裝指令

# 在 Ubuntu 伺服器上執行以下指令：

```bash
cd /path/to/dify-next-frontend

# 安裝所有必要的依賴套件
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

# 如果沒有 @types/node，也需要安裝
npm install --save-dev @types/node

# 重新建置專案
npm run build

# 啟動開發伺服器測試
npm run dev

# 或啟動生產環境
npm start
```

## 套件說明

| 套件 | 用途 | 版本建議 |
|------|------|---------|
| pdf-parse | PDF 解析 | ^1.1.1 |
| mammoth | DOCX 轉 Markdown | ^1.6.0 |
| xlsx | Excel 解析 | ^0.18.5 |
| csv-parse | CSV 解析 | ^5.5.0 |
| cheerio | HTML DOM 解析 | ^1.0.0-rc.12 |
| node-html-markdown | HTML → Markdown | ^1.3.0 |
| formidable | Multipart form 解析 | ^3.5.1 |
| @types/formidable | Formidable TypeScript 定義 | ^3.4.5 |
| gray-matter | Markdown frontmatter 解析 | ^4.0.3 |
| @types/node | Node.js TypeScript 定義 | ^20.x |

## 測試前處理功能

1. 啟動開發伺服器
2. 登入 admin 帳號
3. 進入 Knowledge Management
4. 選擇一個 Dataset
5. 點擊 "Add Document"
6. 選擇 "From File" tab
7. 上傳測試檔案（PDF/DOCX/Excel/CSV 等）
8. 檢查是否成功轉換成 Markdown

## 預期結果

- 上傳時會看到「✨ 自動前處理已啟用」提示
- 檔案會先經過前處理 API (`/api/documents/preprocess`)
- 轉換成標準 Markdown chunks
- 最終以 text 模式上傳到 Dify
- 如果前處理失敗，會自動 fallback 到原始檔案上傳

## 疑難排解

### 錯誤：找不到模組
```bash
# 確認 node_modules 存在
ls node_modules/

# 重新安裝
rm -rf node_modules package-lock.json
npm install
```

### 錯誤：Buffer is not defined
```bash
# 確認已安裝 @types/node
npm install --save-dev @types/node
```

### 錯誤：Body size limit exceeded
```bash
# 檢查 next.config.js 是否已設定：
# api: { bodyParser: { sizeLimit: '15mb' } }
```

## 檔案檢查清單

確認以下檔案已建立：

- [ ] `lib/preprocess/types.ts`
- [ ] `lib/preprocess/config.ts`
- [ ] `lib/preprocess/detector/detectFileType.ts`
- [ ] `lib/preprocess/parsers/index.ts`
- [ ] `lib/preprocess/parsers/parseTxt.ts`
- [ ] `lib/preprocess/parsers/parseMarkdown.ts`
- [ ] `lib/preprocess/parsers/parseCsv.ts`
- [ ] `lib/preprocess/parsers/parseExcel.ts`
- [ ] `lib/preprocess/parsers/parseDocx.ts`
- [ ] `lib/preprocess/parsers/parsePdf.ts`
- [ ] `lib/preprocess/parsers/parseHtml.ts`
- [ ] `lib/preprocess/parsers/parseVtt.ts`
- [ ] `lib/preprocess/parsers/parseProperties.ts`
- [ ] `lib/preprocess/chunker/chunkMarkdown.ts`
- [ ] `lib/preprocess/index.ts`
- [ ] `pages/api/documents/preprocess.ts`
- [ ] `components/Knowledge/DocumentManagement.tsx` (已修改)
- [ ] `next.config.js` (已修改)
