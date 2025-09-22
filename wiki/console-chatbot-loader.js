// 在瀏覽器開發者工具的控制台中運行此代碼來添加聊天機器人
(function() {
    'use strict';
    
    // 檢查是否已經加載了聊天機器人
    if (document.getElementById('dify-chatbot-widget')) {
        console.log('聊天機器人已經存在');
        return;
    }
    
    // Configuration
    const CONFIG = {
        PRIMARY_COLOR: '#1976d2',
        CHAT_TITLE: 'AI 助手'
    };
    
    // Create chatbot widget HTML
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
            ">
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
                    <span id="close-chat" style="cursor: pointer; font-size: 18px;">✕</span>
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
                        🤖 您好！我是 Wiki.js 的 AI 助手。我可以幫您回答關於此頁面內容的問題。<br><br>
                        <small style="color: #666;">💡 提示：完整的 AI 功能需要配置 Dify API Key</small>
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
                    />
                    <button 
                        id="send-button"
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
    
    // Toggle chatbot window
    function toggleChatbot() {
        const window = document.getElementById('chatbot-window');
        const trigger = document.getElementById('chatbot-trigger');
        
        if (window.style.display === 'none' || window.style.display === '') {
            window.style.display = 'flex';
            trigger.style.transform = 'scale(0.9)';
        } else {
            window.style.display = 'none';
            trigger.style.transform = 'scale(1)';
        }
    }
    
    // Send message function
    function sendMessage() {
        const input = document.getElementById('chat-input');
        const messagesContainer = document.getElementById('chat-messages');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        addTypingIndicator();
        
        // Simulate AI response with demo responses
        setTimeout(() => {
            removeTypingIndicator();
            
            const demoResponses = [
                `關於"${message}"這個問題，根據當前頁面的內容，我建議您查看相關的文檔部分。`,
                `您提到的"${message}"是一個很好的問題！在 Wiki 中搜索相關關鍵詞可以找到更多信息。`,
                `我理解您對"${message}"的疑問。建議您瀏覽相關的頁面章節來獲得詳細答案。`,
                `關於"${message}"這個主題很有趣！您可以在左側導航中找到相關主題的更多信息。`,
                `針對您的問題"${message}"，我推薦您查看 Wiki 中的相關教程和指南。`
            ];
            
            const response = demoResponses[Math.floor(Math.random() * demoResponses.length)];
            addMessage(`${response}<br><br><small style="color: #666;">ℹ️ 這是一個演示回應。配置 Dify API Key 後可獲得真實的 AI 回答。</small>`, 'bot');
        }, 1000 + Math.random() * 1000);
    }
    
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
    
    // Event listeners
    document.getElementById('chatbot-trigger').addEventListener('click', toggleChatbot);
    document.getElementById('close-chat').addEventListener('click', toggleChatbot);
    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Add some CSS for better experience
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
        
        #send-button:hover {
            opacity: 0.9 !important;
        }
        
        #chatbot-trigger:hover {
            transform: scale(1.05) !important;
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Dify AI 聊天機器人已成功加載！');
    console.log('💬 點擊右下角的聊天圖標開始對話');
    
})();
