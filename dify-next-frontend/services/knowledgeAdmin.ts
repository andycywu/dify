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

// Legacy Direct Calls
export const createKnowledgeBase = async (data: CreateKnowledgeBaseData) => {
  try {
    const response = await axiosInstance.post('/datasets', data);
    return response.data;
  } catch (error) {
    console.error('Error creating knowledge base:', error);
    throw error;
  }
};

export const getKnowledgeBaseById = async (datasetId: string) => {
  try {
    const response = await axiosInstance.get(`/datasets/${datasetId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    throw error;
  }
};

export const updateKnowledgeBase = async (datasetId: string, data: UpdateKnowledgeBaseData) => {
  try {
    const response = await axiosInstance.patch(`/datasets/${datasetId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    throw error;
  }
};

export const deleteKnowledgeBase = async (datasetId: string) => {
  try {
    const response = await axiosInstance.delete(`/datasets/${datasetId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting knowledge base:', error);
    throw error;
  }
};

// --- Document APIs ---

export const getDocuments = async (datasetId: string, params?: {
  keyword?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const response = await axiosInstance.get(`/datasets/${datasetId}/documents`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
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

export const deleteDocument = async (datasetId: string, documentId: string) => {
  try {
    const response = await axiosInstance.delete(`/datasets/${datasetId}/documents/${documentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Get chunks from a document
export const getDocumentChunks = async (datasetId: string, documentId: string) => {
  try {
    const response = await axiosInstance.get(`/datasets/${datasetId}/documents/${documentId}/segments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document chunks:', error);
    throw error;
  }
};

// Retrieve chunks from knowledge base (for search)
export const retrieveChunks = async (datasetId: string, query: string, limit = 10) => {
  try {
    const response = await axiosInstance.post(`/datasets/${datasetId}/retrieve`, {
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
  } catch (error) {
    console.error('Error retrieving chunks:', error);
    throw error;
  }
};

// Get available embedding models
export const getEmbeddingModels = async () => {
  try {
    const response = await axiosInstance.get('/datasets/embedding-models');
    return response.data;
  } catch (error) {
    console.error('Error fetching embedding models:', error);
    throw error;
  }
};

// Mock function for getting apps using knowledge base
export const getAppsUsingKnowledgeBase = async (datasetId: string) => {
  return Promise.resolve({ data: [] });
};
