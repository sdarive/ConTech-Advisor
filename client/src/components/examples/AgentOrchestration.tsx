import { AgentOrchestration as AgentOrchestrationComponent } from "../AgentOrchestration";

export default function AgentOrchestrationExample() {
  const agents = [
    { id: "1", name: "Financial Analyst", status: "complete" as const },
    { id: "2", name: "Market Strategist", status: "analyzing" as const },
    { id: "3", name: "Commercial Ops", status: "pending" as const },
    { id: "4", name: "Technology", status: "pending" as const },
    { id: "5", name: "HR & Operations", status: "pending" as const },
  ];

  return (
    <div className="p-6">
      <AgentOrchestrationComponent agents={agents} managerStatus="delegating" />
    </div>
  );
}
