<template>
  <div class="dify-chatbot" v-if="enabled">
    <!-- 浮動聊天按鈕 -->
    <transition name="fab-bounce">
      <button 
        v-if="!isOpen" 
        @click="toggleChat" 
        class="chat-fab"
        :class="{ 'pulse': hasUnread, 'error': !isConnected }"
        :title="isConnected ? 'Dify AI 助手' : 'AI 服務離線'"
      >
        <svg v-if="isConnected" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04 1.05 4.39L1 23l6.61-2.05C9.96 21.64 11.46 22 13 22h7c1.1 0 2-.9 2-2V12c0-5.52-4.48-10-10-10z"/>
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04 1.05 4.39L1 23l6.61-2.05C9.96 21.64 11.46 22 13 22h7c1.1 0 2-.9 2-2V12c0-5.52-4.48-10-10-10zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        <span class="chat-label">{{ isConnected ? 'AI助手' : '離線' }}</span>
      </button>
    </transition>

    <!-- 聊天窗口 -->
    <transition name="chat-slide">
      <div v-if="isOpen" class="chat-window">
        <!-- 頭部 -->
        <div class="chat-header">
          <div class="header-info">
            <h3>
              <span class="header-icon">🤖</span>
              Dify AI 助手
            </h3>
            <div class="status-indicator">
              <span class="status-dot" :class="{ online: isConnected }"></span>
              <span class="status-text">{{ isConnected ? '在線' : '離線' }}</span>
            </div>
          </div>
          
          <div class="header-actions">
            <!-- 前端切換按鈕 -->
            <div v-if="showFrontendSwitcher" class="frontend-switcher">
              <button @click="showSwitcher = !showSwitcher" class="btn-icon switcher-toggle" title="切換前端">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              </button>
              
              <div v-if="showSwitcher" class="switcher-dropdown">
                <a :href="originalDifyUrl" target="_blank" class="switcher-item">
                  <span class="switcher-icon">🔧</span>
                  Dify 原始版
                </a>
                <a :href="nextDifyUrl" target="_blank" class="switcher-item">
                  <span class="switcher-icon">⚡</span>
                  Dify Next版
                </a>
                <div class="switcher-item current">
                  <span class="switcher-icon">📚</span>
                  Wiki 文檔 (當前)
                </div>
              </div>
            </div>
            
            <button @click="clearChat" class="btn-icon" title="清除對話">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
            
            <button @click="toggleChat" class="btn-icon" title="關閉">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 消息區域 -->
        <div class="chat-messages" ref="messagesContainer">
          <!-- 歡迎消息 -->
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="welcome-avatar">🤖</div>
            <div class="welcome-content">
              <h4>歡迎使用 Dify AI 助手！</h4>
              <div class="welcome-features">
                <div class="feature-item">
                  <span class="feature-icon">❓</span>
                  <span>回答文檔相關問題</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">✍️</span>
                  <span>協助內容創作</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🔧</span>
                  <span>提供技術支持</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📎</span>
                  <span>處理多媒體文件</span>
                </div>
              </div>
              <p class="welcome-prompt">有什麼可以幫助您的嗎？</p>
            </div>
          </div>

          <!-- 對話消息 -->
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="message-item"
            :class="{ 'user-message': message.role === 'user' }"
          >
            <div class="message-avatar" :class="message.role + '-avatar'">
              {{ message.role === 'user' ? '👤' : '🤖' }}
            </div>
            <div class="message-content">
              <div class="message-bubble" :class="message.role">
                <!-- 文件附件 -->
                <div v-if="message.files && message.files.length > 0" class="message-files">
                  <div v-for="file in message.files" :key="file.id" class="file-item">
                    <img v-if="file.type.startsWith('image/')" :src="file.url" :alt="file.name" />
                    <div v-else class="file-info">
                      <div class="file-icon">📎</div>
                      <div class="file-details">
                        <span class="file-name">{{ file.name }}</span>
                        <span class="file-size">{{ formatFileSize(file.size) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 消息文本 -->
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                
                <!-- 消息時間 -->
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
          </div>

          <!-- 打字指示器 -->
          <div v-if="isTyping" class="message-item typing-message">
            <div class="message-avatar bot-avatar">🤖</div>
            <div class="message-content">
              <div class="message-bubble bot typing">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="typing-text">AI 正在思考...</span>
              </div>
            </div>
          </div>

          <!-- 錯誤提示 -->
          <div v-if="errorMessage" class="error-message">
            <div class="error-icon">⚠️</div>
            <div class="error-text">{{ errorMessage }}</div>
            <button @click="errorMessage = null" class="error-close">×</button>
          </div>
        </div>

        <!-- 輸入區域 -->
        <div class="chat-input">
          <!-- 選中的文件預覽 -->
          <div v-if="selectedFiles.length > 0" class="selected-files">
            <div v-for="(file, index) in selectedFiles" :key="index" class="selected-file">
              <div class="file-preview">
                <img v-if="file.type.startsWith('image/')" :src="getFilePreview(file)" class="preview-image" />
                <div v-else class="preview-icon">📎</div>
              </div>
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <button @click="removeFile(index)" class="remove-file">×</button>
            </div>
          </div>
          
          <!-- 輸入框 -->
          <div class="input-container">
            <textarea
              ref="messageInput"
              v-model="inputMessage"
              @keydown="handleKeyDown"
              @paste="handlePaste"
              @input="autoResize"
              placeholder="輸入消息或拖拽文件..."
              :disabled="isLoading || !isConnected"
              class="message-input"
              rows="1"
            ></textarea>
            
            <input 
              ref="fileInput"
              type="file"
              @change="handleFileSelect"
              multiple
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md"
              style="display: none"
            />
            
            <div class="input-actions">
              <button 
                @click="$refs.fileInput.click()" 
                class="btn-icon"
                :disabled="isLoading"
                title="上傳文件"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </button>
              
              <button 
                @click="sendMessage" 
                :disabled="!canSend"
                class="send-button"
                :class="{ active: canSend }"
                title="發送消息"
              >
                <svg v-if="!isLoading" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                </svg>
                <div v-else class="loading-spinner"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 背景遮罩 (移動端) -->
    <div v-if="isOpen" class="chat-backdrop" @click="toggleChat"></div>
  </div>
</template>

<script>
export default {
  name: 'DifyChatbot',
  
  props: {
    enabled: {
      type: Boolean,
      default: true
    },
    apiUrl: {
      type: String,
      default: 'http://localhost:5001'
    },
    showFrontendSwitcher: {
      type: Boolean,
      default: true
    },
    originalDifyUrl: {
      type: String,
      default: 'http://localhost:3000'
    },
    nextDifyUrl: {
      type: String,
      default: 'http://localhost:3001'
    }
  },
  
  data() {
    return {
      isOpen: false,
      isConnected: false,
      isLoading: false,
      isTyping: false,
      hasUnread: false,
      showSwitcher: false,
      messages: [],
      inputMessage: '',
      selectedFiles: [],
      conversationId: null,
      userId: null,
      errorMessage: null,
      connectionCheckInterval: null
    }
  },

  computed: {
    canSend() {
      return (this.inputMessage.trim() || this.selectedFiles.length > 0) && !this.isLoading && this.isConnected
    }
  },

  mounted() {
    this.initialize()
  },

  beforeDestroy() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval)
    }
  },

  methods: {
    async initialize() {
      await this.checkConnection()
      this.loadConversationHistory()
      
      // 獲取當前用戶信息
      if (window.$wiki && window.$wiki.user) {
        this.userId = window.$wiki.user.id
      }
      
      // 定期檢查連接狀態
      this.connectionCheckInterval = setInterval(() => {
        this.checkConnection()
      }, 30000) // 每30秒檢查一次
      
      // 全局點擊事件監聽（關閉下拉菜單）
      document.addEventListener('click', this.handleGlobalClick)
    },

    async checkConnection() {
      try {
        const response = await this.$apollo.query({
          query: this.$gql`
            query DifyHealth {
              difyHealth {
                status
                connected
                api_url
              }
            }
          `,
          fetchPolicy: 'no-cache'
        })
        
        this.isConnected = response.data.difyHealth.connected
      } catch (error) {
        console.error('Connection check failed:', error)
        this.isConnected = false
      }
    },

    toggleChat() {
      this.isOpen = !this.isOpen
      this.showSwitcher = false
      
      if (this.isOpen) {
        this.hasUnread = false
        this.$nextTick(() => {
          this.$refs.messageInput?.focus()
          this.scrollToBottom()
          this.autoResize()
        })
      }
    },

    async sendMessage() {
      if (!this.canSend) return

      const messageText = this.inputMessage.trim()
      const files = [...this.selectedFiles]
      
      // 清空輸入
      this.inputMessage = ''
      this.selectedFiles = []
      this.errorMessage = null
      this.$nextTick(() => this.autoResize())

      // 添加用戶消息
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: messageText,
        files: files.length > 0 ? files.map(f => ({ 
          name: f.name, 
          type: f.type, 
          size: f.size,
          url: this.getFilePreview(f)
        })) : null,
        timestamp: new Date()
      }

      this.messages.push(userMessage)
      this.scrollToBottom()

      // 顯示打字指示器
      this.isTyping = true
      this.isLoading = true

      try {
        // 如果有文件，先上傳
        if (files.length > 0) {
          for (const file of files) {
            await this.uploadFile(file)
          }
        }

        // 發送聊天消息
        const response = await this.$apollo.mutate({
          mutation: this.$gql`
            mutation DifyChat($message: String!, $conversationId: String, $userId: String) {
              difyChat(message: $message, conversationId: $conversationId, userId: $userId) {
                success
                answer
                conversation_id
                message_id
                error
              }
            }
          `,
          variables: {
            message: messageText,
            conversationId: this.conversationId,
            userId: this.userId
          }
        })

        const result = response.data.difyChat

        if (result.success) {
          const assistantMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: result.answer,
            timestamp: new Date()
          }

          this.messages.push(assistantMessage)
          this.conversationId = result.conversation_id

          // 保存對話歷史
          this.saveConversationHistory()
        } else {
          throw new Error(result.error || 'Unknown error')
        }

      } catch (error) {
        console.error('Chat error:', error)
        this.errorMessage = error.message || '發送失敗，請稍後再試'
        
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: '抱歉，發生了錯誤，請稍後再試。',
          timestamp: new Date()
        }
        this.messages.push(errorMessage)
      }

      this.isTyping = false
      this.isLoading = false
      this.scrollToBottom()
    },

    async uploadFile(file) {
      try {
        const response = await this.$apollo.mutate({
          mutation: this.$gql`
            mutation DifyUploadFile($file: Upload!) {
              difyUploadFile(file: $file) {
                id
                name
                url
                mime_type
                size
              }
            }
          `,
          variables: { file }
        })

        return response.data.difyUploadFile
      } catch (error) {
        console.error('File upload error:', error)
        throw new Error(`文件上傳失敗: ${error.message}`)
      }
    },

    handleKeyDown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        this.sendMessage()
      }
    },

    handlePaste(event) {
      const items = event.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            this.selectedFiles.push(file)
          }
        }
      }
    },

    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      this.selectedFiles.push(...files)
      event.target.value = '' // 清空文件選擇器
    },

    removeFile(index) {
      this.selectedFiles.splice(index, 1)
    },

    clearChat() {
      if (confirm('確定要清除所有對話記錄嗎？')) {
        this.messages = []
        this.conversationId = null
        this.errorMessage = null
        localStorage.removeItem('dify-chat-history')
      }
    },

    handleGlobalClick(event) {
      if (!this.$el.contains(event.target)) {
        this.showSwitcher = false
      }
    },

    autoResize() {
      const textarea = this.$refs.messageInput
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },

    getFilePreview(file) {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file)
      }
      return null
    },

    formatMessage(content) {
      // 簡單的 Markdown 渲染
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/\n/g, '<br>')
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    saveConversationHistory() {
      const history = {
        messages: this.messages,
        conversationId: this.conversationId,
        timestamp: Date.now()
      }
      localStorage.setItem('dify-chat-history', JSON.stringify(history))
    },

    loadConversationHistory() {
      try {
        const history = localStorage.getItem('dify-chat-history')
        if (history) {
          const data = JSON.parse(history)
          // 只加載最近1小時的對話
          if (Date.now() - data.timestamp < 60 * 60 * 1000) {
            this.messages = data.messages || []
            this.conversationId = data.conversationId
          }
        }
      } catch (error) {
        console.error('Failed to load conversation history:', error)
      }
    }
  }
}
</script>

