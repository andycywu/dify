
// Minimal Node env typing fallback to avoid TS errors when @types/node is absent
// TODO: replace with proper types by installing devDependency @types/node
declare const process: any;

export class DifyClient {
  private baseUrl: string;
  private apiKey: string;
  private adminKey?: string;
  private datasetKey?: string;

  constructor(baseUrl: string, apiKey: string) {
    // Normalize base URL
    this.baseUrl = baseUrl.replace(/\/$/, '');
    // Capture keys from env for flexible selection
    this.adminKey = process.env.DIFY_ADMIN_API_KEY || undefined;
    this.datasetKey = process.env.NEXT_PUBLIC_DIFY_DATASET_KEY || process.env.DIFY_DATASET_API_KEY || undefined;
    // Backward-compatible default apiKey (will be overridden per request)
    this.apiKey = apiKey || this.datasetKey || this.adminKey || '';
  }

  private async request(endpoint: string, options: RequestInit = {}, useAdmin: boolean = false, baseOverride?: string) {
    const base = (baseOverride || this.baseUrl).replace(/\/$/, '');
    const url = `${base}${endpoint}`;
    const token = useAdmin
      ? (this.adminKey || this.apiKey)
      : (this.datasetKey || this.apiKey || this.adminKey || '');
    const headers = {
      'Authorization': `Bearer ${token}`,
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
    return this.request(`/datasets?page=${page}&limit=${limit}` as any, {}, true);
  }

  async getDataset(id: string) {
    return this.request(`/datasets/${id}`, {}, true);
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

    // Use /v1 for dataset document write operations; console/api is primarily for admin console
    const isConsoleApi = /\/console\/api$/.test(this.baseUrl);
    const apiBase = isConsoleApi ? this.baseUrl.replace(/\/console\/api$/, '/v1') : this.baseUrl;
    // Try singular first (commonly used by Dify /v1), then plural fallbacks
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
        }, false, apiBase);
      } catch (e: any) {
        lastError = e;
        const msg = String(e?.message || e);
        // 遇到未授權/禁止時不再嘗試其他端點
        if (/(401|403)/i.test(msg)) throw e;
        // 下列狀況嘗試下一個端點：404/405/Not Found 以及通用 500 Internal Server Error
        if (/(404|405|Not\s*Found|500|Internal\s*Server\s*Error)/i.test(msg)) {
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
    const isConsoleApi = /\/console\/api$/.test(this.baseUrl);
    const apiBase = isConsoleApi ? this.baseUrl.replace(/\/console\/api$/, '/v1') : this.baseUrl;
    const candidates = [
      `/datasets/${datasetId}/documents/${documentId}/update_by_text`,
      `/datasets/${datasetId}/documents/${documentId}/update-by-text`,
      // optional singular fallbacks if server expects singular for update
      `/datasets/${datasetId}/document/${documentId}/update_by_text`,
      `/datasets/${datasetId}/document/${documentId}/update-by-text`,
    ];
    let lastError: any;
    for (const ep of candidates) {
      try {
        // eslint-disable-next-line no-console
        console.log(`[DifyClient] update_by_text trying: ${ep}`);
        return await this.request(ep, {
          method: 'POST',
          body: JSON.stringify(payload),
        }, false, apiBase);
      } catch (e: any) {
        lastError = e;
        const msg = String(e?.message || e);
        if (/(401|403)/i.test(msg)) throw e;
        if (/(404|405|Not\s*Found|500|Internal\s*Server\s*Error)/i.test(msg)) continue;
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
