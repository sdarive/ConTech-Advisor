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

async function fetchWithRetry(url: string, maxRetries: number = 3): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': new URL(url).origin
        }
      });

      // If we get a 401/403, wait a bit and retry
      if ((response.status === 401 || response.status === 403) && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Got ${response.status} for ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Error fetching ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries}):`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

export async function crawlCompanyWebsite(baseUrl: string, maxPages: number = 10): Promise<CrawledData> {
  let browser: Browser | undefined;

  try {
    const normalizedUrl = normalizeUrl(baseUrl);
    const domain = new URL(normalizedUrl).hostname;

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled'
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

        // Set realistic user agent and headers to avoid 401 errors
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
          'Referer': normalizedUrl
        });

        // Mask automation detection
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          });
        });

        // Retry logic for page navigation
        let navigationSuccess = false;
        for (let retryAttempt = 0; retryAttempt < 3 && !navigationSuccess; retryAttempt++) {
          try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
            navigationSuccess = true;
          } catch (navError: any) {
            if (retryAttempt < 2) {
              const delay = Math.pow(2, retryAttempt) * 1000;
              console.log(`Navigation failed for ${url}, retrying in ${delay}ms (attempt ${retryAttempt + 1}/3)`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              throw navError;
            }
          }
        }

        const content = await page.content();
        const $ = cheerio.load(content);

        $('script, style, nav, header, footer, iframe, noscript').remove();
        const textContent = $('body').text().replace(/\s+/g, ' ').trim();
        crawledData.rawContent[type] = textContent.substring(0, 5000);

        await extractStructuredData($, type, crawledData, page);

        await page.close();

        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay to be more respectful
      } catch (error: any) {
        console.error(`Error crawling ${url}:`, error.message || error);
        // Continue to next page even if this one fails
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

  try {
    // Use fetchWithRetry to handle 401/403 errors with retries
    const response = await fetchWithRetry(baseUrl);

    if (!response.ok) {
      console.error(`Failed to fetch ${baseUrl}: ${response.status} ${response.statusText}`);
      return pages;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const discoveredUrls = new Set<string>();

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        const urlObj = new URL(absoluteUrl);

        if (urlObj.hostname !== new URL(baseUrl).hostname) return;

        discoveredUrls.add(absoluteUrl);
      } catch {}
    });

    const relevantPatterns = [
      { patterns: ['/about', '/company', '/who-we-are', '/our-story'], type: 'about' },
      { patterns: ['/team', '/leadership', '/people', '/executives', '/management'], type: 'team' },
      { patterns: ['/products', '/solutions', '/services', '/platform', '/features'], type: 'products' },
      { patterns: ['/pricing', '/plans', '/cost'], type: 'pricing' },
      { patterns: ['/customers', '/clients', '/case-studies', '/testimonials', '/success', '/reviews'], type: 'customers' },
      { patterns: ['/news', '/press', '/media', '/newsroom', '/blog'], type: 'media' },
      { patterns: ['/investors', '/investor-relations', '/ir'], type: 'financial' }
    ];

    // Convert Set to Array to avoid TypeScript downlevelIteration error
    const urlsArray = Array.from(discoveredUrls);
    for (const url of urlsArray) {
      const lowerUrl = url.toLowerCase();

      for (const { patterns, type } of relevantPatterns) {
        if (patterns.some(pattern => lowerUrl.includes(pattern))) {
          pages.push({ url, type });
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('Error discovering pages:', error);
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

  if (!data.companyInfo.description) {
    $('h1').first().parent().find('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50 && text.length < 500 && !data.companyInfo.description) {
        data.companyInfo.description = text;
      }
    });
  }

  $('h1, h2, h3, h4').each((_, el) => {
    const text = $(el).text().toLowerCase();
    if ((text.includes('mission') || text.includes('vision') || text.includes('what we do')) && !data.companyInfo.mission) {
      let content = $(el).nextAll('p').first().text().trim();
      if (!content) {
        content = $(el).next().text().trim();
      }
      if (content && content.length > 30) {
        data.companyInfo.mission = content.substring(0, 500);
      }
    }
  });

  const bodyText = $('body').text();
  
  const foundedMatch = bodyText.match(/founded\s+in\s+(\d{4})|established\s+in\s+(\d{4})|since\s+(\d{4})/i);
  if (foundedMatch && !data.companyInfo.founded) {
    data.companyInfo.founded = foundedMatch[1] || foundedMatch[2] || foundedMatch[3];
  }

  const hqMatch = bodyText.match(/headquartered\s+in\s+([^.,\n]+)|headquarters[:\s]+([^.,\n]+)|based\s+in\s+([A-Z][^.,\n]+)/i);
  if (hqMatch && !data.companyInfo.headquarters) {
    data.companyInfo.headquarters = (hqMatch[1] || hqMatch[2] || hqMatch[3]).trim().substring(0, 100);
  }
}

function extractTeamInfo($: cheerio.CheerioAPI, data: CrawledData): void {
  const seenNames = new Set<string>();
  
  $('h2, h3, h4, h5, strong, b').each((_, el) => {
    const potentialName = $(el).text().trim();
    
    if (potentialName.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/) && potentialName.length < 50) {
      const parent = $(el).parent();
      const nextElements = $(el).nextAll().slice(0, 3);
      
      let title = '';
      let bio = '';
      
      nextElements.each((_, next) => {
        const text = $(next).text().trim();
        if (text.length < 100 && (text.match(/CEO|CTO|CFO|President|Director|VP|Vice President|Chief|Head|Manager|Co-founder|Founder/i))) {
          title = text;
        } else if (text.length > 30 && text.length < 500) {
          bio = text;
        }
      });

      if (!title) {
        const siblingText = parent.text();
        const titleMatch = siblingText.match(new RegExp(potentialName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[,\\s-]+(.*?)(?:[.,]|$)', 'i'));
        if (titleMatch) {
          title = titleMatch[1].substring(0, 100);
        }
      }
      
      if (title && !seenNames.has(potentialName.toLowerCase())) {
        seenNames.add(potentialName.toLowerCase());
        data.team.leadership.push({
          name: potentialName,
          title: title,
          bio: bio.substring(0, 300)
        });
      }
    }
  });

  const bodyText = $('body').text();
  const teamSizeMatch = bodyText.match(/(\d[\d,]+[\+]?)\s+employees|team\s+of\s+(\d[\d,]+)|(\d[\d,]+[\+]?)\s+people/i);
  if (teamSizeMatch && !data.team.teamSize) {
    data.team.teamSize = (teamSizeMatch[1] || teamSizeMatch[2] || teamSizeMatch[3]).replace(/,/g, '');
  }
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
  $('*').each((_, el) => {
    const text = $(el).text().trim();
    const priceMatch = text.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?(?:\/(?:month|year|mo|yr|user|seat))?/gi);
    if (priceMatch) {
      priceMatch.forEach(price => {
        if (!data.financial.pricing.includes(price)) {
          data.financial.pricing.push(price);
        }
      });
    }
  });

  $('h2, h3, h4').each((_, el) => {
    const heading = $(el).text().trim();
    if (heading.match(/free|starter|basic|pro|premium|enterprise|business/i)) {
      const priceInfo = $(el).nextAll().slice(0, 3).text().trim();
      if (priceInfo.match(/\$/)) {
        data.financial.pricing.push(`${heading}: ${priceInfo.substring(0, 100)}`);
      }
    }
  });
}

function extractCustomerInfo($: cheerio.CheerioAPI, data: CrawledData): void {
  $('blockquote, q').each((_, el) => {
    const quote = $(el).text().trim();
    if (quote && quote.length > 20 && quote.length < 1000) {
      let author = '';
      let company = '';
      
      const next = $(el).next();
      const nextText = next.text().trim();
      const authorMatch = nextText.match(/^[—–-]\s*(.+?)(?:,\s*(.+))?$/);
      if (authorMatch) {
        author = authorMatch[1];
        company = authorMatch[2] || '';
      }
      
      data.customers.testimonials.push({
        author: author || 'Anonymous',
        company: company,
        quote: quote.substring(0, 300)
      });
    }
  });

  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.startsWith('"') && text.endsWith('"') && text.length > 50 && text.length < 500) {
      data.customers.testimonials.push({
        author: 'Customer',
        company: '',
        quote: text.substring(1, text.length - 1).substring(0, 300)
      });
    }
  });

  $('h2, h3').each((_, el) => {
    const heading = $(el).text().toLowerCase();
    if (heading.includes('case study') || heading.includes('success story') || heading.includes('customer story')) {
      const content = $(el).nextAll('p, div').first().text().trim();
      if (content && content.length > 100) {
        data.customers.caseStudies.push(content.substring(0, 500));
      }
    }
  });

  $('img').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    if ((alt.toLowerCase().includes('logo') || src.toLowerCase().includes('logo')) && 
        !alt.toLowerCase().includes('our logo') && alt.length > 2) {
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
