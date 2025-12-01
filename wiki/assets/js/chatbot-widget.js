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
            console.log('🔍 正在獲取用戶數據和可用知識庫...');

            // 從當前域名的 cookie 中取得 wiki.sid
            const getCookie = (name) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
                return null;
            };

            const sessionToken = getCookie('wiki.sid');
            console.log('🔑 Session Token:', sessionToken ? '已找到' : '未找到');
            if (sessionToken) {
                console.log('🔑 Token 前10字元:', sessionToken.substring(0, 10) + '...');
            }
            console.log('🍪 所有 Cookies:', document.cookie);

            // 使用 dify-next-frontend 的代理 API
            const apiUrl = 'http://localhost:3001/api/wiki-proxy/datasets';
            console.log('📡 API 端點:', apiUrl);

            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            // 如果有 session token,透過自訂 header 傳遞
            if (sessionToken) {
                headers['X-Wiki-Session'] = sessionToken;
                console.log('✅ 已設定 X-Wiki-Session header');
            } else {
                console.warn('⚠️ 無法取得 session token,將以訪客身份請求');
            }
            console.log('📤 請求 Headers:', headers);

            const response = await fetch(apiUrl, {
                credentials: 'include',
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📦 API 返回數據:', data);

                // 清空並重新填充可用數據集
                availableDatasets = {};
                if (data.datasets && Array.isArray(data.datasets)) {
                    data.datasets.forEach(ds => {
                        availableDatasets[ds.id] = {
                            id: ds.id,
                            name: ds.name,
                            description: ds.description,
                            available: ds.available
                        };
                    });
                    console.log('✅ 可用知識庫:', Object.keys(availableDatasets));
                }

                // 設置用戶組別
                if (data.user_groups && Array.isArray(data.user_groups)) {
                    currentUser = { groups: data.user_groups };
                    console.log('👤 用戶所屬組別:', data.user_groups);

                    // Auto-select best group based on priority
                    const priorityOrder = ['administrators', 'EE', 'ME_LCM', 'PWR', 'SW', 'PJM', 'DQE', 'Certi', 'Guests'];
                    selectedGroup = priorityOrder.find(group => data.user_groups.includes(group));

                    // 如果沒有匹配到優先組別，選擇第一個可用的
                    if (!selectedGroup && data.user_groups.length > 0) {
                        selectedGroup = data.user_groups[0];
                    }

                    // 最後的保險：默認為 Guests
                    if (!selectedGroup) {
                        selectedGroup = 'Guests';
                    }

                    console.log('🎯 自動選擇知識庫:', selectedGroup);
                } else {
                    console.warn('⚠️ 未獲取到用戶組別信息');
                    currentUser = { groups: ['Guests'] };
                    selectedGroup = 'Guests';
                }

                return true;
            } else {
                console.error('❌ API 請求失敗:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('錯誤詳情:', errorText);
            }
        } catch (error) {
            console.error('❌ 獲取用戶數據失敗:', error);
        }

        // 使用默認設置
        console.log('⚠️ 使用默認設置（訪客模式）');
        availableDatasets = {
            'Guests': {
                id: 'Guests',
                name: '訪客知識庫',
                description: '公開資訊',
                available: true
            }
        };
        currentUser = { groups: ['Guests'] };
        selectedGroup = 'Guests';
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

        // Toggle chatbot window visibility
        function toggleChatbot() {
            const chatWindow = document.getElementById('chatbot-window');
            if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
                chatWindow.style.display = 'flex';
                console.log('💬 聊天機器人已開啟');
            } else {
                chatWindow.style.display = 'none';
                console.log('💬 聊天機器人已關閉');
            }
        }

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
            if (!select) {
                console.error('❌ 找不到 group-select 元素');
                return;
            }

            select.innerHTML = '';

            console.log('🔄 更新知識庫選單，可用數據集:', Object.keys(availableDatasets));

            if (Object.keys(availableDatasets).length === 0) {
                // 沒有可用的數據集，顯示默認選項
                const option = document.createElement('option');
                option.value = 'Guests';
                option.textContent = '訪客知識庫';
                select.appendChild(option);
                console.log('⚠️ 沒有可用數據集，顯示默認選項');
                return;
            }

            // 按照優先順序排序
            const priorityOrder = ['administrators', 'EE', 'ME_LCM', 'PWR', 'SW', 'PJM', 'DQE', 'Certi', 'Guests'];
            const sortedDatasets = Object.entries(availableDatasets).sort((a, b) => {
                const indexA = priorityOrder.indexOf(a[0]);
                const indexB = priorityOrder.indexOf(b[0]);
                return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
            });

            sortedDatasets.forEach(([id, dataset]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = dataset.name;

                if (id === selectedGroup) {
                    option.selected = true;
                    console.log('✅ 已選擇知識庫:', dataset.name);
                }

                // 添加禁用標記（如果不可用）
                if (dataset.available === false) {
                    option.disabled = true;
                    option.textContent += ' (暫不可用)';
                }

                select.appendChild(option);
            });

            console.log('✅ 知識庫選單更新完成，共', sortedDatasets.length, '個選項');
        }

        // Send message function
        async function sendMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();

            if (!message) return;

            console.log('📤 發送訊息:', message);
            console.log('📚 當前選擇的知識庫:', selectedGroup);
            console.log('👤 用戶組別:', currentUser?.groups);

            // Add user message to chat
            addMessage(message, 'user');
            input.value = '';

            // Show typing indicator
            addTypingIndicator();

            try {
                // 獲取當前對話的 conversation_id
                const conversationId = conversationHistory[selectedGroup] || null;
                console.log('💬 當前對話 ID:', conversationId);

                // 使用 dify-next-frontend 的代理 API
                const apiUrl = 'http://localhost:3001/api/wiki-proxy/chat';
                console.log('🔄 正在呼叫 Chat API...', apiUrl);

                // 從當前域名的 cookie 中取得 wiki.sid
                const getCookie = (name) => {
                    const value = `; ${document.cookie}`;
                    const parts = value.split(`; ${name}=`);
                    if (parts.length === 2) return parts.pop().split(';').shift();
                    return null;
                };

                const sessionToken = getCookie('wiki.sid');
                const headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                };

                // 如果有 session token,透過自訂 header 傳遞
                if (sessionToken) {
                    headers['X-Wiki-Session'] = sessionToken;
                }

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: headers,
                    credentials: 'include',
                    body: JSON.stringify({
                        message: message,
                        group_id: selectedGroup,
                        conversation_id: conversationId
                    })
                });

                console.log('📥 API 響應狀態:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ API 請求失敗:', response.status, errorText);
                    throw new Error(`API 請求失敗: ${response.status}`);
                }

                const result = await response.json();
                console.log('📦 API 返回結果:', result);

                removeTypingIndicator();

                if (result.success) {
                    // 保存 conversation_id 以便後續對話
                    if (result.conversation_id) {
                        conversationHistory[selectedGroup] = result.conversation_id;
                        console.log('💾 已保存對話 ID:', result.conversation_id);
                    }

                    const datasetInfo = availableDatasets[selectedGroup]?.name || selectedGroup;
                    addMessage(`${result.answer}<br><br><small style="color: #666;">📚 來自 ${datasetInfo}</small>`, 'bot');
                    console.log('✅ 訊息發送成功，使用知識庫:', datasetInfo);
                } else {
                    const errorMsg = result.error || result.details || '服務暫時不可用';
                    console.error('❌ Dify API 錯誤:', errorMsg);
                    addMessage(`抱歉，${errorMsg}。請稍後再試。`, 'bot');
                }

            } catch (error) {
                console.error('❌ API 調用失敗:', error);
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
