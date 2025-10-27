// Knowledge Base Admin API Service
import axios from 'axios';

// 直接調用 Dify 原生 API（無代理層）
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_DIFY_DATASET_KEY || 'dataset-cELaA8GGeLpoeXZZXsibGqI3';
const API_BASE_URL = process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'http://localhost/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

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
  process_rule?: {
    rules: {
      pre_processing_rules: Array<{
        id: string;
        enabled: boolean;
      }>;
      segmentation: {
        separator: string;
        max_tokens: number;
      };
    };
    mode: string;
  };
}

export interface CreateDocumentFromFileData {
  name: string;
  file: File;
  indexing_technique?: string;
  process_rule?: {
    rules: {
      pre_processing_rules: Array<{
        id: string;
        enabled: boolean;
      }>;
      segmentation: {
        separator: string;
        max_tokens: number;
      };
    };
    mode: string;
  };
}

// Knowledge Base APIs
export const getKnowledgeBases = async () => {
  try {
    console.log('Fetching knowledge bases from:', `${API_BASE_URL}/datasets`);
    const response = await axiosInstance.get('/datasets');
    return response.data;
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    throw error;
  }
};

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

// Document APIs
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

export const createDocumentFromText = async (datasetId: string, data: CreateDocumentData) => {
  try {
    const requestData = {
      name: data.name,
      text: data.text,
      indexing_technique: data.indexing_technique || 'high_quality',
      process_rule: data.process_rule || {
        rules: {
          pre_processing_rules: [
            {
              id: 'remove_extra_spaces',
              enabled: true
            },
            {
              id: 'remove_urls_emails',
              enabled: true
            }
          ],
          segmentation: {
            separator: '###',
            max_tokens: 500
          }
        },
        mode: 'automatic'
      }
    };

    const response = await axiosInstance.post(`/datasets/${datasetId}/document/create_by_text`, requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

export const createDocumentFromFile = async (datasetId: string, data: CreateDocumentFromFileData) => {
  try {
    const formData = new FormData();
    
    // Add the file using 'file' field name
    formData.append('file', data.file);
    
    // Add the data configuration as JSON string in 'data' field
    const configData = {
      indexing_technique: data.indexing_technique || 'high_quality',
      process_rule: {
        rules: {
          pre_processing_rules: [
            {
              id: 'remove_extra_spaces',
              enabled: true
            },
            {
              id: 'remove_urls_emails', 
              enabled: true
            }
          ],
          segmentation: {
            separator: '###',
            max_tokens: 500
          }
        },
        mode: 'custom'
      }
    };
    
    formData.append('data', JSON.stringify(configData));

    console.log('Attempting file upload to:', `/datasets/${datasetId}/document/create_by_file`);
    console.log('File name:', data.file.name);
    console.log('File size:', data.file.size);
    console.log('File type:', data.file.type);
    console.log('Config data:', JSON.stringify(configData));

    const response = await axiosInstance.post(`/datasets/${datasetId}/document/create_by_file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating document from file:', error);
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
      console.error('Response status:', axiosError.response?.status);
      console.error('Response data:', axiosError.response?.data);
      console.error('Response headers:', axiosError.response?.headers);
    }
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
  // This would need to be implemented based on your app-dataset relationship API
  // For now, returning mock data
  return Promise.resolve({ data: [] });
};
