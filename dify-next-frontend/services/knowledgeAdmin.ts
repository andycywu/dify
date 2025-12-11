import axios from 'axios';

// Minimal Node env typing fallback
declare const process: any;

// Direct API configuration (Legacy/Fallback)
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_DIFY_ADMIN_API_KEY;
const DATASET_API_KEY = process.env.NEXT_PUBLIC_DIFY_DATASET_KEY || 'dataset-cELaA8GGeLpoeXZZXsibGqI3';
const API_BASE_URL = (process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'http://172.27.197.100/v1').replace(/\/$/, '');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_API_KEY || DATASET_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Proxy Base URL
const API_PROXY_BASE = '/api/knowledge';

// Interfaces
export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  permission: string;
  data_source_type: string;
  indexing_technique: string;
  app_count: number;
  document_count: number;
  word_count: number;
  created_by: string;
  created_at: number;
  updated_by: string;
  updated_at: number;
}

export interface Document {
  id: string;
  position: number;
  data_source_type: string;
  data_source_info: any;
  dataset_process_rule_id: string;
  name: string;
  created_from: string;
  created_by: string;
  created_at: number;
  tokens: number;
  indexing_status: string;
  error: string;
  enabled: boolean;
  disabled_at: string;
  disabled_by: string;
  archived: boolean;
  display_status: string;
  word_count: number;
  hit_count: number;
}

export interface CreateKnowledgeBaseData {
  name: string;
  description?: string;
  permission?: string;
  indexing_technique?: string;
  external_knowledge_api_id?: string;
  external_knowledge_id?: string;
}

export interface UpdateKnowledgeBaseData {
  name?: string;
  description?: string;
  permission?: string;
  indexing_technique?: string;
  external_knowledge_api_id?: string;
  external_knowledge_id?: string;
}

export interface CreateDocumentData {
  name: string;
  text: string;
  indexing_technique?: string;
  process_rule?: any;
}

export interface CreateDocumentFromFileData {
  name: string;
  file: File;
  indexing_technique?: string;
  process_rule?: any;
}

// --- Knowledge Base APIs ---

// Updated to use Proxy
export const getKnowledgeBases = async (page = 1, limit = 20) => {
  try {
    console.log(`[knowledgeAdmin] Fetching datasets via proxy...`);
    const response = await axios.get(`${API_PROXY_BASE}/datasets`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] getKnowledgeBases failed:', error.response?.data || error.message);
    throw error;
  }
};

// Also export as fetchDatasets for newer components
export const fetchDatasets = getKnowledgeBases;

// Updated to use Proxy
export const createKnowledgeBase = async (data: CreateKnowledgeBaseData) => {
  try {
    console.log(`[knowledgeAdmin] Creating dataset via proxy...`);
    const response = await axios.post(`${API_PROXY_BASE}/datasets`, data);
    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] createKnowledgeBase failed:', error.response?.data || error.message);
    throw error;
  }
};

// Updated to use Proxy
export const getKnowledgeBaseById = async (datasetId: string) => {
  try {
    console.log(`[knowledgeAdmin] Fetching dataset ${datasetId} via proxy...`);
    const response = await axios.get(`${API_PROXY_BASE}/dataset/${datasetId}`);
    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] getKnowledgeBaseById failed:', error.response?.data || error.message);
    throw error;
  }
};

// Updated to use Proxy
export const updateKnowledgeBase = async (datasetId: string, data: UpdateKnowledgeBaseData) => {
  try {
    console.log(`[knowledgeAdmin] Updating dataset ${datasetId} via proxy...`);
    const response = await axios.patch(`${API_PROXY_BASE}/dataset/${datasetId}`, data);
    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] updateKnowledgeBase failed:', error.response?.data || error.message);
    throw error;
  }
};

// Updated to use Proxy
export const deleteKnowledgeBase = async (datasetId: string) => {
  try {
    console.log(`[knowledgeAdmin] Deleting dataset ${datasetId} via proxy...`);
    const response = await axios.delete(`${API_PROXY_BASE}/dataset/${datasetId}`);
    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] deleteKnowledgeBase failed:', error.response?.data || error.message);
    throw error;
  }
};

