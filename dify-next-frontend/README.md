# Dify Next.js Frontend

This project is a Next.js frontend application designed to integrate with the Dify multi-container management system. It includes user login management and usage cost management features, providing a responsive and visually appealing user interface.

## 快速啟動

```sh
npm install
npm run dev
```

預設啟動於 http://localhost:3000

## 主要功能
- 登入/註冊/登出（next-auth，支援 email/password、Google OAuth）
- 用量/費用查詢（/usage 頁面，串接 API）
- 多語系（中/英文，react-i18next）
- 響應式 UI（Tailwind CSS + shadcn/ui）

## Project Structure

```
dify-next-frontend
├── public
│   └── favicon.ico          # Favicon for the application
├── src
│   ├── components
│   │   ├── Auth
│   │   │   └── LoginForm.tsx # Component for user login
│   │   ├── Layout
│   │   │   └── Header.tsx    # Navigation bar component
│   │   └── Usage
│   │       └── UsageCostTable.tsx # Component to display usage costs
│   ├── pages
│   │   ├── _app.tsx         # Custom App component
│   │   ├── _document.tsx     # Custom Document structure
│   │   ├── index.tsx        # Main landing page
│   │   ├── login.tsx        # Login page
│   │   └── usage.tsx        # Usage costs page
│   ├── styles
│   │   └── globals.css       # Global CSS styles
│   ├── utils
│   │   └── auth.ts           # Authentication utility functions
│   └── types
│       └── index.ts          # TypeScript interfaces and types
├── .env.example               # Template for environment variables
├── next.config.js            # Next.js configuration settings
├── package.json               # npm configuration file
├── tsconfig.json             # TypeScript configuration file
└── README.md                  # Project documentation
```

## 環境變數
請參考 `.env.example`，複製為 `.env` 並依需求修改。

## 主要環境變數
- `API_URL`：後端 API base url（預設 http://localhost:5000/api）
- `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`：Google OAuth 登入用

## API 串接
- 用量/費用查詢預設呼叫 `/api/usage-costs`，請依實際後端 API 實作。

---
如需更多自訂功能，請參考原始碼或聯絡開發者。