import puppeteer from 'puppeteer';
import type { MetricData, TimeSeriesData, RiskItem } from './chartGenerator';
import {
  generateBarChart,
  generateLineChart,
  generateRiskMatrix,
  generateDonutChart
} from './chartGenerator';

type Recommendation = "proceed" | "caution" | "do-not-proceed";

export interface ReportMetrics {
  financial?: {
    revenue?: MetricData[];
    profitability?: MetricData[];
    trend?: TimeSeriesData;
  };
  market?: {
    position?: MetricData[];
    growth?: MetricData[];
  };
  commercial?: {
    metrics?: MetricData[];
  };
  technology?: {
    scores?: MetricData[];
  };
  operations?: {
    scores?: MetricData[];
  };
  risks?: RiskItem[];
  scoreBreakdown?: { label: string; value: number; color: string }[];
}

export interface EvaluationPDFData {
  companyName: string;
  companyUrl?: string;
  recommendation: Recommendation;
  executiveSummary: string;
  sections: {
    id: string;
    title: string;
    content: string;
    subsections?: { title: string; content: string }[];
  }[];
  agentReports?: Record<string, string>;
  metrics?: ReportMetrics;
  createdAt?: Date;
}

async function generateChartImages(metrics?: ReportMetrics): Promise<Record<string, string>> {
  const charts: Record<string, string> = {};

  if (!metrics) return charts;

  try {
    if (metrics.financial?.revenue && metrics.financial.revenue.length > 0) {
      const buffer = await generateBarChart('Financial Performance', metrics.financial.revenue, '#0066CC');
      charts.financialRevenue = `data:image/png;base64,${buffer.toString('base64')}`;
    }

    if (metrics.financial?.trend) {
      const buffer = await generateLineChart('Revenue Trend', metrics.financial.trend);
      charts.financialTrend = `data:image/png;base64,${buffer.toString('base64')}`;
    }

    if (metrics.market?.position && metrics.market.position.length > 0) {
      const buffer = await generateBarChart('Market Position', metrics.market.position, '#10B981');
      charts.marketPosition = `data:image/png;base64,${buffer.toString('base64')}`;
    }

    if (metrics.commercial?.metrics && metrics.commercial.metrics.length > 0) {
      const buffer = await generateBarChart('Commercial Metrics', metrics.commercial.metrics, '#F59E0B');
      charts.commercialMetrics = `data:image/png;base64,${buffer.toString('base64')}`;
    }

    if (metrics.risks && metrics.risks.length > 0) {
      const buffer = await generateRiskMatrix(metrics.risks);
      charts.riskMatrix = `data:image/png;base64,${buffer.toString('base64')}`;
    }

    if (metrics.scoreBreakdown && metrics.scoreBreakdown.length > 0) {
      const buffer = await generateDonutChart('Evaluation Score Breakdown', metrics.scoreBreakdown);
      charts.scoreBreakdown = `data:image/png;base64,${buffer.toString('base64')}`;
    }
  } catch (error) {
    console.error('Error generating chart images:', error);
  }

  return charts;
}

