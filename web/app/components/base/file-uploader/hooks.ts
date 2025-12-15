import type { ClipboardEvent } from 'react'
import {
  useCallback,
  useState,
} from 'react'
import { useParams } from 'next/navigation'
import produce from 'immer'
import { v4 as uuid4 } from 'uuid'
import { useTranslation } from 'react-i18next'
import type { FileEntity } from './types'
import { useFileStore } from './store'
import {
  fileUpload,
  getSupportFileType,
  isAllowedFileExtension,
} from './utils'
import {
  AUDIO_SIZE_LIMIT,
  FILE_SIZE_LIMIT,
  IMG_SIZE_LIMIT,
  MAX_FILE_UPLOAD_LIMIT,
  VIDEO_SIZE_LIMIT,
} from '@/app/components/base/file-uploader/constants'
import { useToastContext } from '@/app/components/base/toast'
import { TransferMethod } from '@/types/app'
import { SupportUploadFileTypes } from '@/app/components/workflow/types'
import type { FileUpload } from '@/app/components/base/features/types'
import { formatFileSize } from '@/utils/format'
import { uploadRemoteFileInfo } from '@/service/common'
import type { FileUploadConfigResponse } from '@/models/common'
import { noop } from 'lodash-es'

// XLSX -> Markdown (by row) preprocessor for Dify segments (dynamic import to keep bundle lean)
async function preprocessXlsxFileToMarkdown(file: File, fileName: string) {
  const SEG = '<!--DIFY_SEGMENT-->'
  const MAX_SEG_LEN = 2000
  const flushChunks = (blocks: string[]) => {
    const segments: string[] = []
    let current = ''
    for (const b of blocks) {
      if ((current.length + b.length + 2) > MAX_SEG_LEN) {
        if (current) segments.push(current)
        current = b
      } else {
        current = current ? `${current}\n\n${b}` : b
      }
    }
    if (current) segments.push(current)
    return segments
  }
  try {
    const [XLSX, buffer] = await Promise.all([
      import('xlsx'),
      file.arrayBuffer(),
    ])
    // @ts-ignore - xlsx is CJS/UMD-like, use namespace
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetNames = workbook.SheetNames || []
    if (!sheetNames.length) {
      console.log('[Preprocessor][XLSX] No sheet found.')
      const base = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName
      return { success: true as const, name: `${base}.md`, mime: 'text/markdown', content: '' }
    }
    const allSegments: string[] = []
    for (const sheetName of sheetNames) {
      // @ts-ignore
      const sheet = workbook.Sheets[sheetName]
      // @ts-ignore
      const rows: any[][] = (XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[]) || []
      console.log('[Preprocessor][XLSX] Parsed sheet:', { sheetName, rowCount: rows.length })
      if (rows.length === 0) continue
      const header = rows[0] as string[]
      const dataRows = rows.slice(1)
      const blocks: string[] = []
      blocks.push(`# Sheet: ${sheetName}`)
      for (let idx = 0; idx < dataRows.length; idx++) {
        const cols = dataRows[idx]
        const fields = header.map((h: string, i: number) => `**${String(h)}:** ${cols[i] ?? ''}`).join('  \n')
        blocks.push(`## Row ${idx + 1}\n\n${fields}`)
      }
      const segments = flushChunks(blocks)
      allSegments.push(...segments)
    }
    const markdown = allSegments.join(`\n\n${SEG}\n\n`)

    const base = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName
    const newName = `${base}.md`
    return { success: true as const, name: newName, mime: 'text/markdown', content: markdown }
  } catch (e) {
    console.error('[Preprocessor][XLSX] Failed to preprocess Excel:', e)
    const base = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName
    return { success: true as const, name: `${base}.md`, mime: 'text/markdown', content: '' }
  }
}

// Lightweight CSV -> Markdown preprocessor for Dify segments
function preprocessCsvToMarkdown(csvText: string, fileName: string) {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.length > 0)
  if (lines.length === 0) {
    return { success: true, name: fileName, mime: 'text/markdown', content: '' }
  }

  // Parse headers (simple CSV – commas, basic quotes)
  const parseLine = (line: string) => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { // escaped quote
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current)
    return result.map(s => s.trim())
  }

  const header = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)

  const SEG = '<!--DIFY_SEGMENT-->'
  const mdBlocks = rows.map((cols, idx) => {
    const fields = header.map((h, i) => `**${h}:** ${cols[i] ?? ''}`).join('  \n')
    return `## Row ${idx + 1}\n\n${fields}`
  })
  const markdown = mdBlocks.join(`\n\n${SEG}\n\n`)

  // New file name with .md extension
  const base = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName
  const newName = `${base}.md`
  return { success: true, name: newName, mime: 'text/markdown', content: markdown }
}

