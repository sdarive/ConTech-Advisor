# Contech Advisor - AI-Powered M&A Evaluation Platform

## Overview
An AI-powered multi-agent system for conducting comprehensive M&A due diligence on construction technology companies. Uses OpenAI GPT-5 to orchestrate five specialist agents that analyze companies across different dimensions and generate executive-ready reports.

## Architecture

### Multi-Agent System
- **Manager Agent**: Orchestrates the workflow, delegates tasks to specialists, synthesizes findings, and generates final reports with clear recommendations (Proceed/Caution/Do Not Proceed)
- **Financial Analyst Agent**: Analyzes revenue growth, profitability, cash flow, debt structure, and valuation indicators
- **Market & Business Strategist Agent**: Evaluates market dynamics, competitive landscape, growth opportunities, and CAGR
- **Commercial Operations Agent**: Assesses CAC/LTV metrics, customer retention, churn rates, and revenue predictability
- **Technology & Product Agent**: Reviews tech stack, R&D pipeline, IP portfolio, and integration potential
- **HR & Operations Agent**: Examines operational scalability, leadership strength, and key-person risks

### Agent Prompts
All agent system prompts are loaded from `attached_assets/Agent Prompts - Sheet1_1759525762806.csv` on startup, allowing easy customization without code changes.

### Technology Stack
- **Frontend**: React, TanStack Query, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js with TypeScript
- **AI**: OpenAI GPT-5
- **Document Processing**: PDF-parse, Mammoth (DOCX), Cheerio (web scraping)
- **Storage**: In-memory (MemStorage) for rapid prototyping

## Features

### Input & Data Collection
- Company URL submission with automatic web scraping
- Multi-format document upload (PDF, DOCX, PPT, TXT)
- Intelligent text extraction from all document types

### AI-Powered Analysis
- Parallel specialist agent execution
- Real-time progress tracking with polling updates
- Streaming AI responses for faster feedback
- Cross-functional insight synthesis

### Report Generation
- Executive summary with clear recommendations
- Detailed analysis across all five dimensions
- Structured findings with subsections
- Download capability for offline review

## API Endpoints

### Evaluations
- `POST /api/evaluations` - Create new evaluation
- `GET /api/evaluations/:id` - Get evaluation status and results
- `POST /api/evaluations/:id/documents` - Upload supporting documents
- `POST /api/evaluations/:id/start` - Start AI analysis workflow
- `GET /api/evaluations/:id/agents` - Get real-time agent statuses

## Environment Variables
- `OPENAI_API_KEY` - OpenAI API key (required)
- `SESSION_SECRET` - Session secret for security

## Design System
- **Primary Color**: Trimble construction tech blue (HSL: 212 100% 42%)
- **Typography**: IBM Plex Sans for professional enterprise aesthetic
- **Components**: Shadcn UI with custom Trimble branding
- **Dark Mode**: Fully supported with automatic theme switching

## Workflow
1. User enters company URL and uploads documents
2. Manager Agent receives data and scrapes website
3. Manager delegates analysis tasks to 5 specialist agents in parallel
4. Each agent analyzes their domain using Gemini AI with custom prompts
5. Agents return structured markdown reports with findings
6. Manager synthesizes all reports and generates executive summary
7. Final report includes recommendation (Proceed/Caution/Do Not Proceed)
8. User can download comprehensive PDF report

## Future Enhancements
- Multi-model support (Claude, GPT-4) for cross-validation
- RLHF pipeline for domain-specific model fine-tuning
- RAG integration with Trimble's internal knowledge bases
- Batch processing for multiple acquisition targets
- PostgreSQL database for persistence
- Advanced financial modeling and DCF analysis
