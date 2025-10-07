# ConTech-Advisor

An AI-powered M&A evaluation platform that leverages multi-agent AI analysis to provide comprehensive due diligence reports for construction technology company acquisitions.

## Overview

ConTech-Advisor uses Google's Gemini AI to orchestrate multiple specialized agents that analyze companies from different perspectives, providing detailed evaluation reports to support M&A decision-making in the construction technology sector.

## Features

- **Multi-Agent Analysis System**: Five specialized AI agents analyze different aspects of target companies:
  - **Financial Analyst**: Evaluates financial health, metrics, and projections
  - **Market & Business Strategist**: Assesses market position, competitive landscape, and growth opportunities
  - **Commercial Operations**: Analyzes business operations and commercial viability
  - **Technology & Product**: Reviews technical capabilities and product offerings
  - **HR & Operations**: Examines organizational structure and operational efficiency

- **Intelligent Data Processing**:
  - Web crawling of company websites
  - Document upload and extraction (PDF, DOCX, TXT)
  - Automated text extraction and analysis

- **Comprehensive Reporting**:
  - Executive summaries with clear recommendations
  - Detailed agent reports with findings
  - PDF export of evaluation reports
  - Real-time analysis progress tracking

- **Modern UI/UX**:
  - Carbon Design System-inspired interface
  - Dark mode support
  - Responsive design for desktop and mobile
  - Real-time status updates during analysis

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible component primitives
- **TanStack Query** for data fetching and caching
- **Wouter** for routing
- **Recharts** for data visualization

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Google Gemini AI** for multi-agent orchestration
- **Puppeteer** for PDF generation
- **Multer** for file uploads
- **Cheerio** for web scraping

### Additional Tools
- **Drizzle ORM** for database operations
- **Neon Serverless** for PostgreSQL database
- **Docker** for containerization

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ConTech-Advisor.git
cd ConTech-Advisor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your configuration:
```env
GEMINI_API_KEY=your_api_key_here
NODE_ENV=development
PORT=5001
```

## Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5001`

## Building for Production

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

## Docker Deployment

Build and run using Docker:

```bash
docker build -t contech-advisor .
docker run -p 5000:5000 --env-file .env contech-advisor
```

## Usage

1. **Create New Evaluation**:
   - Enter target company name and URL
   - Upload relevant documents (financials, presentations, etc.)

2. **Start Analysis**:
   - Initiate the multi-agent analysis process
   - Monitor real-time progress as each agent completes their evaluation

3. **Review Results**:
   - View executive summary with recommendation
   - Explore detailed reports from each specialist agent
   - Export comprehensive evaluation as PDF

## Project Structure

```
ConTech-Advisor/
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   └── index.html
├── server/                  # Backend Express server
│   ├── agents/             # AI agent prompts and logic
│   ├── services/           # Business logic services
│   │   ├── geminiService.ts      # AI orchestration
│   │   ├── documentProcessor.ts  # Document extraction
│   │   ├── webCrawler.ts        # Web scraping
│   │   └── pdfGeneratorPuppeteer.ts # Report generation
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Data persistence
│   └── index.ts            # Server entry point
├── attached_assets/         # Agent prompts and resources
├── Dockerfile              # Container configuration
└── package.json
```

## API Endpoints

- `POST /api/evaluations` - Create new evaluation
- `POST /api/evaluations/:id/documents` - Upload documents
- `POST /api/evaluations/:id/start` - Start analysis
- `GET /api/evaluations/:id` - Get evaluation status
- `GET /api/evaluations/:id/agents/:agentName` - Get agent status
- `GET /api/evaluations/:id/report/pdf` - Download PDF report

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema changes

## Design Philosophy

ConTech-Advisor follows Carbon Design System principles, emphasizing:
- Data clarity and hierarchy
- Professional, trustworthy aesthetic for enterprise users
- Efficient workflows for rapid due diligence
- Consistent, predictable interactions

See [design_guidelines.md](design_guidelines.md) for detailed design specifications.

## Security Considerations

- Sensitive data is stored securely
- Environment variables should never be committed
- API keys are required for Gemini AI access
- File uploads are validated and sanitized

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open an issue on GitHub.

## Acknowledgments

- Built with Google Gemini AI
- UI components from Radix UI
- Design inspired by IBM Carbon Design System
