import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

type ReportSection = {
  id: string;
  title: string;
  content: string;
  subsections?: { title: string; content: string }[];
};

type Recommendation = "proceed" | "caution" | "do-not-proceed";

export interface EvaluationPDFData {
  companyName: string;
  companyUrl?: string;
  recommendation: Recommendation;
  executiveSummary: string;
  sections: ReportSection[];
  agentReports?: Record<string, string>;
  createdAt?: Date;
}

export async function generateEvaluationPDF(data: EvaluationPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'LETTER',
      margins: { top: 50, bottom: 70, left: 50, right: 50 }
    });
    
    const chunks: Buffer[] = [];
    let currentPage = 1;
    let isAddingFooter = false;
    
    const addFooter = () => {
      if (isAddingFooter) return;
      isAddingFooter = true;
      
      const savedY = doc.y;
      const bottom = doc.page.height - 50;
      
      doc.fontSize(8).fillColor('#999999').text(
        `Page ${currentPage}`,
        50,
        bottom,
        { align: 'center', width: doc.page.width - 100 }
      );
      doc.fontSize(7).fillColor('#AAAAAA').text(
        'Contech Advisor - AI-Powered M&A Evaluation',
        50,
        bottom + 12,
        { align: 'center', width: doc.page.width - 100 }
      );
      
      doc.y = savedY;
      isAddingFooter = false;
    };
    
    doc.on('pageAdded', () => {
      currentPage++;
      addFooter();
    });
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const primaryColor = '#0066CC';
    const cautionColor = '#F59E0B';
    const dangerColor = '#DC2626';
    const successColor = '#10B981';

    doc.fontSize(24).fillColor('#1a1a1a').text('M&A Evaluation Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor(primaryColor).text(data.companyName, { align: 'center' });
    doc.moveDown(0.3);
    
    if (data.companyUrl) {
      doc.fontSize(10).fillColor('#666666').text(data.companyUrl, { align: 'center' });
    }
    
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#888888').text(
      `Generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`,
      { align: 'center' }
    );
    
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#CCCCCC');
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor('#333333').text('RECOMMENDATION', { underline: true });
    doc.moveDown(0.5);
    
    let recommendationText = '';
    let recommendationColor = primaryColor;
    
    switch (data.recommendation) {
      case 'proceed':
        recommendationText = '✓ PROCEED';
        recommendationColor = successColor;
        break;
      case 'caution':
        recommendationText = '⚠ PROCEED WITH CAUTION';
        recommendationColor = cautionColor;
        break;
      case 'do-not-proceed':
        recommendationText = '✕ DO NOT PROCEED';
        recommendationColor = dangerColor;
        break;
    }
    
    doc.font('Helvetica-Bold').fontSize(14).fillColor(recommendationColor).text(recommendationText);
    doc.font('Helvetica');
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor('#333333').text('EXECUTIVE SUMMARY', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#1a1a1a').text(data.executiveSummary, { 
      align: 'justify',
      lineGap: 3
    });
    doc.moveDown(1.5);

    if (data.sections && data.sections.length > 0) {
      doc.addPage();
      
      doc.fontSize(14).fillColor(primaryColor).text('DETAILED ANALYSIS', { underline: true });
      doc.moveDown(1);

      data.sections.forEach((section, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333').text(section.title);
        doc.font('Helvetica');
        doc.moveDown(0.5);
        
        doc.fontSize(10).fillColor('#1a1a1a').text(section.content, { 
          align: 'justify',
          lineGap: 2
        });
        doc.moveDown(0.8);

        if (section.subsections && section.subsections.length > 0) {
          section.subsections.forEach((subsection) => {
            if (doc.y > 700) {
              doc.addPage();
            }

            doc.fontSize(11).fillColor('#555555').text(subsection.title, { indent: 20 });
            doc.moveDown(0.3);
            doc.fontSize(9).fillColor('#666666').text(subsection.content, { 
              indent: 30,
              align: 'justify',
              lineGap: 2
            });
            doc.moveDown(0.5);
          });
        }

        if (index < data.sections.length - 1) {
          doc.moveDown(0.3);
          doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#EEEEEE');
          doc.moveDown(1);
        }
      });
    }

    if (data.agentReports && Object.keys(data.agentReports).length > 0) {
      doc.addPage();
      
      doc.fontSize(14).fillColor(primaryColor).text('SPECIALIST AGENT REPORTS', { underline: true });
      doc.moveDown(1);

      const agentNames: Record<string, string> = {
        'financial': 'Financial Analyst',
        'market': 'Market & Business Strategist',
        'commercial': 'Commercial Operations',
        'technology': 'Technology & Product',
        'operations': 'HR & Operations'
      };

      Object.entries(data.agentReports).forEach(([agentType, report]) => {
        if (doc.y > 650) {
          doc.addPage();
        }

        const agentName = agentNames[agentType] || agentType;
        
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#333333').text(agentName);
        doc.font('Helvetica');
        doc.moveDown(0.5);
        
        const reportText = report.substring(0, 2000);
        doc.fontSize(9).fillColor('#1a1a1a').text(reportText, { 
          align: 'justify',
          lineGap: 2
        });
        doc.moveDown(1);
      });
    }

    addFooter();

    doc.end();
  });
}
