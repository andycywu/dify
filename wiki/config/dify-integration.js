const { GraphQLObjectType, GraphQLString, GraphQLBoolean, GraphQLNonNull } = require('graphql')

module.exports = {
  async init() {
    // Initialize Dify API client with group-based datasets
    WIKI.dify = {
      apiUrl: process.env.DIFY_API_URL || 'http://api:5001',
      // Group-based API keys and dataset mappings
      groupDatasets: {
        // Format: groupId: { apiKey: 'key', datasetName: 'name', description: 'desc' }
        'administrators': {
          apiKey: process.env.DIFY_ADMINISTRATORS_API_KEY,
          datasetName: '管理員知識庫',
          description: '系統管理相關知識和文檔'
        },
        'Guests': {
          apiKey: process.env.DIFY_GUESTS_API_KEY,
          datasetName: '訪客知識庫',
          description: '公開資訊和常見問題'
        },
        'EE': {
          apiKey: process.env.DIFY_EE_API_KEY,
          datasetName: '電機工程部門知識庫',
          description: '電機工程相關技術文檔和規範'
        },
        'ME_LCM': {
          apiKey: process.env.DIFY_ME_LCM_API_KEY,
          datasetName: '機械工程部門知識庫',
          description: '機械工程和生命週期管理相關文檔'
        },
        'PWR': {
          apiKey: process.env.DIFY_PWR_API_KEY,
          datasetName: '電源部門知識庫',
          description: '電源系統和電力相關技術文檔'
        },
        'SW': {
          apiKey: process.env.DIFY_SW_API_KEY,
          datasetName: '軟體部門知識庫',
          description: '軟體開發、架構和技術文檔'
        },
        'PJM': {
          apiKey: process.env.DIFY_PJM_API_KEY,
          datasetName: '專案管理部門知識庫',
          description: '專案管理和協調相關文檔'
        }
      },

      // Get user's groups from Wiki.js user data
      getUserGroups(user) {
        if (!user || !user.groups) return ['Guests']
        
        // Map Wiki.js groups to our dataset groups
        const userGroups = user.groups.map(group => {
          // Use exact group name match
          if (this.groupDatasets[group.name]) {
            return group.name
          }
          // Default to Guests if group not found
          return 'Guests'
        })
        
        // Remove duplicates and ensure at least Guests access
        const uniqueGroups = [...new Set(userGroups)]
        if (!uniqueGroups.includes('Guests')) {
          uniqueGroups.push('Guests') // Everyone gets guest access
        }
        
        return uniqueGroups
      },

      // Get available datasets for user
      getAvailableDatasets(user) {
        const userGroups = this.getUserGroups(user)
        const availableDatasets = {}
        
        userGroups.forEach(groupId => {
          if (this.groupDatasets[groupId]) {
            availableDatasets[groupId] = this.groupDatasets[groupId]
          }
        })
        
        return availableDatasets
      },

      // Enhanced chat completion with group-based routing
      async chatCompletion(message, conversationId = null, user = null, preferredGroup = null) {
        const userGroups = this.getUserGroups(user)
        let selectedGroup = preferredGroup
        
        // Auto-select group if not specified
        if (!selectedGroup) {
          // Priority: administrators > EE > ME_LCM > PWR > SW > PJM > Guests
          const priorityOrder = ['administrators', 'EE', 'ME_LCM', 'PWR', 'SW', 'PJM', 'Guests']
          selectedGroup = priorityOrder.find(group => userGroups.includes(group)) || 'Guests'
        }
        
        // Check if user has access to selected group
        if (!userGroups.includes(selectedGroup)) {
          return {
            success: false,
            error: '無權訪問此知識庫',
            answer: '抱歉，您沒有權限訪問此部門的知識庫。',
            availableGroups: userGroups
          }
        }
        
        const groupConfig = this.groupDatasets[selectedGroup]
        if (!groupConfig || !groupConfig.apiKey) {
          WIKI.logger.warn(`Dify API key not configured for group: ${selectedGroup}`)
          return {
            success: false,
            error: `${selectedGroup} 知識庫未配置`,
            answer: `抱歉，${groupConfig?.datasetName || selectedGroup}知識庫暫時不可用。`,
            availableGroups: userGroups
          }
        }

        try {
          const response = await fetch(`${this.apiUrl}/v1/chat-messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groupConfig.apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Wiki.js-Dify-Integration/1.0'
            },
            body: JSON.stringify({
              inputs: {
                group_context: `${groupConfig.datasetName} - ${groupConfig.description}`,
                user_groups: userGroups.join(', ')
              },
              query: message,
              response_mode: 'blocking',
              conversation_id: conversationId,
              user: user?.id || 'anonymous',
              dataset_id: selectedGroup // Pass group as dataset identifier
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
            message_id: data.message_id,
            selectedGroup: selectedGroup,
            groupName: groupConfig.datasetName,
            availableGroups: userGroups
          }
        } catch (error) {
          WIKI.logger.error(`Dify API Error for group ${selectedGroup}:`, error)
          return {
            success: false,
            error: error.message,
            answer: `抱歉，${groupConfig.datasetName}知識庫暫時不可用，請稍後再試。`,
            selectedGroup: selectedGroup,
            availableGroups: userGroups
          }
        }
      },

      async uploadFile(fileBuffer, fileName, mimeType, groupId, user) {
        const userGroups = this.getUserGroups(user)
        
        if (!userGroups.includes(groupId)) {
          throw new Error('無權在此群組上傳文件')
        }
        
        const groupConfig = this.groupDatasets[groupId]
        if (!groupConfig || !groupConfig.apiKey) {
          throw new Error(`${groupId} 知識庫未配置`)
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
              'Authorization': `Bearer ${groupConfig.apiKey}`,
              ...formData.getHeaders()
            },
            body: formData
          })

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
          }

          return await response.json()
        } catch (error) {
          WIKI.logger.error(`Dify File Upload Error for group ${groupId}:`, error)
          throw error
        }
      },

      async getConversationHistory(conversationId, groupId, user) {
        const userGroups = this.getUserGroups(user)
        
        if (!userGroups.includes(groupId)) {
          return { data: [] }
        }
        
        const groupConfig = this.groupDatasets[groupId]
        if (!groupConfig || !groupConfig.apiKey || !conversationId) {
          return { data: [] }
        }

        try {
          const response = await fetch(`${this.apiUrl}/v1/conversations/${conversationId}/messages`, {
            headers: {
              'Authorization': `Bearer ${groupConfig.apiKey}`
            }
          })

          if (!response.ok) {
            throw new Error(`History fetch failed: ${response.status}`)
          }

          return await response.json()
        } catch (error) {
          WIKI.logger.error(`Dify Conversation History Error for group ${groupId}:`, error)
          return { data: [] }
        }
      },

      async checkHealth(groupId = 'default') {
        const groupConfig = this.groupDatasets[groupId]
        if (!groupConfig || !groupConfig.apiKey) {
          return false
        }
        
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
        type DifyDataset {
          id: String!
          name: String!
          description: String!
          available: Boolean!
        }

        type DifyChatResponse {
          success: Boolean!
          answer: String!
          conversation_id: String
          message_id: String
          error: String
          selectedGroup: String
          groupName: String
          availableGroups: [String!]!
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
          availableDatasets: [DifyDataset!]!
        }

        extend type Query {
          difyHealth: DifyHealth!
          difyAvailableDatasets: [DifyDataset!]!
        }

        extend type Mutation {
          difyChat(
            message: String!
            conversationId: String
            preferredGroup: String
          ): DifyChatResponse!

          difyChatWithGroup(
            message: String!
            conversationId: String
            groupId: String!
          ): DifyChatResponse!

          difyUploadFile(
            file: Upload!
            groupId: String!
          ): DifyFileUpload!
        }
      `,

      resolvers: {
        Query: {
          difyHealth: async (parent, args, context) => {
            const user = context.req.user
            const availableDatasets = WIKI.dify.getAvailableDatasets(user)
            
            const datasetStatuses = await Promise.all(
              Object.entries(availableDatasets).map(async ([id, config]) => ({
                id,
                name: config.datasetName,
                description: config.description,
                available: await WIKI.dify.checkHealth(id)
              }))
            )
            
            const connected = datasetStatuses.some(ds => ds.available)
            
            return {
              status: connected ? 'connected' : 'disconnected',
              connected,
              api_url: WIKI.dify.apiUrl,
              availableDatasets: datasetStatuses
            }
          },

          difyAvailableDatasets: async (parent, args, context) => {
            const user = context.req.user
            const availableDatasets = WIKI.dify.getAvailableDatasets(user)
            
            return Object.entries(availableDatasets).map(([id, config]) => ({
              id,
              name: config.datasetName,
              description: config.description,
              available: !!config.apiKey
            }))
          }
        },

        Mutation: {
          difyChat: async (parent, { message, conversationId, preferredGroup }, context) => {
            // Check permissions
            if (!context.req.user || !WIKI.auth.checkAccess(context.req.user, ['read:pages'])) {
              throw new Error('Unauthorized: You must be logged in to use the AI assistant')
            }

            const result = await WIKI.dify.chatCompletion(message, conversationId, context.req.user, preferredGroup)
            
            // Log chat interaction for audit
            WIKI.logger.info(`Dify chat - User: ${context.req.user.id}, Group: ${result.selectedGroup}, Message: ${message.substring(0, 100)}...`)
            
            return result
          },

          difyChatWithGroup: async (parent, { message, conversationId, groupId }, context) => {
            // Check permissions
            if (!context.req.user || !WIKI.auth.checkAccess(context.req.user, ['read:pages'])) {
              throw new Error('Unauthorized: You must be logged in to use the AI assistant')
            }

            const result = await WIKI.dify.chatCompletion(message, conversationId, context.req.user, groupId)
            
            // Log chat interaction for audit
            WIKI.logger.info(`Dify chat with specific group - User: ${context.req.user.id}, Group: ${groupId}, Message: ${message.substring(0, 100)}...`)
            
            return result
          },

          difyUploadFile: async (parent, { file, groupId }, context) => {
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
            
            const result = await WIKI.dify.uploadFile(buffer, filename, mimetype, groupId, context.req.user)
            
            // Log file upload for audit
            WIKI.logger.info(`Dify file upload - User: ${context.req.user.id}, Group: ${groupId}, File: ${filename}, Size: ${buffer.length}`)
            
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
      const user = req.user
      WIKI.dify.checkHealth().then(connected => {
        const availableDatasets = WIKI.dify.getAvailableDatasets(user)
        res.json({
          status: connected ? 'ok' : 'error',
          dify_connected: connected,
          api_url: WIKI.dify.apiUrl,
          available_datasets: Object.keys(availableDatasets),
          user_groups: WIKI.dify.getUserGroups(user),
          timestamp: new Date().toISOString()
        })
      })
    })

    // Add endpoint to get available datasets for current user
    WIKI.app.get('/api/dify/datasets', (req, res) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      const availableDatasets = WIKI.dify.getAvailableDatasets(req.user)
      const datasets = Object.entries(availableDatasets).map(([id, config]) => ({
        id,
        name: config.datasetName,
        description: config.description,
        available: !!config.apiKey
      }))
      
      res.json({
        datasets,
        user_groups: WIKI.dify.getUserGroups(req.user)
      })
    })

    // Add middleware to inject Dify status into page context
    WIKI.app.use((req, res, next) => {
      res.locals.difyEnabled = !!WIKI.dify.apiUrl
      res.locals.difyApiUrl = WIKI.dify.apiUrl
      if (req.user) {
        res.locals.userGroups = WIKI.dify.getUserGroups(req.user)
        res.locals.availableDatasets = WIKI.dify.getAvailableDatasets(req.user)
      }
      next()
    })

    WIKI.logger.info('Dify API integration initialized successfully')
  }
}
