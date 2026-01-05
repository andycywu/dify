(function() { window.CHATBOT_VERSION = "2.0.3"; })();
(function() {
    'use strict';

    console.log('🚀 Chatbot Widget v2.0.3 - 載入中...');

    // 檢查是否已經加載了聊天機器人
    if (document.getElementById('dify-chatbot-widget')) {
        console.log('⚠️ 聊天機器人已經存在，跳過初始化');
        return;
    }

    // Configuration
    const CONFIG = {
        PRIMARY_COLOR: '#1976d2',
        CHAT_TITLE: 'TPV AI 助手系統'
    };

    // Global state
    let currentUser = null;
    let userGroups = [];
    let selectedChatbot = null;
    let conversationHistory = {};

    // 群組到 Dify Chatbot 的完整映射（基於 .env.dify）
    const CHATBOT_MAP = {
        'DQE': {
            token: 'app-9VgBzkiVSPQzpewclO0VmokX',
            name: 'DQE智能助理',
            description: '設計品質工程部門'
        },
        'DQE-Certi': {
            token: 'app-GUXfMHGxh3LCwiXTTO64DO7Z',
            name: 'DQE認證智能助理',
            description: 'DQE認證部門'
        },
        'EE': {
            token: 'app-l5htgvwBGi5WWDLus9alXaCj',
            name: '硬體工程智能助理',
            description: '硬體部門'
        },
        'PWR': {
            token: 'app-w3wWfpE590ZTPILJugK0hWKB',
            name: '電源智能助理',
            description: '電源部門'
        },
        'SW': {
            token: 'app-I8NXWJwmfNMWJdqB4LSvOkly',
            name: '軟體智能助理',
            description: '軟體部門'
        },
        'ME-LCM': {
            token: 'app-whNRjuZJ4H0TltKLVk5W2jZH',
            name: 'ME/LCM智能助理',
            description: 'ME/LCM部門'
        },
        'PM': {
            token: 'app-HS8g5SVRvGAGOJcOjdfF7EGv',
            name: '專案管理智能助理',
            description: '專案管理部門'
        },
        'TM': {
            token: 'app-TpAELcdUix0YrWTtdOe05a7A',
            name: '技術管理智能助理',
            description: '技術管理部門'
        },
        'Arch': {
            token: 'app-7vtzhicvHgoX6FmBrtItqnjH',
            name: '架構智能助理',
            description: '架構部門'
        },
        'COMMON': {
            token: 'app-AxL0cpF55v7I70hbVGR4R8YF',
            name: '公共知識庫智能助理',
            description: '公共資訊與常見問題'
        }
    };

    // Administrators 可以看到所有 chatbots
    const ADMINISTRATORS_CHATBOTS = Object.keys(CHATBOT_MAP);

    // Guests 只能看到 COMMON
    const GUESTS_CHATBOTS = ['COMMON'];

    // 獲取用戶可訪問的 chatbots
    function getAvailableChatbots() {
        console.log('🔍 計算用戶可訪問的 chatbots...');
        console.log('👤 用戶群組:', userGroups);

        // 如果是管理員，返回所有 chatbots
        if (userGroups.includes('administrators')) {
            console.log('👑 管理員權限：可訪問所有 chatbots');
            return ADMINISTRATORS_CHATBOTS;
        }

        // 過濾掉 Guests，只看實際的業務群組
        const businessGroups = userGroups.filter(group => group !== 'Guests');

        // 如果沒有任何業務群組（只有 Guests 或空），返回 COMMON
        if (businessGroups.length === 0) {
            console.log('👥 訪客權限：只能訪問 COMMON');
            return GUESTS_CHATBOTS;
        }

        // 一般用戶：返回其所屬群組對應的 chatbots
        const availableChatbots = businessGroups.filter(group => CHATBOT_MAP[group]);
        
        console.log('✅ 可訪問的 chatbots:', availableChatbots);
        return availableChatbots;
    }

    // Fetch user info
    async function fetchUserData() {
        try {
            console.log('🔍 正在獲取用戶數據...');

            const getCookie = (name) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
                return null;
            };

            const sessionToken = getCookie('wiki.sid');
            const jwtToken = getCookie('jwt');
            console.log('🔑 Session Token:', sessionToken ? '已找到' : '未找到');
            console.log('🔑 JWT Token:', jwtToken ? '已找到' : '未找到');
            console.log('🍪 所有 Cookies:', document.cookie);

            // 嘗試從 JWT 解析用戶群組
            let userGroupsFromJWT = null;
            if (jwtToken) {
                try {
                    const parts = jwtToken.split('.');
                    if (parts.length === 3) {
                        const payload = JSON.parse(atob(parts[1]));
                        console.log('🔓 JWT Payload:', payload);
                        
                        if (payload.groups && Array.isArray(payload.groups)) {
                            userGroupsFromJWT = payload.groups;
                            console.log('✅ 從 JWT 獲取群組 ID:', userGroupsFromJWT);
                        }
                    }
                } catch (jwtError) {
                    console.warn('⚠️ JWT 解析失敗:', jwtError);
                }
            }

            const currentHost = window.location.hostname;
            const apiUrl = `http://${currentHost}:3001/api/wiki-proxy/datasets`;

            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            if (sessionToken) {
                headers['X-Wiki-Session'] = sessionToken;
            }

            if (jwtToken) {
                headers['Authorization'] = `Bearer ${jwtToken}`;
            }

            const response = await fetch(apiUrl, {
                credentials: 'include',
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📦 API 返回數據:', data);

                // 優先使用 API 返回的 user_groups，如果沒有則使用 JWT 中的群組 ID
                if (data.user_groups && Array.isArray(data.user_groups) && data.user_groups.length > 0) {
                    userGroups = data.user_groups;
                    console.log('✅ 使用 API 返回的用戶群組:', userGroups);
                } else if (userGroupsFromJWT && userGroupsFromJWT.length > 0) {
                    // JWT 中的 groups 是群組 ID (數字)，需要映射到群組名稱
                    // 群組 ID 1 = administrators
                    userGroups = userGroupsFromJWT.map(groupId => {
                        if (groupId === 1) return 'administrators';
                        // 其他群組 ID 暫時返回 Guest
                        return 'Guests';
                    });
                    console.log('✅ 使用 JWT 群組 ID 映射:', userGroups);
                } else {
                    userGroups = ['Guests'];
                    console.log('👥 未登入用戶，設為訪客');
                }

                return true;
            } else {
                console.error('❌ API 請求失敗:', response.status);
            }
        } catch (error) {
            console.error('❌ 獲取用戶數據失敗:', error);
        }

        userGroups = ['Guests'];
        console.log('⚠️ 使用訪客模式');
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
                width: 380px;
                height: 550px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                display: none;
                flex-direction: column;
                overflow: hidden;
            ">
                <!-- Header -->
                <div id="chat-header" style="
                    background: linear-gradient(135deg, ${CONFIG.PRIMARY_COLOR}, #42a5f5);
                    color: white;
                    padding: 16px;
                    font-weight: 600;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span id="chat-title">${CONFIG.CHAT_TITLE}</span>
                    <span id="close-chat" style="cursor: pointer; font-size: 18px;">✕</span>
                </div>

                <!-- Chatbot Selector -->
                <div id="chatbot-selector" style="
                    padding: 12px 16px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e9ecef;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 12px; color: #666; white-space: nowrap;">選擇助理:</span>
                        <select id="chatbot-select" style="
                            flex: 1;
                            padding: 6px 10px;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            font-size: 13px;
                            background: white;
                            cursor: pointer;
                        ">
                            <option value="">請選擇智能助理...</option>
                        </select>
                    </div>
                    <div id="chatbot-description" style="
                        font-size: 11px;
                        color: #666;
                        padding: 4px 8px;
                        background: white;
                        border-radius: 4px;
                        display: none;
                    "></div>
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
                        🤖 您好！我是 TPV AI 助手系統。<br><br>
                        <small style="color: #666;">💡 請先在上方選擇您要諮詢的專業領域智能助理</small>
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
                        placeholder="請先選擇智能助理..."
                        disabled
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
                        disabled
                        style="
                            padding: 10px 16px;
                            background: #ccc;
                            color: white;
                            border: none;
                            border-radius: 20px;
                            cursor: not-allowed;
                            font-size: 14px;
                            font-weight: 500;
                        "
                    >
                        發送
                    </button>
                </div>
            </div>
        </div>
    `;

    // Initialize chatbot
    function initializeChatbot() {
        if (!document.body) {
            setTimeout(initializeChatbot, 100);
            return;
        }

        document.body.insertAdjacentHTML('beforeend', widgetHTML);

        fetchUserData().then(() => {
            updateChatbotSelector();
            setupEventListeners();
            initAdminButton(); // 在用戶數據載入後初始化管理按鈕
        });

        console.log('✅ Dify AI 聊天機器人已成功加載！');
        console.log('💬 點擊右下角的聊天圖標開始對話（可拖拽移動）');
    }

    // Update chatbot selector
    function updateChatbotSelector() {
        const select = document.getElementById('chatbot-select');
        const availableChatbots = getAvailableChatbots();

        select.innerHTML = '<option value="">請選擇智能助理...</option>';

        availableChatbots.forEach(chatbotKey => {
            const chatbot = CHATBOT_MAP[chatbotKey];
            if (chatbot) {
                const option = document.createElement('option');
                option.value = chatbotKey;
                option.textContent = chatbot.name;
                option.dataset.token = chatbot.token;
                option.dataset.description = chatbot.description;
                select.appendChild(option);
            }
        });

        console.log('✅ Chatbot 選單更新完成，共', availableChatbots.length, '個選項');
    }

    // Setup event listeners
    function setupEventListeners() {
        const trigger = document.getElementById('chatbot-trigger');
        const closeBtn = document.getElementById('close-chat');
        const chatbotSelect = document.getElementById('chatbot-select');
        const sendBtn = document.getElementById('send-button');
        const input = document.getElementById('chat-input');

        // Toggle window
        function toggleWindow() {
            const window = document.getElementById('chatbot-window');
            const isOpen = window.style.display === 'flex';
            window.style.display = isOpen ? 'none' : 'flex';
            console.log('💬 聊天機器人已', isOpen ? '關閉' : '開啟');
        }

        trigger.addEventListener('click', toggleWindow);
        closeBtn.addEventListener('click', toggleWindow);

        // Chatbot selection
        chatbotSelect.addEventListener('change', function(e) {
            const selectedKey = e.target.value;
            
            if (!selectedKey) {
                selectedChatbot = null;
                input.disabled = true;
                sendBtn.disabled = true;
                input.placeholder = '請先選擇智能助理...';
                sendBtn.style.background = '#ccc';
                sendBtn.style.cursor = 'not-allowed';
                document.getElementById('chatbot-description').style.display = 'none';
                document.getElementById('chat-title').textContent = CONFIG.CHAT_TITLE;
                return;
            }

            const chatbot = CHATBOT_MAP[selectedKey];
            selectedChatbot = {
                key: selectedKey,
                token: chatbot.token,
                name: chatbot.name,
                description: chatbot.description
            };

            console.log('🤖 選擇智能助理:', selectedChatbot.name);
            console.log('🔑 使用 Token:', selectedChatbot.token);

            // 更新 UI
            document.getElementById('chat-title').textContent = chatbot.name;
            input.disabled = false;
            sendBtn.disabled = false;
            input.placeholder = `向 ${chatbot.name} 提問...`;
            sendBtn.style.background = CONFIG.PRIMARY_COLOR;
            sendBtn.style.cursor = 'pointer';

            // 顯示描述
            const descDiv = document.getElementById('chatbot-description');
            descDiv.innerHTML = `📚 ${chatbot.description} | 🔑 Token: <code style="background:#f0f0f0;padding:2px 4px;border-radius:3px;font-size:10px;">${chatbot.token.substring(0, 15)}...</code>`;
            descDiv.style.display = 'block';

            // 添加系統訊息
            addMessage(`已切換到 <strong>${chatbot.name}</strong><br><small style="color:#666;">${chatbot.description}</small>`, 'bot');
        });

        // Send message
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !input.disabled) {
                sendMessage();
            }
        });

        // Drag functionality
        setupDragFunctionality();
    }

    // Send message function
    async function sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message || !selectedChatbot) return;

        console.log('📤 發送訊息:', message);
        console.log('🤖 使用助理:', selectedChatbot.name);
        console.log('🔑 使用 Token:', selectedChatbot.token);

        addMessage(message, 'user');
        input.value = '';
        addTypingIndicator();

        try {
            const conversationId = conversationHistory[selectedChatbot.key] || null;
            const currentHost = window.location.hostname;
            const apiUrl = `http://${currentHost}:3001/api/wiki-proxy/chat`;

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

            if (sessionToken) {
                headers['X-Wiki-Session'] = sessionToken;
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({
                    message: message,
                    group_id: selectedChatbot.key,
                    conversation_id: conversationId,
                    dify_token: selectedChatbot.token
                })
            });

            console.log('📥 API 響應狀態:', response.status);

            removeTypingIndicator();

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API 錯誤:', response.status, errorText);
                throw new Error(`API 請求失敗: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ API 回應:', result);

            if (result.success) {
                if (result.conversation_id) {
                    conversationHistory[selectedChatbot.key] = result.conversation_id;
                    console.log('💾 已保存對話 ID:', result.conversation_id);
                }
                
                // 過濾掉 thinking 過程
                let finalAnswer = result.answer || '';
                
                // 移除各種格式的 thinking 標記
                finalAnswer = finalAnswer
                    .replace(/<think>[\s\S]*?<\/think>/g, '')  // XML: <think>...</think>
                    .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')  // XML: <thinking>...</thinking>
                    .replace(/```thinking[\s\S]*?```/g, '')  // Markdown code block
                    .replace(/\*\*Thinking:\*\*[\s\S]*?(?=\n\n|\n\*\*|$)/g, '')  // Bold heading
                    .replace(/【思考過程】[\s\S]*?(?=\n\n|$)/g, '')  // 中文標記
                    .replace(/^thinking:[\s\S]*?(?=\n\n|$)/gim, '')  // Plain text
                    .trim();
                
                if (finalAnswer) {
                    addMessage(finalAnswer, 'bot');
                } else {
                    addMessage('⚠️ 未收到有效回應', 'bot');
                }
            } else {
                addMessage(`❌ 抱歉，${result.error || '服務暫時不可用'}`, 'bot');
            }

        } catch (error) {
            console.error('❌ 發送失敗:', error);
            removeTypingIndicator();
            addMessage('❌ 抱歉，連接失敗。請稍後再試。', 'bot');
        }
    }

    // Helper functions
    function parseMarkdown(text) {
        // 簡易 Markdown 解析器
        let html = text;
        
        // 1. 先處理代碼塊 (```...```)，避免其中內容被誤處理
        const codeBlocks = [];
        html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, function(match, lang, code) {
            const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
            codeBlocks.push(`<pre style="background:#f5f5f5;padding:12px;border-radius:6px;overflow-x:auto;margin:8px 0;border-left:3px solid #1976d2;font-family:monospace;"><code>${escapeHtml(code.trim())}</code></pre>`);
            return placeholder;
        });
        
        // 2. 處理行內代碼 (`...`)
        const inlineCodes = [];
        html = html.replace(/`([^`]+)`/g, function(match, code) {
            const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
            inlineCodes.push(`<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;font-family:monospace;font-size:0.9em;">${escapeHtml(code)}</code>`);
            return placeholder;
        });
        
        // 3. 處理標題（必須在行首）
        html = html.replace(/^#### (.+)$/gm, '<h4 style="font-size:14px;font-weight:600;margin:8px 0 4px 0;color:#555;">$1</h4>');
        html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;margin:10px 0 6px 0;color:#333;">$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:600;margin:12px 0 6px 0;color:#1976d2;">$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:18px;font-weight:700;margin:14px 0 8px 0;color:#1976d2;">$1</h1>');
        
        // 4. 處理分隔線 (---)
        html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid #e0e0e0;margin:12px 0;">');
        
        // 5. 處理連結 [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#0066cc;text-decoration:underline;">$1</a>');
        
        // 6. 處理粗體（避免與列表的 * 衝突）
        html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+?)__/g, '<strong>$1</strong>');
        
        // 7. 處理斜體
        html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_\n]+?)_/g, '<em>$1</em>');
        
        // 8. 處理嵌套列表（支援多層縮排和 checkbox）
        const lines = html.split('\n');
        const result = [];
        let listStack = []; // 追蹤當前列表層級
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 匹配列表項（支援 checkbox: - [ ] 或 - [x]）
            const checkboxMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.+)$/);
            const listMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
            
            if (checkboxMatch) {
                // Checkbox 列表項
                const indent = checkboxMatch[1].length;
                const checked = checkboxMatch[2].toLowerCase() === 'x';
                const content = checkboxMatch[3];
                const level = Math.floor(indent / 2);
                
                // 調整列表層級
                while (listStack.length > level + 1) {
                    result.push('</ul>');
                    listStack.pop();
                }
                
                if (listStack.length === level) {
                    result.push('<ul style="margin:4px 0;padding-left:20px;list-style-type:none;">');
                    listStack.push(level);
                }
                
                const checkbox = checked 
                    ? '✅ ' 
                    : '<span style="display:inline-block;width:14px;height:14px;border:2px solid #999;border-radius:3px;margin-right:6px;vertical-align:middle;"></span>';
                result.push(`<li style="margin:3px 0;line-height:1.6;">${checkbox}${content}</li>`);
                
            } else if (listMatch) {
                // 普通列表項
                const indent = listMatch[1].length;
                const content = listMatch[2];
                const level = Math.floor(indent / 2);
                
                // 調整列表層級
                while (listStack.length > level + 1) {
                    result.push('</ul>');
                    listStack.pop();
                }
                
                if (listStack.length === level) {
                    result.push('<ul style="margin:4px 0;padding-left:20px;list-style-type:disc;">');
                    listStack.push(level);
                }
                
                result.push(`<li style="margin:3px 0;line-height:1.6;">${content}</li>`);
            } else {
                // 非列表行，關閉所有開啟的列表
                while (listStack.length > 0) {
                    result.push('</ul>');
                    listStack.pop();
                }
                result.push(line);
            }
        }
        
        // 關閉所有未關閉的列表
        while (listStack.length > 0) {
            result.push('</ul>');
            listStack.pop();
        }
        
        html = result.join('\n');
        
        // 9. 處理換行
        html = html.replace(/\n\n+/g, '<br><br>');  // 多個空行變成段落間隔
        html = html.replace(/\n/g, '<br>');  // 單個換行變成 <br>
        
        // 10. 還原代碼塊和行內代碼
        codeBlocks.forEach((block, i) => {
            html = html.replace(`__CODE_BLOCK_${i}__`, block);
        });
        inlineCodes.forEach((code, i) => {
            html = html.replace(`__INLINE_CODE_${i}__`, code);
        });
        
        return html;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function addMessage(text, type) {
        const container = document.getElementById('chat-messages');
        const isBot = type === 'bot';
        const div = document.createElement('div');
        div.className = `message ${type}-message`;
        div.style.cssText = `
            margin-bottom: 12px;
            padding: 10px 12px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.6;
            max-width: 85%;
            word-break: break-word;
            ${isBot ? 'background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.1); margin-right: auto;' :
                     `background: ${CONFIG.PRIMARY_COLOR}; color: white; margin-left: auto;`}
        `;
        
        // 機器人訊息解析 Markdown，使用者訊息保持原樣
        const content = isBot ? parseMarkdown(text) : escapeHtml(text);
        div.innerHTML = isBot ? `🤖 ${content}` : content;
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function addTypingIndicator() {
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.style.cssText = 'margin-bottom: 12px; padding: 10px 12px; background: white; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); font-size: 14px; color: #666;';
        div.innerHTML = '🤖 <span style="animation: pulse 1.5s ease-in-out infinite;">正在思考中...</span>';
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    function setupDragFunctionality() {
        let isDragging = false;
        let startX, startY, startRight, startBottom;
        const widget = document.getElementById('dify-chatbot-widget');
        const trigger = document.getElementById('chatbot-trigger');

        trigger.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startRight = parseInt(widget.style.right) || 20;
            startBottom = parseInt(widget.style.bottom) || 20;
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            const deltaX = startX - e.clientX;
            const deltaY = startY - e.clientY;
            const newRight = Math.max(20, Math.min(window.innerWidth - 80, startRight + deltaX));
            const newBottom = Math.max(20, Math.min(window.innerHeight - 80, startBottom + deltaY));
            widget.style.right = newRight + 'px';
            widget.style.bottom = newBottom + 'px';
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                console.log('📍 Widget 位置已更新');
            }
            isDragging = false;
        });
    }

    // 初始化 TPV 管理中心按鈕（僅管理員可見）
    function initAdminButton() {
        console.log('🔧 開始初始化 TPV 管理中心按鈕...');
        console.log('👥 當前用戶群組:', userGroups);
        
        let retryCount = 0;
        const MAX_RETRIES = 10;

        function tryAddButton() {
            console.log('🔄 嘗試添加管理按鈕 (第', retryCount + 1, '次)');
            
            // 檢查是否為管理員
            if (!userGroups.includes('administrators')) {
                console.log('👤 非管理員用戶，跳過管理中心按鈕');
                return;
            }
            
            console.log('✅ 確認為管理員，繼續添加按鈕');
            
            console.log('✅ 確認為管理員，繼續添加按鈕');

            // 動態獲取當前主機名
            const currentHost = window.location.hostname;
            const adminPanelUrl = `http://${currentHost}:3001`;
            
            console.log('🔗 管理中心 URL:', adminPanelUrl);

            // 查找導航欄
            console.log('🔍 尋找導航欄元素: .v-toolbar__items');
            const nav = document.querySelector('.v-toolbar__items');
            console.log('📍 導航欄元素:', nav);

            if (!nav) {
                retryCount++;
                if (retryCount <= MAX_RETRIES) {
                    console.warn(`⚠️ 找不到導航欄，延遲 500ms 重試 (${retryCount}/${MAX_RETRIES})`);
                    setTimeout(tryAddButton, 500);
                } else {
                    console.error('❌ 已達最大重試次數，無法找到導航欄。請檢查頁面選擇器：.v-toolbar__items');
                }
                return;
            }

            // 檢查按鈕是否已存在
            if (document.getElementById('tpv-admin-panel-btn')) {
                console.log('✅ TPV 管理中心按鈕已存在');
                return;
            }

            // 創建管理中心按鈕
            const adminPanelBtn = document.createElement('a');
            adminPanelBtn.id = 'tpv-admin-panel-btn';
            adminPanelBtn.href = adminPanelUrl;
            adminPanelBtn.target = '_blank';
            adminPanelBtn.rel = 'noopener noreferrer';
            adminPanelBtn.className = 'v-btn v-btn--flat theme--dark';
            adminPanelBtn.innerHTML = `
                <div class="v-btn__content">
                    <i class="v-icon mdi mdi-cog-outline mr-2"></i>
                    TPV 管理中心
                </div>
            `;
            adminPanelBtn.style.cssText = `
                color: #ffd700 !important;
                margin-left: 8px;
                transition: all 0.3s ease;
            `;

            // 添加 hover 效果
            adminPanelBtn.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(255, 215, 0, 0.1)';
                this.style.transform = 'scale(1.05)';
            });
            adminPanelBtn.addEventListener('mouseleave', function() {
                this.style.background = '';
                this.style.transform = '';
            });

            // 插入到導航欄
            nav.appendChild(adminPanelBtn);

            console.log('✅ TPV 管理中心按鈕已添加');
            console.log('🔗 管理中心 URL:', adminPanelUrl);
        }

        tryAddButton();
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChatbot);
    } else {
        initializeChatbot();
    }

})();
