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
    
    // Global state for group management
    let currentUser = null;
    let availableDatasets = {};
    let selectedGroup = 'default';
    let conversationHistory = {};
    
    // Fetch user info and available datasets
    async function fetchUserData() {
        try {
            const response = await fetch('/api/dify/datasets', {
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                availableDatasets = {};
                data.datasets.forEach(ds => {
                    availableDatasets[ds.id] = ds;
                });
                currentUser = { groups: data.user_groups };
                
                // Auto-select best group
                const priorityOrder = ['administrators', 'EE', 'ME_LCM', 'PWR', 'SW', 'PJM', 'Guests'];
                selectedGroup = priorityOrder.find(group => data.user_groups.includes(group)) || 'Guests';
                
                console.log('✅ 用戶數據加載成功:', data.user_groups);
                return true;
            }
        } catch (error) {
            console.warn('無法獲取用戶數據，使用默認設置:', error);
        }
        return false;
    }
    
    // Create chatbot widget HTML
    const widgetHTML = `
        <div id="dify-chatbot-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 10000; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <!-- Chatbot Trigger Button -->
            <div id="chatbot-trigger" style="
                width: 60px; 
                height: 60px; 
                background: linear-gradient(135deg, ${CONFIG.PRIMARY_COLOR}, #42a5f5); 
                border-radius: 50%; 
                cursor: move; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                display: flex; 
                align-items: center; 
                justify-content: center;
                transition: all 0.3s ease;
                color: white;
                font-size: 24px;
                user-select: none;
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
                
                <!-- Group Selector -->
                <div id="group-selector" style="
                    padding: 12px 16px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e9ecef;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <span style="font-size: 12px; color: #666; white-space: nowrap;">知識庫:</span>
                    <select id="group-select" style="
                        flex: 1;
                        padding: 4px 8px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 12px;
                        background: white;
                    ">
                        <option value="Guests">訪客知識庫</option>
                    </select>
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
                        🤖 您好！我是 AI 助手。我可以根據您的權限訪問對應部門的知識庫來回答問題。<br><br>
                        <small style="color: #666;">💡 請選擇您要查詢的知識庫類型</small>
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
    
    // 等待 DOM 準備就緒
    function initializeChatbot() {
        if (!document.body) {
            // 如果 body 還不存在，等待一下再試
            setTimeout(initializeChatbot, 100);
            return;
        }
        
        // Insert the widget into the page
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        // Add drag functionality
        let isDragging = false;
        let dragStartY = 0;
        let initialBottom = 20;
        
        const widget = document.getElementById('dify-chatbot-widget');
        const trigger = document.getElementById('chatbot-trigger');
        
        // Mouse down event - 開始拖拽
        trigger.addEventListener('mousedown', function(e) {
            isDragging = true;
            dragStartY = e.clientY;
            initialBottom = parseInt(widget.style.bottom) || 20;
            trigger.style.cursor = 'grabbing';
            e.preventDefault(); // 防止選中文本
        });
        
        // Mouse move event - 只有在拖拽狀態下才移動
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const deltaY = dragStartY - e.clientY;
            let newBottom = initialBottom + deltaY;
            
            // 限制在視窗範圍內
            const maxBottom = window.innerHeight - 80; // 留出一些空間
            const minBottom = 20;
            newBottom = Math.max(minBottom, Math.min(maxBottom, newBottom));
            
            widget.style.bottom = newBottom + 'px';
        });
        
        // Mouse up event - 結束拖拽
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                trigger.style.cursor = 'move';
            }
        });
        
        // 點擊事件 - 只有在沒有拖拽時才觸發
        trigger.addEventListener('click', function(e) {
            // 如果剛才在拖拽，不要觸發點擊
            if (isDragging) {
                e.preventDefault();
                return;
            }
            toggleChatbot();
        });
        
        // Touch events for mobile
        trigger.addEventListener('touchstart', function(e) {
            isDragging = true;
            dragStartY = e.touches[0].clientY;
            initialBottom = parseInt(widget.style.bottom) || 20;
            trigger.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        document.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            
            const deltaY = dragStartY - e.touches[0].clientY;
            let newBottom = initialBottom + deltaY;
            
            const maxBottom = window.innerHeight - 80;
            const minBottom = 20;
            newBottom = Math.max(minBottom, Math.min(maxBottom, newBottom));
            
            widget.style.bottom = newBottom + 'px';
        });
        
        document.addEventListener('touchend', function() {
            if (isDragging) {
                isDragging = false;
                trigger.style.cursor = 'move';
            }
        });
        
        // Initialize group selector and fetch user data
        fetchUserData().then(() => {
            updateGroupSelector();
        });
        
        // Group selector change handler
        document.getElementById('group-select').addEventListener('change', function(e) {
            selectedGroup = e.target.value;
            console.log('切換到知識庫:', selectedGroup);
            
            // Clear conversation history when switching groups
            conversationHistory[selectedGroup] = conversationHistory[selectedGroup] || [];
            
            // Add system message about group change
            const groupName = availableDatasets[selectedGroup]?.name || '未知知識庫';
            addMessage(`已切換到 ${groupName}`, 'bot');
        });
        
        function updateGroupSelector() {
            const select = document.getElementById('group-select');
            select.innerHTML = '';
            
            Object.entries(availableDatasets).forEach(([id, dataset]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = dataset.name;
                if (id === selectedGroup) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
        
        // Send message function
        async function sendMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message to chat
            addMessage(message, 'user');
            input.value = '';
            
            // Show typing indicator
            addTypingIndicator();
            
            try {
                // Call Dify API with selected group
                const response = await fetch('/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        query: `
                            mutation($message: String!, $groupId: String!) {
                                difyChatWithGroup(message: $message, groupId: $groupId) {
                                    success
                                    answer
                                    error
                                    selectedGroup
                                    groupName
                                    availableGroups
                                }
                            }
                        `,
                        variables: {
                            message: message,
                            groupId: selectedGroup
                        }
                    })
                });
                
                const result = await response.json();
                const data = result.data?.difyChatWithGroup;
                
                removeTypingIndicator();
                
                if (data?.success) {
                    const groupInfo = data.groupName ? ` (${data.groupName})` : '';
                    addMessage(`${data.answer}<br><br><small style="color: #666;">📚 來自${groupInfo}</small>`, 'bot');
                } else {
                    const errorMsg = data?.error || '服務暫時不可用';
                    addMessage(`抱歉，${errorMsg}。請稍後再試。`, 'bot');
                    
                    if (data?.availableGroups && data.availableGroups.length > 0) {
                        const availableGroupsText = data.availableGroups
                            .map(group => availableDatasets[group]?.name || group)
                            .join('、');
                        addMessage(`您可以訪問的知識庫：${availableGroupsText}`, 'bot');
                    }
                }
                
            } catch (error) {
                console.error('API 調用失敗:', error);
                removeTypingIndicator();
                addMessage('抱歉，連接服務器失敗。請檢查網路連接後重試。', 'bot');
            }
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
        console.log('💬 點擊右下角的聊天圖標開始對話（可拖拽移動）');
    }
    
    // 檢查 DOM 是否已經準備就緒
    if (document.readyState === 'loading') {
        // DOM 還在加載中，等待 DOMContentLoaded 事件
        document.addEventListener('DOMContentLoaded', initializeChatbot);
    } else {
        // DOM 已經準備就緒，直接初始化
        initializeChatbot();
    }
    
})();