<style scoped>
.dify-chatbot {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 浮動按鈕 */
.chat-fab {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.chat-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
}

.chat-fab.error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
}

.chat-fab.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.8); }
}

/* 聊天窗口 */
.chat-window {
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 頭部 */
.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.9;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.status-dot.online {
  background: #22c55e;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.frontend-switcher {
  position: relative;
}

.switcher-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 180px;
  z-index: 10000;
}

.switcher-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #374151;
  text-decoration: none;
  transition: background 0.2s ease;
}

.switcher-item:hover {
  background: #f3f4f6;
}

.switcher-item.current {
  background: #e0e7ff;
  color: #4338ca;
  font-weight: 500;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 消息區域 */
.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.welcome-message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.welcome-avatar {
  font-size: 24px;
  line-height: 1;
}

.welcome-content h4 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 16px;
}

.welcome-features {
  margin: 12px 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  font-size: 14px;
  color: #6b7280;
}

.welcome-prompt {
  margin: 12px 0 0 0;
  color: #4b5563;
  font-weight: 500;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-item.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.bot-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-avatar {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
}

.message-bubble.bot {
  background: #f1f5f9;
  color: #334155;
}

.message-bubble.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-left: auto;
}

.message-bubble.typing {
  background: #f1f5f9;
  display: flex;
  align-items: center;
  gap: 12px;
}

