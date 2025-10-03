# Design Guidelines: AI-Powered M&A Evaluation Platform

## Design Approach

**Selected Framework:** Carbon Design System (IBM)  
**Rationale:** Enterprise data applications requiring information density, clarity, and professional credibility. Carbon excels at presenting complex data while maintaining usability for professional users conducting critical M&A decisions.

**Core Principles:**
- Data clarity and hierarchy over decoration
- Professional, trustworthy aesthetic for enterprise users
- Efficient workflows for rapid due diligence
- Consistent, predictable interactions

---

## Color Palette

### Light Mode
- **Primary Brand:** 212 100% 42% (Trimble construction tech blue)
- **Background Base:** 0 0% 100% (white)
- **Background Secondary:** 220 13% 97% (light gray)
- **Text Primary:** 220 15% 15% (near black)
- **Text Secondary:** 220 10% 45% (medium gray)
- **Success:** 142 76% 36% (green for positive metrics)
- **Warning:** 45 93% 47% (amber for caution indicators)
- **Error:** 0 84% 60% (red for critical risks)

### Dark Mode
- **Primary Brand:** 212 100% 55% (lighter blue for contrast)
- **Background Base:** 220 15% 12% (dark charcoal)
- **Background Secondary:** 220 12% 16% (slightly lighter panels)
- **Text Primary:** 0 0% 95% (near white)
- **Text Secondary:** 220 5% 65% (light gray)
- **Data Visualization:** Adjusted with higher luminosity for readability

---

## Typography

**Font Stack:** IBM Plex Sans (via Google Fonts CDN), system-ui fallback

**Type Scale:**
- **Hero/H1:** text-4xl (36px), font-semibold, tracking-tight
- **Section Headers/H2:** text-2xl (24px), font-semibold
- **Subsection/H3:** text-xl (20px), font-medium
- **Body Large:** text-base (16px), font-normal
- **Body Default:** text-sm (14px), font-normal
- **Captions/Labels:** text-xs (12px), font-medium, uppercase tracking

**Application:**
- Report titles and page headers: H1
- Agent section headers: H2
- Metric categories: H3
- Analysis content: Body Default
- Data labels and tags: Captions

---

## Layout System

**Spacing Primitives:** Consistent use of Tailwind units: 2, 4, 6, 8, 12, 16, 24  
**Grid System:** 12-column responsive grid with gap-6

**Container Structure:**
- Dashboard: max-w-screen-2xl with p-6 lg:p-8
- Report pages: max-w-7xl with px-6
- Data panels: Flexible width with p-4 to p-6
- Cards and modules: p-4 standard, p-6 for featured content

**Responsive Breakpoints:**
- Mobile: Single column, stacked layout
- Tablet (md:): 2-column for metrics, side-by-side panels
- Desktop (lg:+): 3-4 column grids, multi-panel dashboards

---

## Component Library

### Navigation & Structure
- **Top Navigation Bar:** Fixed header with logo, active evaluation indicator, user profile
- **Sidebar Navigation:** Collapsible panel showing workflow stages (Data Input → Agent Analysis → Report Generation)
- **Breadcrumbs:** For deep navigation within report sections
- **Progress Indicator:** Stepper showing current stage in agentic workflow

### Data Input Components
- **URL Input Field:** Large, prominent input with validation feedback
- **Document Upload:** Drag-drop zone with file type indicators (PDF, DOCX, PPT) and upload progress
- **Multi-file Manager:** List view showing uploaded documents with preview, remove, and metadata

### Agent Workflow Dashboard
- **Agent Status Cards:** 5 cards (one per specialist agent) showing:
  - Agent name and icon
  - Current status (Analyzing/Complete/Pending)
  - Progress indicator
  - Key findings preview (when complete)
- **Orchestration Timeline:** Visual representation of manager agent coordinating specialist workflows

### Data Visualization Components
- **Metric Cards:** Displaying KPIs with trend indicators (↑↓), color-coded status
- **Comparison Tables:** Multi-column data tables with sortable headers, highlighting for outliers
- **Chart Types:** 
  - Line charts for financial trends
  - Bar charts for competitive benchmarking
  - Radar charts for multi-dimensional scoring
  - Donut charts for market share breakdowns
- **Risk Matrix:** 2x2 grid visualizing likelihood vs. impact

### Report Components
- **Executive Summary Panel:** Highlighted recommendation box with clear "Proceed/Caution/Do Not Proceed" status
- **Expandable Analysis Sections:** Accordion-style sections for each of 5 evaluation dimensions
- **Insight Callouts:** Bordered boxes highlighting critical findings with icon indicators
- **Data Tables:** Structured presentation of financial metrics, competitive data
- **Evidence Citations:** Footnote-style references linking findings to source documents

### Interactive Elements
- **Buttons:** Primary (solid bg), Secondary (outline), Tertiary (text only)
- **Tabs:** For switching between analysis views (Overview/Financial/Market/Tech/Operations)
- **Filters & Search:** For refining report data and finding specific insights
- **Export Options:** Download report as PDF, Share link, Print view

### Overlays & Modals
- **Document Previewer:** Modal showing full document content with annotations
- **Detailed Metric Drill-down:** Overlay revealing calculation methodology and data sources
- **Agent Analysis Detail:** Side panel expanding full specialist report

---

## Visual Design Patterns

**Cards & Panels:**
- Subtle shadows (shadow-sm) for depth hierarchy
- Border radius: rounded-lg for cards, rounded-md for inputs
- Consistent padding: p-4 for compact, p-6 for featured

**Data Density:**
- Information-rich but scannable
- Use of whitespace to create breathing room around critical data
- Progressive disclosure: summary → detail on interaction

**Status Indicators:**
- Color-coded badges for risk levels (green/amber/red)
- Icons paired with text for clarity (checkmark, warning triangle, info circle)
- Loading states with skeleton screens for agent processing

---

## Images

**Dashboard Hero Section:** 
- Abstract data visualization background (subtle, low opacity) showing interconnected nodes representing multi-agent analysis
- Overlaid with main workflow controls and current evaluation status
- No literal hero image - focus on functional dashboard entry

**Agent Visualization:**
- Icon-based representations of each specialist agent (no photographic images)
- Visual flow diagram showing data moving from Manager to specialists and back

**Report Illustrations:**
- Charts and graphs generated from actual data
- No decorative imagery - all visuals serve analytical purpose
- Optional: Trimble brand mark in report header/footer for credibility

---

## Animation & Interaction

**Minimal, Purposeful Motion:**
- Agent status transitions: Smooth fade between states
- Data loading: Subtle pulse on skeleton screens
- Workflow progression: Animated stepper advancement
- **No decorative animations** - only functional feedback

**Micro-interactions:**
- Button states: Subtle scale on press
- Hover feedback: Background color shifts on interactive elements
- Focus states: Clear outline for keyboard navigation

---

## Accessibility & Compliance

- WCAG 2.1 AA contrast ratios for all text
- Keyboard navigation for all interactive elements
- Screen reader support with proper ARIA labels
- Dark mode with appropriate contrast adjustments
- Error states with clear messaging and recovery paths