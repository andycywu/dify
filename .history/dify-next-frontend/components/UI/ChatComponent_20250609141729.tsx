import React, { useState, useEffect, useRef } from 'react';
import DifyAPI from '../../services/difyAPI';
import { useAuth } from '../../contexts/AuthContext';
import Image from 'next/image';
import AssistantCitation, { CitationResource } from './AssistantCitation';
import AssistantSuggestedQuestions from './AssistantSuggestedQuestions';
import { parseDifyTimestamp } from '../../utils/parseDifyTimestamp';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: any; // 新增 metadata
}

interface ChatComponentProps {
  apiKey: string;
  apiBaseUrl: string;
  avatarSrc?: string;
  welcomeMessage?: string;
  enableVoice?: boolean;
  enableHistory?: boolean;
  primaryColor?: string;
  customStyles?: {
    chatContainer?: React.CSSProperties;
    messageContainer?: React.CSSProperties;
    userMessage?: React.CSSProperties;
    assistantMessage?: React.CSSProperties;
    inputArea?: React.CSSProperties;
  };
  customLogo?: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  apiKey,
  apiBaseUrl,
  avatarSrc = '/images/assistant-avatar.png',
  welcomeMessage = 'Hello! How can I assist you today?',
  enableVoice = false,
  enableHistory = false,
  primaryColor = '#3B82F6',
  customStyles = {},
  customLogo,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true); // 新增：建議問題開關
  const [latestSuggestedQuestions, setLatestSuggestedQuestions] = useState<string[] | undefined>(undefined); // 新增：動態建議問題

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const difyAPI = new DifyAPI(apiBaseUrl, apiKey);

  // Feature flag
  const ENABLE_CITATION_AND_SUGGESTED = process.env.NEXT_PUBLIC_ENABLE_CHAT_CITATION_AND_SUGGESTED_QUESTIONS === 'true';

  // Initialize with welcome message
  useEffect(() => {
    if (welcomeMessage) {
      setMessages([
        {
          id: 'welcome',
          content: welcomeMessage,
          role: 'assistant',
          timestamp: new Date(),
        },
      ]);
    }

    // Load conversation history if logged in and history enabled
    if (isAuthenticated && enableHistory) {
      loadConversations();
    }
  }, [isAuthenticated, enableHistory, welcomeMessage]);

  // 修正：如果有 conversationId，且 messages 為 welcome，則自動載入歷史紀錄
  useEffect(() => {
    if (
      conversationId &&
      messages.length === 1 &&
      messages[0].id === 'welcome' &&
      isAuthenticated &&
      enableHistory
    ) {
      selectConversation(conversationId);
    }
  }, [conversationId, messages, isAuthenticated, enableHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 新增：取得建議問題
  const fetchSuggestedQuestions = async (messageId: string) => {
    if (!showSuggestedQuestions || !user?.id || messageId === 'welcome') {
      setLatestSuggestedQuestions(undefined);
      return;
    }
    try {
      const questions = await difyAPI.getSuggestedQuestions(messageId, user.id);
      setLatestSuggestedQuestions(questions);
    } catch (e) {
      setLatestSuggestedQuestions(undefined);
    }
  };

  // 新增：每次 assistant 回覆後自動取得建議問題
  useEffect(() => {
    if (!showSuggestedQuestions) {
      setLatestSuggestedQuestions(undefined);
      return;
    }
    // 找到最後一則 assistant 訊息
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant && lastAssistant.id) {
      fetchSuggestedQuestions(lastAssistant.id);
    } else {
      setLatestSuggestedQuestions(undefined);
    }
  }, [messages, showSuggestedQuestions, user?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!user) {
      console.warn('No user found, cannot load conversations');
      return;
    }
    try {
      console.log('Loading conversations for user.id:', user.id);
      const result = await difyAPI.getConversations(user.id); // 傳入 user.id
      console.log('Dify getConversations result:', result);
      // 支援 result.data 或 result.results 或直接陣列
      if (Array.isArray(result)) {
        setConversations(result);
      } else if (Array.isArray(result.data)) {
        setConversations(result.data);
      } else if (Array.isArray(result.results)) {
        setConversations(result.results);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Failed to load conversations', error);
    }
  };

  const selectConversation = async (id: string) => {
    try {
      const historyResult = await difyAPI.getConversationHistory({
        conversation_id: id,
        user_id: user?.id,
        limit: 50, // 可調整
      });
      setConversationId(id);
      // Dify /messages API 回傳格式為 { data: Message[] }
      const formattedMessages = (historyResult.data || []).map((msg: any) => {
        // robust timestamp parse for Dify chat-messages/chatflow
        let ts: Date = parseDifyTimestamp(msg.created_at ?? msg.metadata?.created_at);
        // 根據 role 決定顯示內容，確保 user/assistant 都正確顯示
        let content = '';
        if (msg.role === 'user') {
          content = msg.query || msg.content || '';
        } else if (msg.role === 'assistant') {
          content = msg.answer || msg.content || '';
        } else {
          content = msg.content || msg.answer || msg.query || '';
        }
        return {
          id: msg.id || Math.random().toString(),
          content,
          role: msg.role || (msg.answer ? 'assistant' : 'user'),
          timestamp: ts,
          metadata: msg.metadata,
        };
      });
      setMessages(formattedMessages);
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to load conversation history', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await difyAPI.sendChatMessage({
        query: input,
        conversation_id: conversationId || undefined,
        user: user?.id, // 修正：只傳 user id 字串
        response_mode: 'blocking',
        inputs: {}, // 修正：確保 inputs 一定有傳
      });
      // 新增：回報 token 用量
      if (user?.id && response?.metadata?.usage?.total_tokens) {
        fetch('/api/usage-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            tokenUsage: response.metadata.usage.total_tokens,
          }),
        });
      }
      
      const assistantMessage: ChatMessage = {
        id: response.id,
        content: response.answer,
        role: 'assistant',
        timestamp: new Date(response.created_at),
        metadata: response.metadata, // 新增 metadata
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation ID if this is a new conversation
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          content: 'Sorry, there was an error processing your request.',
          role: 'assistant',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startListening = () => {
    if (!enableVoice) return;

    // Add type declarations for SpeechRecognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'zh-TW';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else if ('SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'zh-TW';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  };

  const createNewConversation = async () => {
    setConversationId(null);
    setMessages([
      {
        id: 'welcome',
        content: welcomeMessage,
        role: 'assistant',
        timestamp: new Date(),
      },
    ]);
  };

  // extract citation and suggested questions from metadata
  function extractCitation(metadata?: any): CitationResource[] | undefined {
    if (!metadata || !Array.isArray(metadata.retriever_resources)) {
      console.log('No retriever_resources in metadata', metadata);
      return undefined;
    }
    console.log('Extracted citation:', metadata.retriever_resources);
    return metadata.retriever_resources;
  }
  function extractSuggestedQuestions(metadata?: any): string[] | undefined {
    if (!metadata || !Array.isArray(metadata.suggested_questions)) {
      console.log('No suggested_questions in metadata', metadata);
      return undefined;
    }
    console.log('Extracted suggestedQuestions:', metadata.suggested_questions);
    return metadata.suggested_questions;
  }

  if (authLoading) {
    return <div className="flex items-center justify-center h-full">載入中...</div>;
  }
  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-full">請先登入以使用智能機器人對話匡</div>;
  }

  return (
    <div 
      className="flex flex-col rounded-lg shadow-lg overflow-hidden border border-gray-200"
      style={{
        ...customStyles.chatContainer,
        backgroundColor: '#ffffff',
        height: '600px',
        maxHeight: '80vh',
        minHeight: '400px',
      }}
    >
      {/* Header */}
      <div 
        className="flex justify-between items-center p-4 border-b" 
        style={{ backgroundColor: primaryColor, color: 'white' }}
      >
        <div className="flex items-center">
          {customLogo ? (
            <div className="w-8 h-8 mr-2">
              <Image 
                src={customLogo} 
                alt="Logo" 
                width={32} 
                height={32} 
                className="rounded"
              />
            </div>
          ) : null}
          <h2 className="text-xl font-semibold">TPV OBM測試助理</h2>
        </div>
        {/* 新增：建議問題開關 */}
        <div className="flex items-center ml-4">
          <label className="flex items-center cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={showSuggestedQuestions}
              onChange={e => setShowSuggestedQuestions(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="ml-2">建議問題</span>
          </label>
        </div>
        {enableHistory && isAuthenticated && (
          <button
            className="p-2 rounded hover:bg-opacity-80 ml-2"
            onClick={() => setShowHistory(!showHistory)}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        )}
      </div>

      {/* Chat Area with optional History sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* History sidebar */}
        {showHistory && enableHistory && isAuthenticated && (
          <div className="w-64 border-r border-gray-200 overflow-y-auto p-2 bg-gray-50">
            <div className="mb-2">
              <button 
                className="w-full p-2 rounded text-white mb-2"
                style={{ backgroundColor: primaryColor }}
                onClick={createNewConversation}
              >
                New Conversation
              </button>
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-500 mb-1">History</h3>
              {conversations.length > 0 ? (
                conversations.map(conv => (
                  <div 
                    key={conv.id}
                    className={`p-2 rounded cursor-pointer mb-1 hover:bg-gray-200 ${
                      conversationId === conv.id ? 'bg-gray-200' : ''
                    }`}
                    onClick={() => selectConversation(conv.id)}
                  >
                    <p className="truncate text-sm">{conv.name || 'Conversation'}</p>
                    <p className="text-xs text-gray-500">
                      {conv.created_at
                        ? (typeof conv.created_at === 'number'
                            ? new Date(conv.created_at * (conv.created_at > 1000000000000 ? 1 : 1000)).toLocaleDateString()
                            : new Date(conv.created_at).toLocaleDateString())
                        : ''}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No conversations yet</p>
              )}
            </div>
          </div>
        )}
        
        {/* Messages Container */}
        <div 
          className="flex-1 flex flex-col overflow-hidden"
          style={customStyles.messageContainer}
        >
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map(message => {
              const isAssistant = message.role === 'assistant';
              let citation: CitationResource[] | undefined;
              if (isAssistant && ENABLE_CITATION_AND_SUGGESTED && (message as any).metadata) {
                citation = extractCitation((message as any).metadata);
              }
              return (
                <div
                  key={message.id}
                  className={`mb-4 ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
                >
                  <div
                    className={`max-w-3/4 rounded-lg p-3 ${message.role === 'user' ? 'bg-blue-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}
                    style={message.role === 'user' ? { ...customStyles.userMessage, backgroundColor: `${primaryColor}20` } : customStyles.assistantMessage}
                  >
                    {isAssistant && (
                      <div className="flex items-start mb-1">
                        <div className="w-6 h-6 mr-2 rounded-full overflow-hidden">
                          <Image src={avatarSrc} alt="Assistant" width={24} height={24} />
                        </div>
                        <span className="font-bold text-sm">Assistant</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {/* 引用來源顯示 */}
                    {isAssistant && ENABLE_CITATION_AND_SUGGESTED && citation && <AssistantCitation resources={citation} />}
                    {/* 建議問題顯示（新版，僅顯示於最後一則 assistant 且開關開啟時） */}
                    {isAssistant && showSuggestedQuestions && latestSuggestedQuestions &&
                      messages[messages.length - 1]?.id === message.id &&
                      <AssistantSuggestedQuestions questions={latestSuggestedQuestions} onSelect={setInput} />
                    }
                    <div className="text-xs text-gray-500 mt-1 text-right">{message.timestamp.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-lg p-3 flex items-center">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div 
            className="border-t border-gray-200 p-4 bg-white"
            style={customStyles.inputArea}
          >
            <div className="flex items-end">
              <textarea
                className="w-full resize-none border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                style={{ minHeight: '60px' }}
              />
              <div className="flex ml-2">
                {enableVoice && (
                  <button
                    className={`p-2 rounded-full mr-2 ${
                      isListening ? 'bg-red-500' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    onClick={startListening}
                    title="Voice input"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                )}
                <button
                  className="p-2 rounded-full text-white"
                  style={{ backgroundColor: primaryColor }}
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styling for typing indicator */}
      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
        }
        .typing-indicator span {
          height: 8px;
          width: 8px;
          margin: 0 2px;
          background-color: #8B8B8B;
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.5s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatComponent;
