const { GraphQLObjectType, GraphQLString, GraphQLBoolean, GraphQLNonNull } = require('graphql')

module.exports = {
  async init() {
    // Initialize Dify API client
    WIKI.dify = {
      apiUrl: process.env.DIFY_API_URL || 'http://api:5001',
      apiKey: process.env.DIFY_API_KEY,
      
      async chatCompletion(message, conversationId = null, userId = 'wiki-user') {
        if (!this.apiKey) {
          WIKI.logger.warn('Dify API key not configured')
          return {
            success: false,
            error: 'Dify API key not configured',
            answer: '抱歉，AI 服務未正確配置。請聯繫管理員。'
          }
        }

        try {
          const response = await fetch(`${this.apiUrl}/v1/chat-messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Wiki.js-Dify-Integration/1.0'
            },
            body: JSON.stringify({
              inputs: {},
              query: message,
              response_mode: 'blocking',
              conversation_id: conversationId,
              user: userId
            })
          })

          if (!response.ok) {
            throw new Error(`Dify API Error: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()
          return {
            success: true,
            answer: data.answer,
            conversation_id: data.conversation_id,
            message_id: data.message_id
          }
        } catch (error) {
          WIKI.logger.error('Dify API Error:', error)
          return {
            success: false,
            error: error.message,
            answer: '抱歉，AI 服務暫時不可用，請稍後再試。'
          }
        }
      },

      async uploadFile(fileBuffer, fileName, mimeType) {
        if (!this.apiKey) {
          throw new Error('Dify API key not configured')
        }

        try {
          const FormData = require('form-data')
          const formData = new FormData()
          formData.append('file', fileBuffer, {
            filename: fileName,
            contentType: mimeType
          })

          const response = await fetch(`${this.apiUrl}/v1/files/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              ...formData.getHeaders()
            },
            body: formData
          })

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
          }

          return await response.json()
        } catch (error) {
          WIKI.logger.error('Dify File Upload Error:', error)
          throw error
        }
      },

      async getConversationHistory(conversationId) {
        if (!this.apiKey || !conversationId) {
          return { data: [] }
        }

        try {
          const response = await fetch(`${this.apiUrl}/v1/conversations/${conversationId}/messages`, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            }
          })

          if (!response.ok) {
            throw new Error(`History fetch failed: ${response.status}`)
          }

          return await response.json()
        } catch (error) {
          WIKI.logger.error('Dify Conversation History Error:', error)
          return { data: [] }
        }
      },

      async checkHealth() {
        try {
          const response = await fetch(`${this.apiUrl}/health`, {
            timeout: 5000
          })
          return response.ok
        } catch (error) {
          return false
        }
      }
    }

    // Register GraphQL resolvers
    WIKI.graphql.extend({
      typeDefs: `
        type DifyChatResponse {
          success: Boolean!
          answer: String!
          conversation_id: String
          message_id: String
          error: String
        }

        type DifyFileUpload {
          id: String!
          name: String!
          url: String!
          mime_type: String!
          size: Int
        }

        type DifyHealth {
          status: String!
          connected: Boolean!
          api_url: String!
        }

        extend type Query {
          difyHealth: DifyHealth!
        }

        extend type Mutation {
          difyChat(
            message: String!
            conversationId: String
            userId: String
          ): DifyChatResponse!

          difyUploadFile(
            file: Upload!
          ): DifyFileUpload!
        }
      `,

      resolvers: {
        Query: {
          difyHealth: async () => {
            const connected = await WIKI.dify.checkHealth()
            return {
              status: connected ? 'connected' : 'disconnected',
              connected,
              api_url: WIKI.dify.apiUrl
            }
          }
        },

        Mutation: {
          difyChat: async (parent, { message, conversationId, userId }, context) => {
            // Check permissions
            if (!context.req.user || !WIKI.auth.checkAccess(context.req.user, ['read:pages'])) {
              throw new Error('Unauthorized: You must be logged in to use the AI assistant')
            }

            const actualUserId = userId || context.req.user.id || 'anonymous'
            const result = await WIKI.dify.chatCompletion(message, conversationId, actualUserId)
            
            // Log chat interaction for audit
            WIKI.logger.info(`Dify chat - User: ${actualUserId}, Message: ${message.substring(0, 100)}...`)
            
            return result
          },

          difyUploadFile: async (parent, { file }, context) => {
            // Check upload permissions
            if (!context.req.user || !WIKI.auth.checkAccess(context.req.user, ['write:assets'])) {
              throw new Error('Unauthorized: You do not have permission to upload files')
            }

            const { createReadStream, filename, mimetype } = await file
            const stream = createReadStream()
            const chunks = []
            
            for await (const chunk of stream) {
              chunks.push(chunk)
            }
            
            const buffer = Buffer.concat(chunks)
            
            // Check file size limit (10MB)
            if (buffer.length > 10 * 1024 * 1024) {
              throw new Error('File too large. Maximum size is 10MB.')
            }
            
            const result = await WIKI.dify.uploadFile(buffer, filename, mimetype)
            
            // Log file upload for audit
            WIKI.logger.info(`Dify file upload - User: ${context.req.user.id}, File: ${filename}, Size: ${buffer.length}`)
            
            return {
              ...result,
              size: buffer.length
            }
          }
        }
      }
    })

    // Add REST API endpoints
    WIKI.app.get('/api/dify/health', (req, res) => {
      WIKI.dify.checkHealth().then(connected => {
        res.json({
          status: connected ? 'ok' : 'error',
          dify_connected: connected,
          api_url: WIKI.dify.apiUrl,
          timestamp: new Date().toISOString()
        })
      })
    })

    // Add middleware to inject Dify status into page context
    WIKI.app.use((req, res, next) => {
      res.locals.difyEnabled = !!WIKI.dify.apiKey
      res.locals.difyApiUrl = WIKI.dify.apiUrl
      next()
    })

    WIKI.logger.info('Dify API integration initialized successfully')
  }
}
