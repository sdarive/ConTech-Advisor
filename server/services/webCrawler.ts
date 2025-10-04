import * as cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';

export interface CrawledData {
  companyInfo: {
    description: string;
    mission: string;
    founded: string;
    headquarters: string;
  };
  financial: {
    pricing: string[];
    revenue: string[];
    funding: string[];
    valuation: string[];
  };
  team: {
    leadership: Array<{
      name: string;
      title: string;
      bio: string;
    }>;
    teamSize: string;
  };
  products: Array<{
    name: string;
    description: string;
    features: string[];
  }>;
  customers: {
    testimonials: Array<{
      author: string;
      company: string;
      quote: string;
    }>;
    caseStudies: string[];
    clientLogos: string[];
  };
  market: {
    industries: string[];
    competitors: string[];
    marketPosition: string;
  };
  media: {
    videos: string[];
    images: string[];
    pressReleases: string[];
  };
  rawContent: Record<string, string>;
}

interface PageToVisit {
  url: string;
  type: string;
}

export async function crawlCompanyWebsite(baseUrl: string, maxPages: number = 10): Promise<CrawledData> {
  let browser: Browser | undefined;
  
  try {
    const normalizedUrl = normalizeUrl(baseUrl);
    const domain = new URL(normalizedUrl).hostname;
    
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

    const crawledData: CrawledData = {
      companyInfo: { description: '', mission: '', founded: '', headquarters: '' },
      financial: { pricing: [], revenue: [], funding: [], valuation: [] },
      team: { leadership: [], teamSize: '' },
      products: [],
      customers: { testimonials: [], caseStudies: [], clientLogos: [] },
      market: { industries: [], competitors: [], marketPosition: '' },
      media: { videos: [], images: [], pressReleases: [] },
      rawContent: {}
    };

    const pagesToVisit = await discoverRelevantPages(normalizedUrl, domain);
    const visitedUrls = new Set<string>();
    
    for (let i = 0; i < Math.min(pagesToVisit.length, maxPages); i++) {
      const { url, type } = pagesToVisit[i];
      
      if (visitedUrls.has(url)) continue;
      visitedUrls.add(url);

      try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        
        const content = await page.content();
        const $ = cheerio.load(content);
        
        $('script, style, nav, header, footer, iframe, noscript').remove();
        const textContent = $('body').text().replace(/\s+/g, ' ').trim();
        crawledData.rawContent[type] = textContent.substring(0, 5000);

        await extractStructuredData($, type, crawledData, page);
        
        await page.close();
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
      }
    }

    return crawledData;
  } catch (error) {
    console.error('Crawling error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  return normalized;
}

async function discoverRelevantPages(baseUrl: string, domain: string): Promise<PageToVisit[]> {
  const pages: PageToVisit[] = [
    { url: baseUrl, type: 'homepage' }
  ];

  const commonPaths = [
    { path: '/about', type: 'about' },
    { path: '/about-us', type: 'about' },
    { path: '/company', type: 'about' },
    { path: '/team', type: 'team' },
    { path: '/leadership', type: 'team' },
    { path: '/our-team', type: 'team' },
    { path: '/products', type: 'products' },
    { path: '/solutions', type: 'products' },
    { path: '/services', type: 'products' },
    { path: '/pricing', type: 'pricing' },
    { path: '/customers', type: 'customers' },
    { path: '/case-studies', type: 'customers' },
    { path: '/testimonials', type: 'customers' },
    { path: '/reviews', type: 'customers' },
    { path: '/newsroom', type: 'media' },
    { path: '/press', type: 'media' },
    { path: '/news', type: 'media' },
    { path: '/investors', type: 'financial' },
    { path: '/investor-relations', type: 'financial' }
  ];

  for (const { path, type } of commonPaths) {
    try {
      const testUrl = new URL(path, baseUrl).href;
      const response = await fetch(testUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        pages.push({ url: testUrl, type });
      }
    } catch {
    }
  }

  return pages;
}

async function extractStructuredData(
  $: cheerio.CheerioAPI,
  pageType: string,
  data: CrawledData,
  page: Page
): Promise<void> {
  switch (pageType) {
    case 'homepage':
    case 'about':
      extractCompanyInfo($, data);
      break;
    
    case 'team':
      extractTeamInfo($, data);
      break;
    
    case 'products':
      extractProductInfo($, data);
      break;
    
    case 'pricing':
      extractPricingInfo($, data);
      break;
    
    case 'customers':
      extractCustomerInfo($, data);
      break;
    
    case 'media':
      extractMediaInfo($, data);
      break;
    
    case 'financial':
      extractFinancialInfo($, data);
      break;
  }

  await extractVideos(page, data);
}

function extractCompanyInfo($: cheerio.CheerioAPI, data: CrawledData): void {
  const metaDescription = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || '';
  
  if (metaDescription && !data.companyInfo.description) {
    data.companyInfo.description = metaDescription;
  }

  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().toLowerCase();
    if (text.includes('mission') || text.includes('vision')) {
      const content = $(el).next('p, div').text().trim();
      if (content && !data.companyInfo.mission) {
        data.companyInfo.mission = content.substring(0, 500);
      }
    }
  });

  $('*').each((_, el) => {
    const text = $(el).text();
    const foundedMatch = text.match(/founded\s+in\s+(\d{4})|established\s+(\d{4})/i);
    if (foundedMatch && !data.companyInfo.founded) {
      data.companyInfo.founded = foundedMatch[1] || foundedMatch[2];
    }

    const hqMatch = text.match(/headquartered\s+in\s+([^.,]+)|headquarters:\s*([^.,]+)/i);
    if (hqMatch && !data.companyInfo.headquarters) {
      data.companyInfo.headquarters = (hqMatch[1] || hqMatch[2]).trim();
    }
  });
}

