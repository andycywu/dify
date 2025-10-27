/**
 * Wiki.js 認證整合模組
 * 提供 GraphQL API 供 dify-next-frontend 使用
 */

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

module.exports = {
  async init() {
    WIKI.logger.info('Initializing Authentication Integration Module...')

    // JWT 密鑰 (應該從環境變數讀取)
    const JWT_SECRET = process.env.JWT_SECRET || 'dify-wiki-integration-secret-key-change-in-production'
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

    // 擴展 GraphQL Schema
    WIKI.graphql.extend({
      typeDefs: `
        # 認證相關類型定義
        type AuthUser {
          id: Int!
          email: String!
          name: String!
          isActive: Boolean!
          isSystem: Boolean!
          groups: [UserGroup!]!
          createdAt: String
          updatedAt: String
        }

        type UserGroup {
          id: Int!
          name: String!
        }

        type AuthResponse {
          success: Boolean!
          message: String
          token: String
          user: AuthUser
        }

        type UserCreateResponse {
          success: Boolean!
          message: String
          user: AuthUser
        }

        type UserUpdateResponse {
          success: Boolean!
          message: String
          user: AuthUser
        }

        # 擴展 Query
        extend type Query {
          # 驗證 token 並返回用戶信息
          authVerifyToken(token: String!): AuthResponse!
          
          # 獲取用戶信息 (通過 email)
          authGetUser(email: String!): AuthUser
          
          # 獲取所有活躍用戶
          authGetAllUsers: [AuthUser!]!
        }

        # 擴展 Mutation
        extend type Mutation {
          # 用戶登入
          authLogin(
            email: String!
            password: String!
          ): AuthResponse!

          # 創建新用戶
          authCreateUser(
            email: String!
            password: String!
            name: String!
            groups: [Int!]
          ): UserCreateResponse!

          # 更新用戶信息
          authUpdateUser(
            id: Int!
            email: String
            name: String
            password: String
            groups: [Int!]
            isActive: Boolean
          ): UserUpdateResponse!

          # 刪除用戶
          authDeleteUser(id: Int!): AuthResponse!

          # 修改密碼
          authChangePassword(
            email: String!
            oldPassword: String!
            newPassword: String!
          ): AuthResponse!
        }
      `,

      resolvers: {
        Query: {
          /**
           * 驗證 JWT token
           */
          authVerifyToken: async (parent, { token }, context) => {
            try {
              const decoded = jwt.verify(token, JWT_SECRET)
              
              // 從數據庫獲取用戶信息
              const user = await WIKI.db.users.query()
                .findById(decoded.userId)
                .where('isActive', true)

              if (!user) {
                return {
                  success: false,
                  message: '用戶不存在或已停用',
                  token: null,
                  user: null
                }
              }

              // 獲取用戶組
              const groups = await WIKI.db.knex('userGroups')
                .join('groups', 'userGroups.groupId', 'groups.id')
                .where('userGroups.userId', user.id)
                .select('groups.id', 'groups.name')

              return {
                success: true,
                message: 'Token 有效',
                token,
                user: {
                  ...user,
                  groups
                }
              }
            } catch (error) {
              WIKI.logger.warn(`Token verification failed: ${error.message}`)
              return {
                success: false,
                message: 'Token 無效或已過期',
                token: null,
                user: null
              }
            }
          },

          /**
           * 通過 email 獲取用戶信息
           */
          authGetUser: async (parent, { email }, context) => {
            try {
              const user = await WIKI.db.users.query()
                .where('email', email)
                .first()

              if (!user) {
                return null
              }

              // 獲取用戶組
              const groups = await WIKI.db.knex('userGroups')
                .join('groups', 'userGroups.groupId', 'groups.id')
                .where('userGroups.userId', user.id)
                .select('groups.id', 'groups.name')

              return {
                ...user,
                groups
              }
            } catch (error) {
              WIKI.logger.error(`Error fetching user: ${error.message}`)
              throw error
            }
          },

          /**
           * 獲取所有活躍用戶
           */
          authGetAllUsers: async (parent, args, context) => {
            try {
              const users = await WIKI.db.users.query()
                .where('isSystem', false)
                .orderBy('createdAt', 'desc')

              // 為每個用戶獲取組信息
              const usersWithGroups = await Promise.all(
                users.map(async (user) => {
                  const groups = await WIKI.db.knex('userGroups')
                    .join('groups', 'userGroups.groupId', 'groups.id')
                    .where('userGroups.userId', user.id)
                    .select('groups.id', 'groups.name')

                  return {
                    ...user,
                    groups
                  }
                })
              )

              return usersWithGroups
            } catch (error) {
              WIKI.logger.error(`Error fetching users: ${error.message}`)
              throw error
            }
          }
        },

        Mutation: {
          /**
           * 用戶登入
           */
          authLogin: async (parent, { email, password }, context) => {
            try {
              // 查找用戶
              const user = await WIKI.db.users.query()
                .where('email', email)
                .where('isActive', true)
                .first()

              if (!user) {
                return {
                  success: false,
                  message: '用戶名或密碼錯誤',
                  token: null,
                  user: null
                }
              }

              // 驗證密碼
              const isValidPassword = await bcrypt.compare(password, user.password)
              
              if (!isValidPassword) {
                return {
                  success: false,
                  message: '用戶名或密碼錯誤',
                  token: null,
                  user: null
                }
              }

              // 獲取用戶組
              const groups = await WIKI.db.knex('userGroups')
                .join('groups', 'userGroups.groupId', 'groups.id')
                .where('userGroups.userId', user.id)
                .select('groups.id', 'groups.name')

              // 生成 JWT token
              const token = jwt.sign(
                {
                  userId: user.id,
                  email: user.email,
                  name: user.name
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
              )

              // 更新最後登入時間
              await WIKI.db.users.query()
                .patch({ lastLoginAt: new Date().toISOString() })
                .where('id', user.id)

              return {
                success: true,
                message: '登入成功',
                token,
                user: {
                  ...user,
                  groups
                }
              }
            } catch (error) {
              WIKI.logger.error(`Login error: ${error.message}`)
              return {
                success: false,
                message: '登入失敗,請稍後再試',
                token: null,
                user: null
              }
            }
          },

          /**
           * 創建新用戶
           */
          authCreateUser: async (parent, { email, password, name, groups }, context) => {
            try {
              // 檢查 email 是否已存在
              const existingUser = await WIKI.db.users.query()
                .where('email', email)
                .first()

              if (existingUser) {
                return {
                  success: false,
                  message: 'Email 已被使用',
                  user: null
                }
              }

              // 密碼加密
              const hashedPassword = await bcrypt.hash(password, 10)

              // 創建用戶
              const newUser = await WIKI.db.users.query().insert({
                email,
                password: hashedPassword,
                name,
                providerId: 'local',
                providerKey: 'local',
                isActive: true,
                isSystem: false,
                isVerified: true,
                mustChangePwd: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })

              // 如果提供了用戶組,添加到 userGroups
              if (groups && groups.length > 0) {
                await Promise.all(
                  groups.map(groupId =>
                    WIKI.db.knex('userGroups').insert({
                      userId: newUser.id,
                      groupId
                    })
                  )
                )
              } else {
                // 默認添加到 Guests 組 (假設 id=2)
                const guestGroup = await WIKI.db.groups.query()
                  .where('name', 'Guests')
                  .first()
                
                if (guestGroup) {
                  await WIKI.db.knex('userGroups').insert({
                    userId: newUser.id,
                    groupId: guestGroup.id
                  })
                }
              }

              // 獲取用戶組信息
              const userGroups = await WIKI.db.knex('userGroups')
                .join('groups', 'userGroups.groupId', 'groups.id')
                .where('userGroups.userId', newUser.id)
                .select('groups.id', 'groups.name')

              return {
                success: true,
                message: '用戶創建成功',
                user: {
                  ...newUser,
                  groups: userGroups
                }
              }
            } catch (error) {
              WIKI.logger.error(`Create user error: ${error.message}`)
              return {
                success: false,
                message: `創建用戶失敗: ${error.message}`,
                user: null
              }
            }
          },

          /**
           * 更新用戶信息
           */
          authUpdateUser: async (parent, { id, email, name, password, groups, isActive }, context) => {
            try {
              const updateData = {}
              
              if (email !== undefined) updateData.email = email
              if (name !== undefined) updateData.name = name
              if (isActive !== undefined) updateData.isActive = isActive
              
              // 如果要更新密碼
              if (password) {
                updateData.password = await bcrypt.hash(password, 10)
              }

              updateData.updatedAt = new Date().toISOString()

              // 更新用戶基本信息
              await WIKI.db.users.query()
                .patch(updateData)
                .where('id', id)

              // 如果提供了用戶組,更新用戶組
              if (groups !== undefined) {
                // 先刪除現有的用戶組關聯
                await WIKI.db.knex('userGroups')
                  .where('userId', id)
                  .delete()

                // 添加新的用戶組關聯
                if (groups.length > 0) {
                  await Promise.all(
                    groups.map(groupId =>
                      WIKI.db.knex('userGroups').insert({
                        userId: id,
                        groupId
                      })
                    )
                  )
                }
              }

              // 獲取更新後的用戶信息
              const updatedUser = await WIKI.db.users.query()
                .findById(id)

              const userGroups = await WIKI.db.knex('userGroups')
                .join('groups', 'userGroups.groupId', 'groups.id')
                .where('userGroups.userId', id)
                .select('groups.id', 'groups.name')

              return {
                success: true,
                message: '用戶更新成功',
                user: {
                  ...updatedUser,
                  groups: userGroups
                }
              }
            } catch (error) {
              WIKI.logger.error(`Update user error: ${error.message}`)
              return {
                success: false,
                message: `更新用戶失敗: ${error.message}`,
                user: null
              }
            }
          },

          /**
           * 刪除用戶
           */
          authDeleteUser: async (parent, { id }, context) => {
            try {
              // 檢查是否為系統用戶
              const user = await WIKI.db.users.query().findById(id)
              
              if (!user) {
                return {
                  success: false,
                  message: '用戶不存在',
                  token: null,
                  user: null
                }
              }

              if (user.isSystem) {
                return {
                  success: false,
                  message: '無法刪除系統用戶',
                  token: null,
                  user: null
                }
              }

              // 刪除用戶組關聯
              await WIKI.db.knex('userGroups')
                .where('userId', id)
                .delete()

              // 刪除用戶
              await WIKI.db.users.query()
                .deleteById(id)

              return {
                success: true,
                message: '用戶刪除成功',
                token: null,
                user: null
              }
            } catch (error) {
              WIKI.logger.error(`Delete user error: ${error.message}`)
              return {
                success: false,
                message: `刪除用戶失敗: ${error.message}`,
                token: null,
                user: null
              }
            }
          },

          /**
           * 修改密碼
           */
          authChangePassword: async (parent, { email, oldPassword, newPassword }, context) => {
            try {
              const user = await WIKI.db.users.query()
                .where('email', email)
                .first()

              if (!user) {
                return {
                  success: false,
                  message: '用戶不存在',
                  token: null,
                  user: null
                }
              }

              // 驗證舊密碼
              const isValidPassword = await bcrypt.compare(oldPassword, user.password)
              
              if (!isValidPassword) {
                return {
                  success: false,
                  message: '原密碼錯誤',
                  token: null,
                  user: null
                }
              }

              // 更新密碼
              const hashedPassword = await bcrypt.hash(newPassword, 10)
              await WIKI.db.users.query()
                .patch({
                  password: hashedPassword,
                  updatedAt: new Date().toISOString()
                })
                .where('id', user.id)

              return {
                success: true,
                message: '密碼修改成功',
                token: null,
                user: null
              }
            } catch (error) {
              WIKI.logger.error(`Change password error: ${error.message}`)
              return {
                success: false,
                message: `密碼修改失敗: ${error.message}`,
                token: null,
                user: null
              }
            }
          }
        }
      }
    })

    WIKI.logger.info('Authentication Integration Module initialized successfully')
  }
}