export const useFileSizeLimit = (fileUploadConfig?: FileUploadConfigResponse) => {
  const imgSizeLimit = Number(fileUploadConfig?.image_file_size_limit) * 1024 * 1024 || IMG_SIZE_LIMIT
  const docSizeLimit = Number(fileUploadConfig?.file_size_limit) * 1024 * 1024 || FILE_SIZE_LIMIT
  const audioSizeLimit = Number(fileUploadConfig?.audio_file_size_limit) * 1024 * 1024 || AUDIO_SIZE_LIMIT
  const videoSizeLimit = Number(fileUploadConfig?.video_file_size_limit) * 1024 * 1024 || VIDEO_SIZE_LIMIT
  const maxFileUploadLimit = Number(fileUploadConfig?.workflow_file_upload_limit) || MAX_FILE_UPLOAD_LIMIT

  return {
    imgSizeLimit,
    docSizeLimit,
    audioSizeLimit,
    videoSizeLimit,
    maxFileUploadLimit,
  }
}

export const useFile = (fileConfig: FileUpload) => {
  const { t } = useTranslation()
  const { notify } = useToastContext()
  const fileStore = useFileStore()
  const params = useParams()
  const { imgSizeLimit, docSizeLimit, audioSizeLimit, videoSizeLimit } = useFileSizeLimit(fileConfig.fileUploadConfig)

  const checkSizeLimit = useCallback((fileType: string, fileSize: number) => {
    switch (fileType) {
      case SupportUploadFileTypes.image: {
        if (fileSize > imgSizeLimit) {
          notify({
            type: 'error',
            message: t('common.fileUploader.uploadFromComputerLimit', {
              type: SupportUploadFileTypes.image,
              size: formatFileSize(imgSizeLimit),
            }),
          })
          return false
        }
        return true
      }
      case SupportUploadFileTypes.custom:
      case SupportUploadFileTypes.document: {
        if (fileSize > docSizeLimit) {
          notify({
            type: 'error',
            message: t('common.fileUploader.uploadFromComputerLimit', {
              type: SupportUploadFileTypes.document,
              size: formatFileSize(docSizeLimit),
            }),
          })
          return false
        }
        return true
      }
      case SupportUploadFileTypes.audio: {
        if (fileSize > audioSizeLimit) {
          notify({
            type: 'error',
            message: t('common.fileUploader.uploadFromComputerLimit', {
              type: SupportUploadFileTypes.audio,
              size: formatFileSize(audioSizeLimit),
            }),
          })
          return false
        }
        return true
      }
      case SupportUploadFileTypes.video: {
        if (fileSize > videoSizeLimit) {
          notify({
            type: 'error',
            message: t('common.fileUploader.uploadFromComputerLimit', {
              type: SupportUploadFileTypes.video,
              size: formatFileSize(videoSizeLimit),
            }),
          })
          return false
        }
        return true
      }
      default: {
        return true
      }
    }
  }, [audioSizeLimit, docSizeLimit, imgSizeLimit, notify, t, videoSizeLimit])

  const handleAddFile = useCallback((newFile: FileEntity) => {
    const {
      files,
      setFiles,
    } = fileStore.getState()

    const newFiles = produce(files, (draft) => {
      draft.push(newFile)
    })
    setFiles(newFiles)
  }, [fileStore])

  const handleUpdateFile = useCallback((newFile: FileEntity) => {
    const {
      files,
      setFiles,
    } = fileStore.getState()

    const newFiles = produce(files, (draft) => {
      const index = draft.findIndex(file => file.id === newFile.id)

      if (index > -1)
        draft[index] = newFile
    })
    setFiles(newFiles)
  }, [fileStore])

  const handleRemoveFile = useCallback((fileId: string) => {
    const {
      files,
      setFiles,
    } = fileStore.getState()

    const newFiles = files.filter(file => file.id !== fileId)
    setFiles(newFiles)
  }, [fileStore])

  const handleReUploadFile = useCallback((fileId: string) => {
    const {
      files,
      setFiles,
    } = fileStore.getState()
    const index = files.findIndex(file => file.id === fileId)

    if (index > -1) {
      const uploadingFile = files[index]
      const newFiles = produce(files, (draft) => {
        draft[index].progress = 0
      })
      setFiles(newFiles)
      fileUpload({
        file: uploadingFile.originalFile!,
        onProgressCallback: (progress) => {
          handleUpdateFile({ ...uploadingFile, progress })
        },
        onSuccessCallback: (res) => {
          handleUpdateFile({ ...uploadingFile, uploadedId: res.id, progress: 100 })
        },
        onErrorCallback: () => {
          notify({ type: 'error', message: t('common.fileUploader.uploadFromComputerUploadError') })
          handleUpdateFile({ ...uploadingFile, progress: -1 })
        },
      }, !!params.token)
    }
  }, [fileStore, notify, t, handleUpdateFile, params])

  const startProgressTimer = useCallback((fileId: string) => {
    const timer = setInterval(() => {
      const files = fileStore.getState().files
      const file = files.find(file => file.id === fileId)

      if (file && file.progress < 80 && file.progress >= 0)
        handleUpdateFile({ ...file, progress: file.progress + 20 })
      else
        clearTimeout(timer)
    }, 200)
  }, [fileStore, handleUpdateFile])
  const handleLoadFileFromLink = useCallback((url: string) => {
    const allowedFileTypes = fileConfig.allowed_file_types

    const uploadingFile = {
      id: uuid4(),
      name: url,
      type: '',
      size: 0,
      progress: 0,
      transferMethod: TransferMethod.remote_url,
      supportFileType: '',
      url,
      isRemote: true,
    }
    handleAddFile(uploadingFile)
    startProgressTimer(uploadingFile.id)

    uploadRemoteFileInfo(url, !!params.token).then((res) => {
      const newFile = {
        ...uploadingFile,
        type: res.mime_type,
        size: res.size,
        progress: 100,
        supportFileType: getSupportFileType(res.name, res.mime_type, allowedFileTypes?.includes(SupportUploadFileTypes.custom)),
        uploadedId: res.id,
        url: res.url,
      }
      if (!isAllowedFileExtension(res.name, res.mime_type, fileConfig.allowed_file_types || [], fileConfig.allowed_file_extensions || [])) {
        notify({ type: 'error', message: `${t('common.fileUploader.fileExtensionNotSupport')} ${newFile.type}` })
        handleRemoveFile(uploadingFile.id)
      }
      if (!checkSizeLimit(newFile.supportFileType, newFile.size))
        handleRemoveFile(uploadingFile.id)
      else
        handleUpdateFile(newFile)
    }).catch(() => {
      notify({ type: 'error', message: t('common.fileUploader.pasteFileLinkInvalid') })
      handleRemoveFile(uploadingFile.id)
    })
  }, [checkSizeLimit, handleAddFile, handleUpdateFile, notify, t, handleRemoveFile, fileConfig?.allowed_file_types, fileConfig.allowed_file_extensions, startProgressTimer, params.token])

  const handleLoadFileFromLinkSuccess = useCallback(noop, [])

  const handleLoadFileFromLinkError = useCallback(noop, [])

  const handleClearFiles = useCallback(() => {
    const {
      setFiles,
    } = fileStore.getState()
    setFiles([])
  }, [fileStore])

  const handleLocalFileUpload = useCallback((file: File) => {
    if (!isAllowedFileExtension(file.name, file.type, fileConfig.allowed_file_types || [], fileConfig.allowed_file_extensions || [])) {
      notify({ type: 'error', message: `${t('common.fileUploader.fileExtensionNotSupport')} ${file.type}` })
      return
    }
    const allowedFileTypes = fileConfig.allowed_file_types
    const fileType = getSupportFileType(file.name, file.type, allowedFileTypes?.includes(SupportUploadFileTypes.custom))
    if (!checkSizeLimit(fileType, file.size))
      return

    const reader = new FileReader()
    const isImage = file.type.startsWith('image')

    reader.addEventListener(
      'load',
      async () => {
        const uploadingFile = {
          id: uuid4(),
          name: file.name,
          type: file.type,
          size: file.size,
          progress: 0,
          transferMethod: TransferMethod.local_file,
          supportFileType: getSupportFileType(file.name, file.type, allowedFileTypes?.includes(SupportUploadFileTypes.custom)),
          originalFile: file,
          base64Url: isImage ? reader.result as string : '',
        }
        handleAddFile(uploadingFile)
        try {
          const lowerName = file.name.toLowerCase()
          const isCsv = lowerName.endsWith('.csv') || file.type === 'text/csv'
          const isXlsx = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel'

          let fileToUpload: File = uploadingFile.originalFile!

          if (isCsv) {
            console.log('[Preprocessor] CSV detected, starting preprocessing...', { name: file.name, type: file.type })
            // Read original text for CSV
            const text = await (async () => {
              // Prefer reading as text directly for CSV
              return await (new Response(uploadingFile.originalFile!).text())
            })()
            const pre = preprocessCsvToMarkdown(text, file.name)
            console.log('[Preprocessor] CSV preprocessing done.', { newName: pre.name, mime: pre.mime, length: pre.content.length })
            const blob = new Blob([pre.content], { type: pre.mime })
            fileToUpload = new File([blob], pre.name, { type: pre.mime })
            // reflect new file info in UI
            uploadingFile.name = pre.name
            uploadingFile.type = pre.mime
            uploadingFile.size = fileToUpload.size
            handleUpdateFile({ ...uploadingFile })
          } else if (isXlsx) {
            console.log('[Preprocessor] XLSX detected, starting preprocessing...', { name: file.name, type: file.type })
            const pre = await preprocessXlsxFileToMarkdown(uploadingFile.originalFile!, file.name)
            console.log('[Preprocessor] XLSX preprocessing done.', { newName: pre.name, mime: pre.mime, length: pre.content.length })
            const blob = new Blob([pre.content], { type: pre.mime })
            fileToUpload = new File([blob], pre.name, { type: pre.mime })
            // reflect new file info in UI
            uploadingFile.name = pre.name
            uploadingFile.type = pre.mime
            uploadingFile.size = fileToUpload.size
            handleUpdateFile({ ...uploadingFile })
          } else {
            console.log('[Preprocessor] No preprocessing applied.', { name: file.name, type: file.type })
          }

          fileUpload({
            file: fileToUpload,
            onProgressCallback: (progress) => {
              handleUpdateFile({ ...uploadingFile, progress })
            },
            onSuccessCallback: (res) => {
              handleUpdateFile({ ...uploadingFile, uploadedId: res.id, progress: 100 })
            },
            onErrorCallback: () => {
              notify({ type: 'error', message: t('common.fileUploader.uploadFromComputerUploadError') })
              handleUpdateFile({ ...uploadingFile, progress: -1 })
            },
          }, !!params.token)
        } catch (err) {
          console.error('[Preprocessor] Unexpected error during preprocessing/upload:', err)
          notify({ type: 'error', message: 'Preprocessing error. Please check console logs.' })
          handleUpdateFile({ ...uploadingFile, progress: -1 })
        }
      },
      false,
    )
    reader.addEventListener(
      'error',
      () => {
        notify({ type: 'error', message: t('common.fileUploader.uploadFromComputerReadError') })
      },
      false,
    )
    reader.readAsDataURL(file)
  }, [checkSizeLimit, notify, t, handleAddFile, handleUpdateFile, params.token, fileConfig?.allowed_file_types, fileConfig?.allowed_file_extensions])

  const handleClipboardPasteFile = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = e.clipboardData?.files[0]
    const text = e.clipboardData?.getData('text/plain')
    if (file && !text) {
      e.preventDefault()
      handleLocalFileUpload(file)
    }
  }, [handleLocalFileUpload])

  const [isDragActive, setIsDragActive] = useState(false)
  const handleDragFileEnter = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragFileOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragFileLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDropFile = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const file = e.dataTransfer.files[0]

    if (file)
      handleLocalFileUpload(file)
  }, [handleLocalFileUpload])

  return {
    handleAddFile,
    handleUpdateFile,
    handleRemoveFile,
    handleReUploadFile,
    handleLoadFileFromLink,
    handleLoadFileFromLinkSuccess,
    handleLoadFileFromLinkError,
    handleClearFiles,
    handleLocalFileUpload,
    handleClipboardPasteFile,
    isDragActive,
    handleDragFileEnter,
    handleDragFileOver,
    handleDragFileLeave,
    handleDropFile,
  }
}
