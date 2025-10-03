import { Brain, CheckCircle2, Loader2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export type AgentStatus = "pending" | "analyzing" | "complete";

export type AgentCardProps = {
  name: string;
  description: string;
  status: AgentStatus;
  progress?: number;
  findings?: string[];
  icon?: React.ReactNode;
};

export function AgentCard({ name, description, status, progress = 0, findings, icon }: AgentCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-muted-foreground" />;
      case "analyzing":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-chart-2" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" data-testid={`badge-status-${name}`}>Pending</Badge>;
      case "analyzing":
        return <Badge className="bg-primary" data-testid={`badge-status-${name}`}>Analyzing</Badge>;
      case "complete":
        return <Badge className="bg-chart-2 hover:bg-chart-2" data-testid={`badge-status-${name}`}>Complete</Badge>;
    }
  };

  return (
    <Card className="hover-elevate" data-testid={`card-agent-${name}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              {icon || <Brain className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          {status === "analyzing" && (
            <span className="text-sm text-muted-foreground" data-testid={`text-progress-${name}`}>
              {progress}%
            </span>
          )}
        </div>
        
        {status === "analyzing" && (
          <Progress value={progress} className="h-1.5" data-testid={`progress-${name}`} />
        )}

        {status === "complete" && findings && findings.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Key Findings
            </p>
            <ul className="space-y-1">
              {findings.slice(0, 2).map((finding, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="flex-1">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