.message-text {
  line-height: 1.6;
  word-wrap: break-word;
}

.message-text code {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
}

.message-text pre {
  background: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-time {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 6px;
}

.message-files {
  margin-bottom: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}

.file-item img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 6px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  display: block;
  font-size: 11px;
  opacity: 0.7;
  margin-top: 2px;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #94a3b8;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-8px); opacity: 1; }
}

.typing-text {
  color: #6b7280;
  font-size: 14px;
}

/* 錯誤消息 */
.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin: 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-text {
  flex: 1;
  font-size: 14px;
}

.error-close {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 輸入區域 */
.chat-input {
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
}

.selected-files {
  padding: 12px 16px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-file {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  max-width: 200px;
}

.file-preview {
  flex-shrink: 0;
}

.preview-image {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
}

.preview-icon {
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.remove-file {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.remove-file:hover {
  background: #fee2e2;
}

.input-container {
  padding: 16px;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 24px;
  outline: none;
  font-size: 14px;
  background: white;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  font-family: inherit;
  line-height: 1.4;
  transition: border-color 0.2s ease;
}

.message-input:focus {
  border-color: #667eea;
}

.message-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.send-button {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: scale(1.05);
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 背景遮罩 */
.chat-backdrop {
  display: none;
}

/* 動畫 */
.fab-bounce-enter-active, .fab-bounce-leave-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.fab-bounce-enter, .fab-bounce-leave-to {
  transform: scale(0) rotate(180deg);
  opacity: 0;
}

.chat-slide-enter-active, .chat-slide-leave-active {
  transition: all 0.3s ease;
}

.chat-slide-enter, .chat-slide-leave-to {
  transform: translateY(20px) scale(0.95);
  opacity: 0;
}

/* 響應式設計 */
@media (max-width: 480px) {
  .dify-chatbot {
    bottom: 0;
    right: 0;
    left: 0;
    position: fixed;
  }
  
  .chat-fab {
    position: fixed;
    bottom: 20px;
    right: 20px;
    left: auto;
    width: auto;
  }
  
  .chat-window {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    position: fixed;
    top: 0;
    left: 0;
  }
  
  .chat-backdrop {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9998;
  }
  
  .switcher-dropdown {
    right: auto;
    left: -160px;
  }
}

@media (max-width: 768px) {
  .chat-window {
    width: 350px;
    height: 550px;
  }
  
  .message-bubble {
    max-width: 90%;
  }
}

/* 滾動條樣式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .chat-window {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .welcome-message {
    background: #374151;
  }
  
  .message-bubble.bot {
    background: #374151;
    color: #f9fafb;
  }
  
  .chat-input {
    background: #374151;
    border-color: #4b5563;
  }
  
  .message-input {
    background: #4b5563;
    border-color: #6b7280;
    color: #f9fafb;
  }
  
  .message-input:focus {
    border-color: #667eea;
  }
  
  .selected-file {
    background: #4b5563;
    border-color: #6b7280;
    color: #f9fafb;
  }
  
  .switcher-dropdown {
    background: #374151;
    color: #f9fafb;
  }
  
  .switcher-item {
    color: #f9fafb;
  }
  
  .switcher-item:hover {
    background: #4b5563;
  }
}
</style>
