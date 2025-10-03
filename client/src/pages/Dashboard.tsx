import { useState } from "react";
import { CompanyInput } from "@/components/CompanyInput";
import { AgentCard, type AgentStatus } from "@/components/AgentCard";
import { AgentOrchestration } from "@/components/AgentOrchestration";
import { ReportViewer } from "@/components/ReportViewer";
import { MetricCard } from "@/components/MetricCard";
import {
  DollarSign,
  TrendingUp,
  Users,
  Code,
  Building2,
  Brain,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type WorkflowStage = "input" | "analyzing" | "complete";

type AgentStatuses = {
  financial: AgentStatus;
  market: AgentStatus;
  commercial: AgentStatus;
  technology: AgentStatus;
  operations: AgentStatus;
};

export default function Dashboard() {
  const [stage, setStage] = useState<WorkflowStage>("input");
  const [agentStatuses, setAgentStatuses] = useState<AgentStatuses>({
    financial: "pending",
    market: "pending",
    commercial: "pending",
    technology: "pending",
    operations: "pending",
  });

  const handleStartAnalysis = () => {
    setStage("analyzing");
    
    setTimeout(() => setAgentStatuses(prev => ({ ...prev, financial: "analyzing" })), 500);
    setTimeout(() => setAgentStatuses(prev => ({ ...prev, market: "analyzing" })), 800);
    setTimeout(() => setAgentStatuses(prev => ({ ...prev, commercial: "analyzing" })), 1100);
    setTimeout(() => setAgentStatuses(prev => ({ ...prev, technology: "analyzing" })), 1400);
    setTimeout(() => setAgentStatuses(prev => ({ ...prev, operations: "analyzing" })), 1700);
    
    setTimeout(() => setAgentStatuses(prev => ({ ...prev, financial: "complete" })), 3000);
    setTimeout(() => setAgentStatuses(prev => ({ ...prev, market: "complete" })), 3500);
    setTimeout(() => setAgentStatuses(prev => ({ ...prev, commercial: "complete" })), 4000);
    setTimeout(() => setAgentStatuses(prev => ({ ...prev, technology: "complete" })), 4500);
    setTimeout(() => setAgentStatuses(prev => ({ ...prev, operations: "complete" })), 5000);
    setTimeout(() => setStage("complete"), 5500);
  };

  const agents = [
    {
      id: "financial",
      name: "Financial Analyst",
      description: "Analyzes financial health, risk profile, and valuation indicators",
      status: agentStatuses.financial,
      progress: agentStatuses.financial === "analyzing" ? 75 : 0,
      findings: [
        "Strong revenue growth of 45% YoY",
        "Healthy cash flow with 18% EBITDA margin",
      ],
      icon: <DollarSign className="h-5 w-5 text-primary" />,
    },
    {
      id: "market",
      name: "Market Strategist",
      description: "Evaluates market position, competitive landscape, and growth opportunities",
      status: agentStatuses.market,
      progress: agentStatuses.market === "analyzing" ? 60 : 0,
      findings: [
        "Leading position in construction analytics sector",
        "TAM growing at 23% CAGR through 2028",
      ],
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
    },
    {
      id: "commercial",
      name: "Commercial Operations",
      description: "Assesses sales effectiveness, customer health, and revenue predictability",
      status: agentStatuses.commercial,
      progress: agentStatuses.commercial === "analyzing" ? 82 : 0,
      findings: [
        "Low CAC with strong LTV:CAC ratio of 4.2:1",
        "Impressive 94% customer retention rate",
      ],
      icon: <Users className="h-5 w-5 text-primary" />,
    },
    {
      id: "technology",
      name: "Technology & Product",
      description: "Reviews tech stack, product roadmap, and integration potential",
      status: agentStatuses.technology,
      progress: agentStatuses.technology === "analyzing" ? 55 : 0,
      findings: [
        "Modern cloud-native architecture on AWS",
        "Strong IP portfolio with 8 pending patents",
      ],
      icon: <Code className="h-5 w-5 text-primary" />,
    },
    {
      id: "operations",
      name: "HR & Operations",
      description: "Examines operational scalability, leadership, and key personnel risks",
      status: agentStatuses.operations,
      progress: agentStatuses.operations === "analyzing" ? 90 : 0,
      findings: [
        "Experienced leadership team with domain expertise",
        "Scalable operations model with low key-person risk",
      ],
      icon: <Building2 className="h-5 w-5 text-primary" />,
    },
  ];

  const managerStatus =
    stage === "input"
      ? "idle"
      : stage === "analyzing" && Object.values(agentStatuses).every((s) => s === "complete")
      ? "synthesizing"
      : stage === "analyzing"
      ? "delegating"
      : "complete";

  const reportData = {
    companyName: "BuildTech Solutions Inc.",
    recommendation: "proceed" as const,
    executiveSummary:
      "BuildTech Solutions presents a compelling acquisition opportunity with strong fundamentals across all evaluation dimensions. The company demonstrates robust financial health with 45% YoY revenue growth and healthy margins. Market analysis reveals a leading position in the rapidly growing construction analytics sector (23% CAGR). Commercial operations show excellent unit economics with a 4.2:1 LTV:CAC ratio and 94% retention. The technology stack is modern and scalable, with valuable IP assets. Leadership is experienced with low key-person risk. Recommendation: Proceed with acquisition discussions.",
    sections: [
      {
        id: "financial",
        title: "Financial Health & Risk Assessment",
        content:
          "BuildTech demonstrates strong financial performance with revenue growth of 45% YoY, reaching $28M in ARR. EBITDA margins are healthy at 18%, indicating operational efficiency. Cash flow generation is robust with $4.2M in operating cash flow over the last 12 months.",
        subsections: [
          {
            title: "Key Metrics",
            content:
              "ARR: $28M (+45% YoY), Gross Margin: 78%, EBITDA Margin: 18%, Operating Cash Flow: $4.2M",
          },
          {
            title: "Risk Profile",
            content:
              "Low debt-to-equity ratio of 0.3x. Primary risks include customer concentration (top 3 customers = 32% of revenue) and dependency on continued market growth.",
          },
        ],
      },
      {
        id: "market",
        title: "Market Position & Growth Trajectory",
        content:
          "BuildTech operates in the construction analytics software market, estimated at $2.1B and growing at 23% CAGR. The company holds an estimated 4.5% market share with strong brand recognition among mid-market contractors.",
        subsections: [
          {
            title: "Competitive Landscape",
            content:
              "Primary competitors include Procore ($1.2B revenue), Autodesk Construction Cloud, and emerging regional players. BuildTech differentiates through superior predictive analytics and ease of use.",
          },
          {
            title: "Growth Opportunities",
            content:
              "Expansion into European markets (TAM: $650M), integration with BIM platforms, and upsell to enterprise segment present significant growth vectors.",
          },
        ],
      },
      {
        id: "commercial",
        title: "Revenue & Customer Operations",
        content:
          "Commercial operations demonstrate excellent efficiency with CAC of $12K and LTV of $51K, yielding a healthy 4.2:1 ratio. Sales cycle averages 45 days for mid-market deals.",
        subsections: [
          {
            title: "Customer Health",
            content:
              "Net retention rate of 118% indicates strong expansion revenue. Churn rate of 6% is well below industry average of 12%. NPS score of 62 shows high customer satisfaction.",
          },
        ],
      },
      {
        id: "technology",
        title: "Technology & Product Innovation",
        content:
          "The platform is built on modern cloud-native architecture using microservices on AWS. Tech stack includes React frontend, Python/FastAPI backend, and PostgreSQL database with comprehensive API documentation.",
        subsections: [
          {
            title: "Integration Potential",
            content:
              "Well-documented REST APIs facilitate integration with Trimble Connect and other enterprise systems. Existing integrations with major construction management platforms demonstrate ecosystem maturity.",
          },
        ],
      },
      {
        id: "operations",
        title: "Operational Efficiency & Execution",
        content:
          "Leadership team brings 50+ combined years of construction tech experience. CEO previously scaled similar SaaS company to successful exit. Engineering team of 35 is well-structured with low turnover (8% annually).",
        subsections: [
          {
            title: "Key Personnel Risks",
            content:
              "CTO departure risk is mitigated by strong engineering leadership bench. Sales leader retention is critical given customer relationships. Retention packages recommended for top 5 executives.",
          },
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Contech Advisor
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered M&A evaluation using multi-agent analysis
        </p>
      </div>

      {stage === "complete" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Revenue Growth"
            value="45%"
            change="+12% vs industry"
            trend="up"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Market Position"
            value="#3"
            description="In construction analytics"
            icon={<Building2 className="h-4 w-4" />}
          />
          <MetricCard
            title="LTV:CAC Ratio"
            value="4.2:1"
            change="Above 3:1 target"
            trend="up"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricCard
            title="Customer Retention"
            value="94%"
            change="+6% vs industry"
            trend="up"
            icon={<Users className="h-4 w-4" />}
          />
        </div>
      )}

      <Tabs defaultValue="input" value={stage === "input" ? "input" : "analysis"} className="space-y-6">
        <TabsList>
          <TabsTrigger value="input" data-testid="tab-input">
            <Brain className="h-4 w-4 mr-2" />
            Input Data
          </TabsTrigger>
          <TabsTrigger value="analysis" disabled={stage === "input"} data-testid="tab-analysis">
            Analysis & Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <CompanyInput onSubmit={handleStartAnalysis} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <AgentOrchestration agents={agents} managerStatus={managerStatus} />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Specialist Agent Analysis</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  name={agent.name}
                  description={agent.description}
                  status={agent.status}
                  progress={agent.progress}
                  findings={agent.status === "complete" ? agent.findings : undefined}
                  icon={agent.icon}
                />
              ))}
            </div>
          </div>

          {stage === "complete" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Executive Report</h2>
              <ReportViewer {...reportData} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
