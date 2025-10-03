import { Network, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Agent = {
  id: string;
  name: string;
  status: "pending" | "analyzing" | "complete";
};

type AgentOrchestrationProps = {
  agents: Agent[];
  managerStatus: "idle" | "delegating" | "synthesizing" | "complete";
};

export function AgentOrchestration({ agents, managerStatus }: AgentOrchestrationProps) {
  const getManagerStatusText = () => {
    switch (managerStatus) {
      case "idle":
        return "Awaiting Input";
      case "delegating":
        return "Delegating Tasks";
      case "synthesizing":
        return "Synthesizing Reports";
      case "complete":
        return "Report Generated";
    }
  };

  const getManagerBadge = () => {
    switch (managerStatus) {
      case "idle":
        return <Badge variant="secondary">Idle</Badge>;
      case "delegating":
        return <Badge className="bg-primary">Active</Badge>;
      case "synthesizing":
        return <Badge className="bg-chart-3">Synthesizing</Badge>;
      case "complete":
        return <Badge className="bg-chart-2 hover:bg-chart-2">Complete</Badge>;
    }
  };

  return (
    <Card data-testid="card-orchestration">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Agent Orchestration Workflow
          </CardTitle>
          {getManagerBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-2xl">
              <div className="flex items-center justify-center mb-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Network className="h-8 w-8" />
                  </div>
                  <p className="mt-2 text-sm font-medium">Manager Agent</p>
                  <p className="text-xs text-muted-foreground">{getManagerStatusText()}</p>
                </div>
              </div>

              <div className="flex items-center justify-center mb-6">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex flex-col items-center">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-colors ${
                        agent.status === "complete"
                          ? "border-chart-2 bg-chart-2/10"
                          : agent.status === "analyzing"
                          ? "border-primary bg-primary/10 animate-pulse"
                          : "border-border bg-muted"
                      }`}
                    >
                      {agent.status === "complete" ? (
                        <CheckCircle2 className="h-6 w-6 text-chart-2" />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {agent.name.split(" ")[0].substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-center font-medium line-clamp-2">
                      {agent.name}
                    </p>
                    <Badge
                      variant={agent.status === "complete" ? "default" : "secondary"}
                      className={`mt-1 text-xs ${
                        agent.status === "complete"
                          ? "bg-chart-2 hover:bg-chart-2"
                          : agent.status === "analyzing"
                          ? "bg-primary"
                          : ""
                      }`}
                    >
                      {agent.status === "analyzing" ? "..." : agent.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
