/**
 * Wiki.js Authentication Adapter for dify-next-frontend
 * 提供與 Wiki.js PostgreSQL 數據庫的認證整合
 */

import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// 用戶類型定義
export interface WikiUser {
  id: number
  email: string
  name: string
  isActive: boolean
  isVerified: boolean
  groups: Array<{
    id: number
    name: string
  }>
}

/**
 * 驗證用戶憑證
 * @param email 用戶 email
 * @param password 明文密碼
 * @returns WikiUser 或 null
 */
export async function verifyUserCredentials(
  email: string,
  password: string
): Promise<WikiUser | null> {
  try {
    // 查詢用戶及其用戶組 - 使用 findFirst 因為 email 不是唯一索引
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        providerKey: 'local' // Wiki.js 預設的本地認證提供者
      },
      include: {
        userGroups: {
          include: {
            group: true
          }
        }
      }
    })

    if (!user) {
      console.log(`User not found: ${email}`)
      return null
    }

    // 檢查用戶狀態
    if (!user.isActive) {
      console.log(`User is inactive: ${email}`)
      return null
    }

    // 檢查密碼是否存在
    if (!user.password) {
      console.log(`User has no password set: ${email}`)
      return null
    }

    // 驗證密碼 (Wiki.js 使用 bcrypt)
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${email}`)
      return null
    }

    // 轉換用戶組格式
    const groups = user.userGroups.map((ug: any) => ({
      id: ug.group.id,
      name: ug.group.name
    }))

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      isVerified: user.isVerified,
      groups
    }
  } catch (error) {
    console.error('Error verifying user credentials:', error)
    return null
  }
}

/**
 * 根據用戶組判斷角色
 * @param groups 用戶組陣列
 * @returns 角色字串 ('admin' | 'user')
 */
export function getUserRole(groups: Array<{ id: number; name: string }>): string {
  // 檢查是否為管理員組
  const adminGroups = ['administrators', 'Administrators', 'admin', 'Admin']

  if (groups.some(g => adminGroups.includes(g.name))) {
    return 'admin'
  }

  return 'user'
}

/**
 * 根據用戶 ID 獲取用戶資訊
 * @param userId 用戶 ID
 * @returns WikiUser 或 null
 */
export async function getUserById(userId: number): Promise<WikiUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userGroups: {
          include: {
            group: true
          }
        }
      }
    })

    if (!user) {
      return null
    }

    const groups = user.userGroups.map((ug: any) => ({
      id: ug.group.id,
      name: ug.group.name
    }))

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      isVerified: user.isVerified,
      groups
    }
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}
