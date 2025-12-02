
export class DifyClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Dify API Error [${response.status}]: ${error}`);
    }
    return response.json();
  }

  async createDataset(name: string, permission: string = 'only_me') {
    return this.request('/datasets', {
      method: 'POST',
      body: JSON.stringify({ name, permission }),
    });
  }

  async listDatasets(page: number = 1, limit: number = 20) {
    return this.request(`/datasets?page=${page}&limit=${limit}`);
  }

  async createDocumentByText(datasetId: string, name: string, text: string, indexingTechnique: string = 'high_quality', processRule: any = { mode: 'automatic' }) {
    return this.request(`/datasets/${datasetId}/document/create_by_text`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        text,
        indexing_technique: indexingTechnique,
        process_rule: processRule,
      }),
    });
  }

  async updateDocumentByText(datasetId: string, documentId: string, name: string, text: string, processRule: any = { mode: 'automatic' }) {
     return this.request(`/datasets/${datasetId}/documents/${documentId}/update_by_text`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        text,
        process_rule: processRule,
      }),
    });
  }

  async listDocuments(datasetId: string, page: number = 1, limit: number = 100, keyword: string = '') {
      return this.request(`/datasets/${datasetId}/documents?page=${page}&limit=${limit}&keyword=${keyword}`);
  }

  async deleteDocument(datasetId: string, documentId: string) {
      return this.request(`/datasets/${datasetId}/documents/${documentId}`, {
          method: 'DELETE'
      });
  }
}
