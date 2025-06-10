import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'http://localhost/v1';
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
}

export default DifyAPI;
