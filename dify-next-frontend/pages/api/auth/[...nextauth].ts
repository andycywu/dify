/**
 * NextAuth Configuration with Wiki.js Integration
 * 使用 Wiki.js PostgreSQL 數據庫進行統一認證
 */

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyUserCredentials, getUserRole } from '../../../lib/wiki-auth-adapter'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

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
            console.log('Authentication failed for:', credentials.username)
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
    signOut: `${basePath}/logout`,
    error: `${basePath}/login`,
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
  },

  // 調試模式 (生產環境應關閉)
  debug: process.env.NODE_ENV === 'development',
})
