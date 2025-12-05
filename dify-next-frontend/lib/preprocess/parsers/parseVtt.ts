/**
 * WebVTT (Video Text Tracks) 檔案解析器
 */

import { NormalizedDocument, FileType, DocumentSection } from '../types';

export async function parseVtt(
  buffer: Buffer,
  fileName: string
): Promise<NormalizedDocument> {
  const content = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const lines = content.split('\n');
  const sections: DocumentSection[] = [];

  let currentCue: { timestamp?: string; text: string[] } = { text: [] };
  let inCue = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳過 WEBVTT 標頭和空行
    if (trimmed.startsWith('WEBVTT') || trimmed.startsWith('NOTE') || trimmed === '') {
      if (inCue && currentCue.text.length > 0) {
        // 儲存當前 cue
        sections.push({
          heading: currentCue.timestamp,
          content: currentCue.text.join('\n'),
          metadata: { timestamp: currentCue.timestamp }
        });
        currentCue = { text: [] };
        inCue = false;
      }
      continue;
    }

    // 檢查時間戳
    if (trimmed.includes('-->')) {
      if (inCue && currentCue.text.length > 0) {
        sections.push({
          heading: currentCue.timestamp,
          content: currentCue.text.join('\n'),
          metadata: { timestamp: currentCue.timestamp }
        });
      }
      currentCue = { timestamp: trimmed, text: [] };
      inCue = true;
    } else if (inCue) {
      // 累積字幕文字
      currentCue.text.push(trimmed);
    }
  }

  // 儲存最後一個 cue
  if (currentCue.text.length > 0) {
    sections.push({
      heading: currentCue.timestamp,
      content: currentCue.text.join('\n'),
      metadata: { timestamp: currentCue.timestamp }
    });
  }

  // 組合成 Markdown
  const markdownContent = sections
    .map(s => `**${s.heading}**\n\n${s.content}`)
    .join('\n\n');

  const title = fileName.replace(/\.[^/.]+$/, '');

  return {
    title,
    content: markdownContent,
    metadata: {
      fileType: FileType.VTT,
      fileName,
      fileSize: buffer.length,
      processedAt: new Date().toISOString(),
      encoding: 'utf-8'
    },
    sections
  };
}
