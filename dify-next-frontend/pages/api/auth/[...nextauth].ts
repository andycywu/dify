/**
 * NextAuth Configuration with Wiki.js Integration
 * 使用 Wiki.js PostgreSQL 數據庫進行統一認證
 */

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyUserCredentials, getUserRole } from '../../../lib/wiki-auth-adapter'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // 使用 Wiki.js 適配器驗證用戶
          const user = await verifyUserCredentials(
            credentials.username,
            credentials.password
          )

        if (!user) {
          return null
        }

          // 根據用戶組判斷角色
          const role = getUserRole(user.groups)

          return {
            id: user.id.toString(), // NextAuth 需要 string 類型的 id
            name: user.name,
            email: user.email,
            role: role,
            groups: user.groups.map(g => g.name), // 轉換為字符串數組
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  pages: {
    signIn: `${basePath}/login`,
    error: `${basePath}/login`,
  },

  // 添加自定義事件處理
  events: {
    async signIn({ user, account, profile }) {
      console.log('NextAuth signIn event:', { user: user.email, account: account?.provider });
    },
    async signOut({ session, token }) {
      console.log('NextAuth signOut event:', { user: session?.user?.email });
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      // 初次登入時保存用戶信息到 token
      if (user) {
        token.id = user.id
        token.role = user.role
        token.groups = user.groups
      }
      return token
    },

    async session({ session, token }) {
      // 將 token 中的信息傳遞到 session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        // @ts-ignore - 添加 groups 到 session
        session.user.groups = token.groups
      }
      return session
    },

    async redirect({ url, baseUrl: nextAuthBaseUrl }) {
      // 使用明確定義的 baseUrl，確保包含正確的端口
      const correctBaseUrl = baseUrl // 使用我們定義的 baseUrl
      
      console.log('NextAuth redirect:', { url, nextAuthBaseUrl, correctBaseUrl })
      
      // 處理登出後的重導向
      if (url.includes('signout') || url.includes('logout')) {
        const loginUrl = `${correctBaseUrl}/login`
        console.log('Logout redirect to:', loginUrl)
        return loginUrl
      }
      
      // 處理登入後的重導向
      if (url.includes('signin') || url.includes('login')) {
        // 如果有指定的 callbackUrl，使用它
        if (url.includes('callbackUrl=')) {
          const urlParams = new URLSearchParams(url.split('?')[1])
          const callbackUrl = urlParams.get('callbackUrl')
          if (callbackUrl) {
            try {
              const decodedUrl = decodeURIComponent(callbackUrl)
              // 驗證 URL 是否屬於我們的域名
              if (decodedUrl.startsWith(correctBaseUrl) || decodedUrl.startsWith('/')) {
                return decodedUrl.startsWith('/') ? `${correctBaseUrl}${decodedUrl}` : decodedUrl
              }
            } catch (e) {
              console.warn('Invalid callbackUrl:', callbackUrl)
            }
          }
        }
        // 默認登入後跳轉到 dashboard
        return `${correctBaseUrl}/dashboard`
      }
      
      // 如果是相對路徑，使用正確的 baseUrl
      if (url.startsWith('/')) {
        return `${correctBaseUrl}${url}`
      }
      
      // 如果 URL 已經是完整的且包含正確端口，使用它
      try {
        const urlObj = new URL(url)
        const baseUrlObj = new URL(correctBaseUrl)
        if (urlObj.hostname === baseUrlObj.hostname && urlObj.port === baseUrlObj.port) {
          return url
        }
      } catch (e) {
        // URL 解析失敗，使用默認行為
        console.warn('URL parsing failed:', e)
      }
      
      // 否則導向到正確的 baseUrl
      return correctBaseUrl
    },
  },

  // 調試模式 (生產環境應關閉)
  debug: process.env.NODE_ENV === 'development',
})
