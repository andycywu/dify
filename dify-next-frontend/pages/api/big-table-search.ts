import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

/**
 * Big Table Search API
 *
 * 這個 API 提供後端統一查詢多個 Dataset 的功能
 * 可用於批次查詢或需要伺服器端處理的場景
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 驗證用戶登入狀態
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized - Please login' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { keyword, datasets = ['inhouse', 'outsourcing'], limit = 50 } = req.body;

  // 驗證必要參數
  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid keyword. Please provide a non-empty string.'
    });
  }

  if (!Array.isArray(datasets) || datasets.length === 0) {
    return res.status(400).json({
      error: 'Invalid datasets. Please provide an array of dataset names.'
    });
  }

  try {
    const DIFY_API_BASE = process.env.NEXT_PUBLIC_DIFY_API_BASE_URL;
    const DIFY_API_KEY = process.env.DIFY_DATASET_API_KEY;

    if (!DIFY_API_BASE || !DIFY_API_KEY) {
      console.error('Missing Dify configuration');
      return res.status(500).json({
        error: 'Server configuration error. Please contact administrator.'
      });
    }

    const DATASET_IDS: Record<string, string> = {
      inhouse: process.env.NEXT_PUBLIC_KB_INHOUSE_ID || '',
      outsourcing: process.env.NEXT_PUBLIC_KB_OUTSOURCING_ID || '',
    };

    const allResults: any[] = [];
    const errors: string[] = [];

    // 並行查詢所有 datasets
    const searchPromises = datasets.map(async (dataset) => {
      const datasetId = DATASET_IDS[dataset];

      if (!datasetId) {
        console.warn(`Dataset ID not configured for: ${dataset}`);
        errors.push(`Dataset "${dataset}" not configured`);
        return [];
      }

      try {
        const response = await fetch(
          `${DIFY_API_BASE}/v1/datasets/${datasetId}/retrieve`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${DIFY_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: keyword.trim(),
              retrieval_model: {
                search_method: 'hybrid_search',
                reranking_enable: true,
                reranking_mode: 'reranking_model',
                top_k: limit,
                score_threshold_enabled: false,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to search ${dataset}:`, response.status, errorText);
          errors.push(`Failed to search ${dataset}: ${response.statusText}`);
          return [];
        }

        const data = await response.json();

        return (data.records || []).map((record: any) => ({
          content: record.content || record.segment?.content || '',
          score: record.score || 0,
          document_id: record.document_id || record.segment?.document_id || '',
          document_name: record.document_name || record.segment?.document_name || 'Unknown',
          dataset_id: datasetId,
          dataset_name: dataset === 'inhouse'
            ? 'Project KB (InHouse)'
            : 'Project KB (Outsourcing)',
          position: record.segment?.position || 0,
          word_count: record.segment?.word_count || 0,
        }));
      } catch (err: any) {
        console.error(`Error searching ${dataset}:`, err);
        errors.push(`Error searching ${dataset}: ${err.message}`);
        return [];
      }
    });

    // 等待所有查詢完成
    const results = await Promise.all(searchPromises);

    // 合併所有結果
    results.forEach(datasetResults => {
      allResults.push(...datasetResults);
    });

    // 按相關度排序
    allResults.sort((a, b) => b.score - a.score);

    // 限制返回數量
    const limitedResults = allResults.slice(0, limit);

    res.status(200).json({
      success: true,
      results: limitedResults,
      total: limitedResults.length,
      totalFound: allResults.length,
      keyword: keyword.trim(),
      datasets: datasets,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Big table search API error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
