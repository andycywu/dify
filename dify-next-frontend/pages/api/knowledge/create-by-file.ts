import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { Blob } from 'buffer' // Node 20 global Blob might work, but explicit import is safer if needed, or just use global
// Node 20 has global FormData and Blob.

export const config = {
  api: {
    bodyParser: false,
  },
}

// Minimal process typing
declare const process: any

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const form = formidable({})
  let fields: formidable.Fields
  let files: formidable.Files

  try {
    [fields, files] = await form.parse(req)
  } catch (err) {
    console.error('Form parse error:', err)
    res.status(400).json({ error: 'Failed to parse form data' })
    return
  }

  const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file
  const dataField = Array.isArray(fields.data) ? fields.data[0] : fields.data

  if (!uploadedFile) {
    res.status(400).json({ error: 'Missing file' })
    return
  }

  // Parse datasetId from fields or URL?
  // The frontend sends it in the URL usually, but here we are proxying.
  // We should probably pass datasetId in the form data or query param.
  // Let's check how I'll call it. I'll pass it in query or body.
  // Since it's multipart, adding a field is easy.
  // But wait, the frontend `createDocumentFromFile` takes `datasetId` as arg.
  // I should append it to FormData in the frontend.

  // Let's assume frontend appends 'datasetId' to formData.
  const datasetId = Array.isArray(fields.datasetId) ? fields.datasetId[0] : fields.datasetId

  if (!datasetId) {
     res.status(400).json({ error: 'Missing datasetId' })
     return
  }

  const baseRaw = process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || process.env.DIFY_API_URL || 'http://api:5001/v1'
  const base = String(baseRaw).replace(/\/$/, '')
  const adminKey = process.env.DIFY_ADMIN_API_KEY || process.env.NEXT_PUBLIC_DIFY_ADMIN_API_KEY || process.env.NEXT_PUBLIC_DIFY_DATASET_KEY

  if (!adminKey) {
    res.status(500).json({ error: 'Missing Dify API key in environment' })
    return
  }

  // Construct upstream FormData
  const upstreamFormData = new FormData()

  // Read file
  const fileBuffer = fs.readFileSync(uploadedFile.filepath)
  const fileBlob = new Blob([fileBuffer], { type: uploadedFile.mimetype || 'application/octet-stream' })
  upstreamFormData.append('file', fileBlob, uploadedFile.originalFilename || 'upload.txt')

  // Handle 'data' field (JSON config)
  // Ensure process_rule is set correctly if missing
  let configData: any = {}
  try {
    configData = dataField ? JSON.parse(dataField) : {}
  } catch (e) {
    // ignore
  }

  // Force automatic mode if not present or if causing issues
  if (!configData.process_rule) {
    configData.process_rule = { mode: 'automatic' }
  } else if (configData.process_rule.mode === 'custom' && !configData.process_rule.rules) {
      // Fix the specific error user saw: "Process rule rules is required"
      // If custom mode but no rules, switch to automatic or provide default rules?
      // Safer to switch to automatic.
      configData.process_rule.mode = 'automatic'
  }

  upstreamFormData.append('data', JSON.stringify(configData))

  const candidates = [
    `/datasets/${datasetId}/document/create_by_file`, // official
    `/datasets/${datasetId}/documents/create_by_file`,
    `/datasets/${datasetId}/document/create-by-file`,
    `/datasets/${datasetId}/documents/create-by-file`,
  ]

  let lastStatus = 500
  let lastData: any = { error: 'Unknown error' }

  for (const ep of candidates) {
    try {
      const resp = await fetch(base + ep, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminKey}`,
          // fetch with FormData automatically sets Content-Type to multipart/form-data with boundary
        },
        body: upstreamFormData,
      })

      const text = await resp.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = text }

      if (!resp.ok) {
        lastStatus = resp.status
        lastData = data
        console.log(`Failed ${ep}: ${resp.status}`, data)

        if (resp.status === 401 || resp.status === 403) break
        if ([404, 405, 500].includes(resp.status)) continue
        break
      }

      res.status(200).json(data)
      return
    } catch (e: any) {
      lastStatus = 500
      lastData = { error: String(e?.message || e) }
      console.error(`Error calling ${ep}:`, e)
    }
  }

  res.status(lastStatus).json({ error: 'Failed to create by file', detail: lastData })
}
