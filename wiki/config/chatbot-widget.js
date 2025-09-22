// Dify AI Chatbot Widget for Wiki.js
// This script adds a floating AI chatbot to all Wiki.js pages

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        DIFY_API_URL: 'http://api:5001',
        DIFY_API_KEY: 'app-yt018tTA4NhoWIixKk1f2vGg', // Will be loaded from environment
        WIDGET_POSITION: 'bottom-right',
        PRIMARY_COLOR: '#1976d2',
        CHAT_TITLE: 'AI 助手'
    };
    
    // Create chatbot widget HTML
    function createChatbotWidget() {
        const widgetHTML = `
            <div id="dify-chatbot-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 10000; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <!-- Chatbot Trigger Button -->
                <div id="chatbot-trigger" style="
                    width: 60px; 
                    height: 60px; 
                    background: linear-gradient(135deg, ${CONFIG.PRIMARY_COLOR}, #42a5f5); 
                    border-radius: 50%; 
                    cursor: pointer; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    transition: all 0.3s ease;
                    color: white;
                    font-size: 24px;
                " onclick="toggleChatbot()">
                    💬
                </div>
                
                <!-- Chatbot Window -->
                <div id="chatbot-window" style="
                    position: absolute; 
                    bottom: 80px; 
                    right: 0; 
                    width: 350px; 
                    height: 500px; 
                    background: white; 
                    border-radius: 12px; 
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15); 
                    display: none; 
                    flex-direction: column;
                    overflow: hidden;
                ">
                    <!-- Header -->
                    <div style="
                        background: linear-gradient(135deg, ${CONFIG.PRIMARY_COLOR}, #42a5f5); 
                        color: white; 
                        padding: 16px; 
                        font-weight: 600;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span>${CONFIG.CHAT_TITLE}</span>
                        <span onclick="toggleChatbot()" style="cursor: pointer; font-size: 18px;">✕</span>
                    </div>
                    
                    <!-- Messages Container -->
                    <div id="chat-messages" style="
                        flex: 1; 
                        padding: 16px; 
                        overflow-y: auto; 
                        background: #f5f5f5;
                    ">
                        <div class="message bot-message" style="
                            margin-bottom: 12px; 
                            padding: 10px 12px; 
                            background: white; 
                            border-radius: 12px; 
                            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                            font-size: 14px;
                            line-height: 1.4;
                        ">
                            👋 您好！我是 AI 助手，可以幫您回答關於此 Wiki 的問題。
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div style="
                        padding: 16px; 
                        background: white; 
                        border-top: 1px solid #e0e0e0;
                        display: flex;
                        gap: 8px;
                    ">
                        <input 
                            id="chat-input" 
                            type="text" 
                            placeholder="輸入您的問題..."
                            style="
                                flex: 1; 
                                padding: 10px 12px; 
                                border: 1px solid #ddd; 
                                border-radius: 20px; 
                                outline: none;
                                font-size: 14px;
                            "
                            onkeypress="handleInputKeypress(event)"
                        />
                        <button 
                            onclick="sendMessage()" 
                            style="
                                padding: 10px 16px; 
                                background: ${CONFIG.PRIMARY_COLOR}; 
                                color: white; 
                                border: none; 
                                border-radius: 20px; 
                                cursor: pointer;
                                font-size: 14px;
                                transition: background-color 0.2s;
                            "
                        >
                            發送
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Insert the widget into the page
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }
    
    // Toggle chatbot window
    window.toggleChatbot = function() {
        const window = document.getElementById('chatbot-window');
        const trigger = document.getElementById('chatbot-trigger');
        
        if (window.style.display === 'none' || window.style.display === '') {
            window.style.display = 'flex';
            trigger.style.transform = 'scale(0.9)';
        } else {
            window.style.display = 'none';
            trigger.style.transform = 'scale(1)';
        }
    };
    
    // Handle input keypress
    window.handleInputKeypress = function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };
    
    // Send message to Dify API
    window.sendMessage = async function() {
        const input = document.getElementById('chat-input');
        const messagesContainer = document.getElementById('chat-messages');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        addTypingIndicator();
        
        try {
            // Get current page content for context
            const pageTitle = document.title;
            const pageContent = document.body.innerText.substring(0, 2000); // First 2000 chars
            
            // Direct call to Dify API (note: this is a simplified approach)
            const response = await fetch('http://localhost:5001/v1/chat-messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer app-yt018tTA4NhoWIixKk1f2vGg'
                },
                body: JSON.stringify({
                    inputs: {
                        page_title: pageTitle,
                        page_content: pageContent
                    },
                    query: message,
                    response_mode: 'blocking',
                    conversation_id: '',
                    user: 'wiki-user-' + Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error('API 請求失敗');
            }
            
            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add bot response
            addMessage(data.answer || '抱歉，我暫時無法回答這個問題。', 'bot');
            
        } catch (error) {
            console.error('Chatbot error:', error);
            removeTypingIndicator();
            
            // Fallback to simple responses for demo
            const responses = [
                '這是一個很好的問題！根據當前頁面的內容，我建議您查看相關的文檔部分。',
                '感謝您的提問。您可以在 Wiki 中搜索相關關鍵詞來找到更多信息。',
                '我理解您的問題。建議您瀏覽相關的頁面章節來獲得詳細答案。',
                '這個問題很有趣！您可以在左側導航中找到相關主題的更多信息。'
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addMessage(`${randomResponse} (註：AI 服務暫時不可用，這是一個示例回應)`, 'bot');
        }
    };
    
    // Add message to chat
    function addMessage(text, type) {
        const messagesContainer = document.getElementById('chat-messages');
        const isBot = type === 'bot';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.style.cssText = `
            margin-bottom: 12px; 
            padding: 10px 12px; 
            border-radius: 12px; 
            font-size: 14px;
            line-height: 1.4;
            max-width: 85%;
            word-break: break-word;
            ${isBot ? `
                background: white; 
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                margin-right: auto;
            ` : `
                background: ${CONFIG.PRIMARY_COLOR}; 
                color: white;
                margin-left: auto;
                text-align: right;
            `}
        `;
        
        messageDiv.innerHTML = isBot ? `🤖 ${text}` : text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Add typing indicator
    function addTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.style.cssText = `
            margin-bottom: 12px; 
            padding: 10px 12px; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            font-size: 14px;
            color: #666;
            font-style: italic;
        `;
        typingDiv.innerHTML = '🤖 正在思考中...';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatbotWidget);
    } else {
        createChatbotWidget();
    }
    
    // Add some CSS for better mobile experience
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 480px) {
            #dify-chatbot-widget #chatbot-window {
                width: calc(100vw - 40px) !important;
                height: calc(100vh - 120px) !important;
                right: 20px !important;
                bottom: 80px !important;
            }
        }
        
        #chat-input:focus {
            border-color: ${CONFIG.PRIMARY_COLOR} !important;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2) !important;
        }
        
        button:hover {
            opacity: 0.9 !important;
        }
        
        #chatbot-trigger:hover {
            transform: scale(1.05) !important;
        }
    `;
    document.head.appendChild(style);
    
    console.log('Dify AI Chatbot Widget loaded successfully!');
})();