function extractTeamInfo($: cheerio.CheerioAPI, data: CrawledData): void {
  $('[class*="team"], [class*="leader"], [class*="executive"]').each((_, el) => {
    const name = $(el).find('[class*="name"], h2, h3, h4').first().text().trim();
    const title = $(el).find('[class*="title"], [class*="position"], [class*="role"]').first().text().trim();
    const bio = $(el).find('[class*="bio"], p').first().text().trim();

    if (name && title) {
      data.team.leadership.push({
        name,
        title,
        bio: bio.substring(0, 300)
      });
    }
  });

  $('*').each((_, el) => {
    const text = $(el).text();
    const teamSizeMatch = text.match(/(\d+[\+]?)\s+employees|team\s+of\s+(\d+)/i);
    if (teamSizeMatch && !data.team.teamSize) {
      data.team.teamSize = teamSizeMatch[1] || teamSizeMatch[2];
    }
  });
}

function extractProductInfo($: cheerio.CheerioAPI, data: CrawledData): void {
  $('[class*="product"], [class*="solution"], [class*="service"]').each((_, el) => {
    const name = $(el).find('h2, h3, h4, [class*="title"]').first().text().trim();
    const description = $(el).find('p, [class*="description"]').first().text().trim();
    const features: string[] = [];

    $(el).find('li, [class*="feature"]').each((_, featureEl) => {
      const feature = $(featureEl).text().trim();
      if (feature && feature.length < 200) {
        features.push(feature);
      }
    });

    if (name) {
      data.products.push({
        name,
        description: description.substring(0, 500),
        features: features.slice(0, 5)
      });
    }
  });
}

function extractPricingInfo($: cheerio.CheerioAPI, data: CrawledData): void {
  $('[class*="price"], [class*="pricing"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.match(/\$|€|£|\d+/)) {
      data.financial.pricing.push(text);
    }
  });
}

function extractCustomerInfo($: cheerio.CheerioAPI, data: CrawledData): void {
  $('[class*="testimonial"], [class*="review"], [class*="quote"]').each((_, el) => {
    const quote = $(el).find('p, [class*="text"], [class*="content"]').first().text().trim();
    const author = $(el).find('[class*="author"], [class*="name"]').first().text().trim();
    const company = $(el).find('[class*="company"], [class*="organization"]').first().text().trim();

    if (quote) {
      data.customers.testimonials.push({
        author: author || 'Anonymous',
        company: company || '',
        quote: quote.substring(0, 300)
      });
    }
  });

  $('[class*="case-study"], [class*="success-story"]').each((_, el) => {
    const caseStudy = $(el).text().trim();
    if (caseStudy) {
      data.customers.caseStudies.push(caseStudy.substring(0, 500));
    }
  });

  $('img[alt*="logo"], img[class*="logo"], img[class*="client"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    if (alt) {
      data.customers.clientLogos.push(alt);
    }
  });
}

function extractMediaInfo($: cheerio.CheerioAPI, data: CrawledData): void {
  $('article, [class*="press"], [class*="news"]').each((_, el) => {
    const headline = $(el).find('h2, h3, h4').first().text().trim();
    const content = $(el).find('p').first().text().trim();
    
    if (headline) {
      data.media.pressReleases.push(`${headline}: ${content.substring(0, 200)}`);
    }
  });
}

function extractFinancialInfo($: cheerio.CheerioAPI, data: CrawledData): void {
  $('*').each((_, el) => {
    const text = $(el).text();
    
    const revenueMatch = text.match(/revenue[:\s]+\$?([\d.]+[BMK]?|\d+[\s,]*million|\d+[\s,]*billion)/i);
    if (revenueMatch) {
      data.financial.revenue.push(revenueMatch[0]);
    }

    const fundingMatch = text.match(/raised\s+\$?([\d.]+[BMK]?|\d+[\s,]*million)|funding[:\s]+\$?([\d.]+[BMK]?)/i);
    if (fundingMatch) {
      data.financial.funding.push(fundingMatch[0]);
    }

    const valuationMatch = text.match(/valuation[:\s]+\$?([\d.]+[BMK]?|\d+[\s,]*billion)/i);
    if (valuationMatch) {
      data.financial.valuation.push(valuationMatch[0]);
    }
  });
}