function generateHTMLReport(data: EvaluationPDFData, charts: Record<string, string>): string {
  const recommendationBadge = {
    'proceed': { text: 'PROCEED', color: '#10B981', bgColor: '#D1FAE5', icon: '✓' },
    'caution': { text: 'PROCEED WITH CAUTION', color: '#F59E0B', bgColor: '#FEF3C7', icon: '⚠' },
    'do-not-proceed': { text: 'DO NOT PROCEED', color: '#DC2626', bgColor: '#FEE2E2', icon: '✕' }
  }[data.recommendation];

  const agentNames: Record<string, string> = {
    'financial': 'Financial Analyst',
    'market': 'Market & Business Strategist',
    'commercial': 'Commercial Operations',
    'technology': 'Technology & Product',
    'operations': 'HR & Operations'
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>M&A Evaluation Report - ${data.companyName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: letter;
      margin: 0.75in 0.75in 1in 0.75in;
      @bottom-center {
        content: counter(page) " / " counter(pages);
        font-size: 9pt;
        color: #999;
      }
      @bottom-left {
        content: "Contech Advisor - AI-Powered M&A Evaluation";
        font-size: 8pt;
        color: #AAA;
      }
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #1a1a1a;
    }
    
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
    }
    
    .cover-page h1 {
      font-size: 32pt;
      color: #0066CC;
      margin-bottom: 0.5em;
    }
    
    .cover-page .company-name {
      font-size: 28pt;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 0.3em;
    }
    
    .cover-page .company-url {
      font-size: 12pt;
      color: #666;
      margin-bottom: 2em;
    }
    
    .cover-page .date {
      font-size: 11pt;
      color: #888;
    }
    
    .recommendation-badge {
      display: inline-block;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 18pt;
      font-weight: bold;
      margin: 2em 0;
      background-color: ${recommendationBadge.bgColor};
      color: ${recommendationBadge.color};
      border: 2px solid ${recommendationBadge.color};
    }
    
    h2 {
      font-size: 16pt;
      color: #0066CC;
      margin-top: 1.5em;
      margin-bottom: 0.75em;
      padding-bottom: 0.3em;
      border-bottom: 2px solid #0066CC;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 13pt;
      color: #333;
      margin-top: 1em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
    }
    
    h4 {
      font-size: 11pt;
      color: #555;
      margin-top: 0.75em;
      margin-bottom: 0.4em;
      page-break-after: avoid;
    }
    
    p {
      margin-bottom: 0.75em;
      text-align: justify;
    }
    
    .executive-summary {
      background: #F8FAFC;
      padding: 1.5em;
      border-left: 4px solid #0066CC;
      margin: 1em 0;
      page-break-inside: avoid;
    }
    
    .section-content {
      margin-bottom: 1em;
    }
    
    .chart-container {
      margin: 1.5em 0;
      text-align: center;
      page-break-inside: avoid;
    }
    
    .chart-container img {
      max-width: 100%;
      height: auto;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 1em;
      background: white;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1em;
      margin: 1em 0;
    }
    
    .metric-card {
      background: #F8FAFC;
      padding: 1em;
      border-radius: 6px;
      border: 1px solid #E5E7EB;
    }
    
    .metric-card .metric-label {
      font-size: 9pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.3em;
    }
    
    .metric-card .metric-value {
      font-size: 20pt;
      font-weight: bold;
      color: #0066CC;
    }
    
    .agent-report {
      margin: 1.5em 0;
      padding: 1em;
      background: #FAFBFC;
      border-radius: 6px;
      page-break-inside: avoid;
    }
    
    .agent-report h4 {
      color: #0066CC;
      margin-top: 0;
    }
    
    .agent-report-content {
      font-size: 9.5pt;
      line-height: 1.5;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    .two-column {
      column-count: 2;
      column-gap: 2em;
      column-rule: 1px solid #E5E7EB;
    }
    
    .avoid-break {
      page-break-inside: avoid;
    }
    
    ul, ol {
      margin-left: 1.5em;
      margin-bottom: 0.75em;
    }
    
    li {
      margin-bottom: 0.3em;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <h1>M&A Evaluation Report</h1>
    <div class="company-name">${data.companyName}</div>
    ${data.companyUrl ? `<div class="company-url">${data.companyUrl}</div>` : ''}
    <div class="recommendation-badge">
      ${recommendationBadge.icon} ${recommendationBadge.text}
    </div>
    <div class="date">Generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}</div>
  </div>
  
  <div class="page-break"></div>
  
  <h2>Executive Summary</h2>
  <div class="executive-summary">
    <p>${data.executiveSummary}</p>
  </div>
  
  ${charts.scoreBreakdown ? `
    <div class="chart-container">
      <img src="${charts.scoreBreakdown}" alt="Evaluation Score Breakdown" />
    </div>
  ` : ''}
  
  <div class="page-break"></div>
  
  <h2>Key Performance Indicators</h2>
  
  ${charts.financialRevenue ? `
    <div class="chart-container">
      <img src="${charts.financialRevenue}" alt="Financial Performance" />
    </div>
  ` : ''}
  
  ${charts.financialTrend ? `
    <div class="chart-container">
      <img src="${charts.financialTrend}" alt="Revenue Trend" />
    </div>
  ` : ''}
  
  ${charts.marketPosition ? `
    <div class="chart-container">
      <img src="${charts.marketPosition}" alt="Market Position" />
    </div>
  ` : ''}
  
  ${charts.commercialMetrics ? `
    <div class="chart-container">
      <img src="${charts.commercialMetrics}" alt="Commercial Metrics" />
    </div>
  ` : ''}
  
  ${charts.riskMatrix ? `
    <div class="page-break"></div>
    <h2>Risk Assessment</h2>
    <div class="chart-container">
      <img src="${charts.riskMatrix}" alt="Risk Matrix" />
    </div>
  ` : ''}
  
  <div class="page-break"></div>
  
  <h2>Detailed Analysis</h2>
  
  ${data.sections.map(section => `
    <div class="section-content avoid-break">
      <h3>${section.title}</h3>
      <p>${section.content}</p>
      
      ${section.subsections ? section.subsections.map(sub => `
        <h4>${sub.title}</h4>
        <p>${sub.content}</p>
      `).join('') : ''}
    </div>
  `).join('')}
  
  ${data.agentReports && Object.keys(data.agentReports).length > 0 ? `
    <div class="page-break"></div>
    <h2>Specialist Agent Reports</h2>
    
    ${Object.entries(data.agentReports).map(([agentType, report]) => `
      <div class="agent-report">
        <h4>${agentNames[agentType] || agentType}</h4>
        <div class="agent-report-content">
          <p>${report.substring(0, 3000)}${report.length > 3000 ? '...' : ''}</p>
        </div>
      </div>
    `).join('')}
  ` : ''}
</body>
</html>`;
}

export async function generateEvaluationPDF(data: EvaluationPDFData): Promise<Buffer> {
  let browser;
  
  try {
    const charts = await generateChartImages(data.metrics);
    const html = generateHTMLReport(data, charts);
    
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 9px; text-align: center; width: 100%; color: #999; padding: 10px;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
          <br/>
          <span style="font-size: 8px; color: #AAA;">Contech Advisor - AI-Powered M&A Evaluation</span>
        </div>
      `,
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '1in',
        left: '0.75in'
      }
    });
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF with Puppeteer:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
