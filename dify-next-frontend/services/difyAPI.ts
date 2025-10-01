import axios from 'axios';

const trimTrailingSlash = (value: string) => value.endsWith('/') ? value.replace(/\/+$/, '') : value;

const resolveApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_DIFY_API_BASE_URL) {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_DIFY_API_BASE_URL);
  }

  return '/api/v1';
};

const API_BASE_URL = resolveApiBaseUrl();
const API_KEY = process.env.NEXT_PUBLIC_DIFY_API_KEY || '';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  created_at?: number | string; // 修正型別，允許 number
}

interface ChatRequest {
  query: string;
  conversation_id?: string;
  user?: string; // 修正：user 應為 user id 字串
  inputs?: Record<string, any>;
  response_mode?: 'streaming' | 'blocking';
  user_agent?: string;
}

interface ChatResponse {
  answer: string;
  conversation_id: string;
  id: string;
  created_at: number;
  metadata?: {
    usage?: {
      total_tokens?: number;
      prompt_tokens?: number;
      completion_tokens?: number;
    };
    suggested_questions?: string[]; // 新增：建議問題可能在 metadata 中
    retriever_resources?: any[]; // 新增：引用資源
    [key: string]: any; // 允許其他 metadata 屬性
  };
}

interface ConversationHistoryParams {
  conversation_id: string;
  user_id?: string;
}

export interface ConversationHistoryResponse {
  id: string;
  name: string;
  inputs: Record<string, any>;
  status: 'normal' | 'archived';
  created_at: number;
  messages: Message[];
}

export class DifyAPI {
  private apiBaseUrl: string;
  private apiKey: string;

  constructor(apiBaseUrl: string = API_BASE_URL, apiKey: string = API_KEY) {
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
  }

  /**
   * 發送訊息給 Dify chat-messages API，完全依照官方 API 文件設計
   * https://docs.dify.ai/api-reference/chat/send-chat-message
   */
  async sendChatMessage(params: ChatRequest): Promise<ChatResponse> {
    try {
      // 官方 API 必要欄位: query, inputs
      if (!params.query || !params.inputs) {
        throw new Error('Dify API: query 與 inputs 為必要欄位');
      }
      const response = await axios.post(
        `${this.apiBaseUrl}/chat-messages`,
        {
          query: params.query,
          inputs: params.inputs,
          conversation_id: params.conversation_id,
          response_mode: params.response_mode,
          user: params.user, // 直接傳 user id 字串
          user_agent: params.user_agent
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      // axios error 處理
      if (error.response) {
        throw new Error(`Dify API error: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async getConversationHistory(params: ConversationHistoryParams & { first_id?: string; limit?: number }): Promise<any> {
    const response = await axios.get(
      `${this.apiBaseUrl}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        params: {
          conversation_id: params.conversation_id,
          user: params.user_id, // Dify OpenAPI: user
          first_id: params.first_id,
          limit: params.limit || 20
        }
      }
    );
    return response.data;
  }

  async getConversations(userId?: string): Promise<any> {
    const response = await axios.get(
      `${this.apiBaseUrl}/conversations`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        params: userId ? { user: userId } : undefined
      }
    );
    return response.data;
  }

  async createConversation(name: string): Promise<any> {
    const response = await axios.post(
      `${this.apiBaseUrl}/conversations`,
      { name },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );
    return response.data;
  }

  /**
   * 取得單一訊息內容（根據 messageId）
   */
  async getMessageById(messageId: string): Promise<Message> {
    const response = await axios.get(
      `${this.apiBaseUrl}/chat-messages/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );
    return response.data;
  }

  /**
   * 取得完整訊息 thread（由最新 messageId 往上追溯 parent_message_id）
   */
  async getMessageThread(latestMessageId: string): Promise<Message[]> {
    const thread: Message[] = [];
    let currentId: string | undefined = latestMessageId;
    while (currentId) {
      const msg = await this.getMessageById(currentId);
      thread.unshift(msg); // 由舊到新
      // @ts-ignore
      currentId = (msg as any).parent_message_id || undefined;
    }
    return thread;
  }

  /**
   * 取得建議問題 (suggested questions) for a message
   * GET /messages/{message_id}/suggested?user={user_id}
   * 回傳 { result: 'success', data: string[] }
   */
  async getSuggestedQuestions(messageId: string, userId: string): Promise<string[]> {
    try {
      console.log('Making request to:', `${this.apiBaseUrl}/messages/${messageId}/suggested`); // 調試用
      const response = await axios.get(
        `${this.apiBaseUrl}/messages/${messageId}/suggested`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          params: { user: userId }
        }
      );

      console.log('Suggested questions API response status:', response.status); // 調試用
      console.log('Suggested questions API response data:', JSON.stringify(response.data, null, 2)); // 調試用

      if (response.data && response.data.result === 'success' && Array.isArray(response.data.data)) {
        console.log('Using response.data.data format:', response.data.data); // 調試用
        return response.data.data;
      }

      // 嘗試其他可能的回應格式
      if (Array.isArray(response.data)) {
        console.log('Using direct array format:', response.data); // 調試用
        return response.data;
      }

      if (response.data && Array.isArray(response.data.suggested_questions)) {
        console.log('Using response.data.suggested_questions format:', response.data.suggested_questions); // 調試用
        return response.data.suggested_questions;
      }

      console.warn('Unexpected suggested questions response format:', response.data);
      return [];
    } catch (error: any) {
      console.error('Error fetching suggested questions:', error);
      if (error.response) {
        console.error('API Error Response status:', error.response.status);
        console.error('API Error Response data:', error.response.data);
      }
      return [];
    }
  }

  /**
   * 取得應用程式參數配置 (包含開場白、建議問題等)
   * GET /parameters?user={user_id}
   * 回傳應用程式配置信息包括 opening_statement
   */
  async getParameters(userId?: string): Promise<{
    opening_statement?: string;
    suggested_questions?: string[];
    suggested_questions_after_answer?: { enabled: boolean };
    speech_to_text?: { enabled: boolean };
    text_to_speech?: { enabled: boolean; voice?: string; language?: string; autoPlay?: string };
    retriever_resource?: { enabled: boolean };
    annotation_reply?: { enabled: boolean };
    user_input_form?: any[];
    file_upload?: { image?: any; document?: any; audio?: any; video?: any };
    system_parameters?: Record<string, any>;
  }> {
    try {
      console.log('Making request to:', `${this.apiBaseUrl}/parameters`); // 調試用
      const response = await axios.get(
        `${this.apiBaseUrl}/parameters`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          params: userId ? { user: userId } : undefined
        }
      );
      console.log('Parameters API response:', response.data); // 調試用
      return response.data;
    } catch (error: any) {
      console.error('Error fetching parameters:', error);
      if (error.response) {
        console.error('Parameters API Error Response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }
}

export default DifyAPI;
