import mammoth from 'mammoth';
import * as cheerio from 'cheerio';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return '';
  }
}

export async function scrapeWebsite(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $('script, style, nav, header, footer').remove();
    
    const text = $('body').text();
    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Web scraping error:', error);
    return '';
  }
}

export function extractTextFromTXT(buffer: Buffer): string {
  return buffer.toString('utf-8');
}