async function extractVideos(page: Page, data: CrawledData): Promise<void> {
  try {
    const videoUrls = await page.evaluate(() => {
      const urls: string[] = [];
      
      document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"]').forEach((iframe) => {
        const src = iframe.getAttribute('src');
        if (src) urls.push(src);
      });
      
      document.querySelectorAll('video source').forEach((source) => {
        const src = source.getAttribute('src');
        if (src) urls.push(src);
      });
      
      return urls;
    });
    
    data.media.videos.push(...videoUrls.slice(0, 10));
  } catch (error) {
    console.error('Error extracting videos:', error);
  }
}

export function formatCrawledDataForAgents(crawledData: CrawledData): string {
  let formatted = '\n=== ENHANCED WEB CRAWL DATA ===\n\n';

  formatted += '## COMPANY OVERVIEW\n';
  if (crawledData.companyInfo.description) {
    formatted += `Description: ${crawledData.companyInfo.description}\n`;
  }
  if (crawledData.companyInfo.mission) {
    formatted += `Mission/Vision: ${crawledData.companyInfo.mission}\n`;
  }
  if (crawledData.companyInfo.founded) {
    formatted += `Founded: ${crawledData.companyInfo.founded}\n`;
  }
  if (crawledData.companyInfo.headquarters) {
    formatted += `Headquarters: ${crawledData.companyInfo.headquarters}\n`;
  }

  if (crawledData.financial.pricing.length > 0 || crawledData.financial.revenue.length > 0 || 
      crawledData.financial.funding.length > 0 || crawledData.financial.valuation.length > 0) {
    formatted += '\n## FINANCIAL INFORMATION\n';
    if (crawledData.financial.pricing.length > 0) {
      formatted += `Pricing: ${crawledData.financial.pricing.slice(0, 5).join(', ')}\n`;
    }
    if (crawledData.financial.revenue.length > 0) {
      formatted += `Revenue: ${crawledData.financial.revenue.join(', ')}\n`;
    }
    if (crawledData.financial.funding.length > 0) {
      formatted += `Funding: ${crawledData.financial.funding.join(', ')}\n`;
    }
    if (crawledData.financial.valuation.length > 0) {
      formatted += `Valuation: ${crawledData.financial.valuation.join(', ')}\n`;
    }
  }

  if (crawledData.team.leadership.length > 0) {
    formatted += '\n## LEADERSHIP TEAM\n';
    if (crawledData.team.teamSize) {
      formatted += `Team Size: ${crawledData.team.teamSize} employees\n\n`;
    }
    crawledData.team.leadership.slice(0, 10).forEach(leader => {
      formatted += `• ${leader.name} - ${leader.title}\n`;
      if (leader.bio) {
        formatted += `  ${leader.bio.substring(0, 150)}...\n`;
      }
    });
  }

  if (crawledData.products.length > 0) {
    formatted += '\n## PRODUCTS & SOLUTIONS\n';
    crawledData.products.slice(0, 5).forEach(product => {
      formatted += `\n### ${product.name}\n`;
      if (product.description) {
        formatted += `${product.description}\n`;
      }
      if (product.features.length > 0) {
        formatted += `Key Features:\n`;
        product.features.forEach(feature => {
          formatted += `  • ${feature}\n`;
        });
      }
    });
  }

  if (crawledData.customers.testimonials.length > 0) {
    formatted += '\n## CUSTOMER TESTIMONIALS\n';
    crawledData.customers.testimonials.slice(0, 5).forEach(testimonial => {
      formatted += `\n"${testimonial.quote}"\n`;
      formatted += `  — ${testimonial.author}${testimonial.company ? `, ${testimonial.company}` : ''}\n`;
    });
  }

  if (crawledData.customers.caseStudies.length > 0) {
    formatted += '\n## CASE STUDIES\n';
    crawledData.customers.caseStudies.slice(0, 3).forEach((study, idx) => {
      formatted += `${idx + 1}. ${study}\n\n`;
    });
  }

  if (crawledData.customers.clientLogos.length > 0) {
    formatted += '\n## NOTABLE CLIENTS\n';
    formatted += crawledData.customers.clientLogos.slice(0, 20).join(', ') + '\n';
  }

  if (crawledData.media.videos.length > 0) {
    formatted += '\n## VIDEO CONTENT\n';
    formatted += `Found ${crawledData.media.videos.length} videos on the website\n`;
  }

  if (crawledData.media.pressReleases.length > 0) {
    formatted += '\n## RECENT NEWS & PRESS\n';
    crawledData.media.pressReleases.slice(0, 5).forEach((release, idx) => {
      formatted += `${idx + 1}. ${release}\n\n`;
    });
  }

  formatted += '\n## RAW PAGE CONTENT\n';
  Object.entries(crawledData.rawContent).forEach(([pageType, content]) => {
    formatted += `\n### ${pageType.toUpperCase()}\n${content.substring(0, 2000)}...\n`;
  });

  return formatted;
}
