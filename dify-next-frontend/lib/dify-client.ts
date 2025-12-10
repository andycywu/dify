
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

    // 兼容多個可能的端點路徑（不同版本/部署差異）
    const candidates = [
      `/datasets/${datasetId}/document/create_by_text`,
      `/datasets/${datasetId}/document/create-by-text`,
      `/datasets/${datasetId}/documents/create_by_text`,
      `/datasets/${datasetId}/documents/create-by-text`,
    ];

    let lastError: any;
    for (const ep of candidates) {
      try {
        // 記錄正在嘗試的端點，方便問題追蹤
        // eslint-disable-next-line no-console
        console.log(`[DifyClient] create_by_text trying: ${ep}`);
        return await this.request(ep, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (e: any) {
        lastError = e;
        const msg = String(e?.message || e);
        // 404/405/Not Found 之類才嘗試下一個；其他錯誤就直接拋出
        if (/(404|405|Not\s*Found)/i.test(msg)) {
          continue;
        }
        throw e;
      }
    }
    throw lastError;
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
     const candidates = [
       `/datasets/${datasetId}/documents/${documentId}/update_by_text`,
       `/datasets/${datasetId}/documents/${documentId}/update-by-text`,
     ];
     let lastError: any;
     for (const ep of candidates) {
       try {
         // eslint-disable-next-line no-console
         console.log(`[DifyClient] update_by_text trying: ${ep}`);
         return await this.request(ep, {
           method: 'POST',
           body: JSON.stringify(payload),
         });
       } catch (e: any) {
         lastError = e;
         const msg = String(e?.message || e);
         if (/(404|405|Not\s*Found)/i.test(msg)) continue;
         throw e;
       }
     }
     throw lastError;
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
