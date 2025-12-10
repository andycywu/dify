
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
      let bodyText: string | undefined;
      let bodyJson: any | undefined;
      try {
        bodyText = await response.text();
        try { bodyJson = JSON.parse(bodyText); } catch { /* ignore */ }
      } catch { /* ignore */ }

      const method = (options.method || 'GET').toString().toUpperCase();
      const reqBody = typeof options.body === 'string' ? options.body : undefined;
      const details = bodyJson ? JSON.stringify(bodyJson) : (bodyText || '');
      throw new Error(`Dify API Error [${response.status}] ${method} ${endpoint}: ${details}\nRequest: ${reqBody || '<no-body>'}`);
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

  async createDocumentByText(datasetId: string, name: string, text: string, indexingTechnique: string = 'high_quality', processRule?: any) {
    const payload = {
      name,
      text,
      indexing_technique: indexingTechnique,
      process_rule: processRule ?? {
        rules: {
          pre_processing_rules: [
            { id: 'remove_extra_spaces', enabled: true },
            { id: 'remove_urls_emails', enabled: true },
          ],
          segmentation: {
            separator: '###',
            max_tokens: 500,
          },
        },
        mode: 'automatic',
      },
    };

    try {
      return await this.request(`/datasets/${datasetId}/document/create_by_text`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // 一些版本的 Dify 使用複數路徑 documents
      return this.request(`/datasets/${datasetId}/documents/create_by_text`, {
      method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  }

  async updateDocumentByText(datasetId: string, documentId: string, name: string, text: string, processRule?: any) {
     const payload = {
       name,
       text,
       process_rule: processRule ?? {
         rules: {
           pre_processing_rules: [
             { id: 'remove_extra_spaces', enabled: true },
             { id: 'remove_urls_emails', enabled: true },
           ],
           segmentation: {
             separator: '###',
             max_tokens: 500,
           },
         },
         mode: 'automatic',
       },
     };
     return this.request(`/datasets/${datasetId}/documents/${documentId}/update_by_text`, {
      method: 'POST',
      body: JSON.stringify(payload),
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
