import { AgentCard as AgentCardComponent } from "../AgentCard";
import { DollarSign, TrendingUp } from "lucide-react";

export default function AgentCardExample() {
  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <AgentCardComponent
        name="Financial Analyst"
        description="Analyzes financial health, risk profile, and valuation indicators"
        status="complete"
        findings={[
          "Strong revenue growth of 45% YoY",
          "Healthy cash flow with 18% EBITDA margin",
        ]}
        icon={<DollarSign className="h-5 w-5 text-primary" />}
      />
      <AgentCardComponent
        name="Market Strategist"
        description="Evaluates market position and competitive landscape"
        status="analyzing"
        progress={65}
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
      />
      <AgentCardComponent
        name="Commercial Operations"
        description="Assesses sales effectiveness and customer health"
        status="pending"
      />
    </div>
  );
}
