/**
 * HTML 檔案解析器
 * 使用 cheerio 解析 HTML 並轉換成 Markdown
 */

import { NormalizedDocument, FileType } from '../types';

export async function parseHtml(
  buffer: Buffer,
  fileName: string
): Promise<NormalizedDocument> {
  const cheerio = require('cheerio');
  const { NodeHtmlMarkdown } = require('node-html-markdown');

  const html = buffer.toString('utf-8');

  try {
    // 使用 cheerio 解析 HTML
    const $ = cheerio.load(html);

    // 提取標題
    let title = $('title').text().trim() ||
                $('h1').first().text().trim() ||
                fileName.replace(/\.[^/.]+$/, '');

    // 移除 script 和 style 標籤
    $('script, style, nav, footer, header').remove();

    // 取得主要內容
    let mainContent = $('main, article, .content, #content, body').first().html() || $('body').html() || html;

    // 轉換 HTML 到 Markdown
    const markdown = NodeHtmlMarkdown.translate(mainContent, {
      keepDataImages: false,
      useLinkReferenceDefinitions: false,
      useInlineLinks: true
    });

    const cleanedMarkdown = markdown
      .replace(/\n{3,}/g, '\n\n')  // 移除多餘空行
      .trim();

    return {
      title,
      content: cleanedMarkdown,
      metadata: {
        fileType: FileType.HTML,
        fileName,
        fileSize: buffer.length,
        processedAt: new Date().toISOString(),
        encoding: 'utf-8'
      }
    };
  } catch (error) {
    console.error('HTML parsing error:', error);
    // Fallback: 移除 HTML 標籤
    const plainText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      title: fileName.replace(/\.[^/.]+$/, ''),
      content: plainText,
      metadata: {
        fileType: FileType.HTML,
        fileName,
        fileSize: buffer.length,
        processedAt: new Date().toISOString(),
        encoding: 'utf-8'
      }
    };
  }
}