// --- Document APIs ---

// Updated to use Proxy
export const getDocuments = async (datasetId: string, params?: {
  keyword?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    console.log(`[knowledgeAdmin] Fetching documents for dataset ${datasetId} via proxy...`);
    const response = await axios.get(`${API_PROXY_BASE}/dataset/${datasetId}/documents`, { params });
    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] getDocuments failed:', error.response?.data || error.message);
    throw error;
  }
};

// Updated to use Proxy
export const createDocumentFromText = async (datasetId: string, data: CreateDocumentData) => {
  try {
    console.log(`[knowledgeAdmin] Creating text document via proxy for dataset: ${datasetId}`);

    const response = await axios.post(`${API_PROXY_BASE}/create-by-text`, {
      datasetId,
      name: data.name,
      text: data.text,
      indexing_technique: data.indexing_technique || 'high_quality',
      process_rule: data.process_rule || { mode: 'automatic' }
    });

    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] createDocumentFromText failed:', error.response?.data || error.message);
    throw error;
  }
};

// Updated to use Proxy
export const createDocumentFromFile = async (datasetId: string, data: CreateDocumentFromFileData) => {
  try {
    console.log(`[knowledgeAdmin] Uploading file via proxy for dataset: ${datasetId}`);

    const formData = new FormData();
    formData.append('datasetId', datasetId);
    formData.append('file', data.file);

    // Pass process_rule as JSON string if needed, or let backend handle defaults
    if (data.process_rule) {
      formData.append('process_rule', JSON.stringify(data.process_rule));
    } else {
       formData.append('process_rule', JSON.stringify({ mode: 'automatic' }));
    }

    if (data.indexing_technique) {
        formData.append('indexing_technique', data.indexing_technique);
    }

    const response = await axios.post(`${API_PROXY_BASE}/create-by-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] createDocumentFromFile failed:', error.response?.data || error.message);
    throw error;
  }
};

// Updated to use Proxy
export const deleteDocument = async (datasetId: string, documentId: string) => {
  try {
    console.log(`[knowledgeAdmin] Deleting document ${documentId} from dataset ${datasetId} via proxy...`);
    const response = await axios.delete(`${API_PROXY_BASE}/dataset/${datasetId}/document/${documentId}`);
    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] deleteDocument failed:', error.response?.data || error.message);
    throw error;
  }
};

// Get chunks from a document
// Updated to use Proxy
export const getDocumentChunks = async (datasetId: string, documentId: string) => {
  try {
    console.log(`[knowledgeAdmin] Fetching chunks for document ${documentId} via proxy...`);
    const response = await axios.get(`${API_PROXY_BASE}/dataset/${datasetId}/document/${documentId}/segments`);
    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] getDocumentChunks failed:', error.response?.data || error.message);
    throw error;
  }
};

// Retrieve chunks from knowledge base (for search)
// Updated to use Proxy
export const retrieveChunks = async (datasetId: string, query: string, limit = 10) => {
  try {
    console.log(`[knowledgeAdmin] Retrieving chunks for dataset ${datasetId} via proxy...`);
    const response = await axios.post(`${API_PROXY_BASE}/dataset/${datasetId}/retrieve`, {
      query,
      retrieval_model: {
        search_method: 'semantic_search',
        reranking_enable: false,
        reranking_model: {
          reranking_provider_name: '',
          reranking_model_name: ''
        },
        top_k: limit,
        score_threshold_enabled: false
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] retrieveChunks failed:', error.response?.data || error.message);
    throw error;
  }
};

// Get available embedding models
// Updated to use Proxy
export const getEmbeddingModels = async () => {
  try {
    console.log(`[knowledgeAdmin] Fetching embedding models via proxy...`);
    const response = await axios.get(`${API_PROXY_BASE}/embedding-models`);
    return response.data;
  } catch (error: any) {
    console.error('[knowledgeAdmin] getEmbeddingModels failed:', error.response?.data || error.message);
    throw error;
  }
};

// Mock function for getting apps using knowledge base
export const getAppsUsingKnowledgeBase = async (datasetId: string) => {
  return Promise.resolve({ data: [] });
};
