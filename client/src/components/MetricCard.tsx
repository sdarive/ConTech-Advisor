import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TrendDirection = "up" | "down" | "neutral";

type MetricCardProps = {
  title: string;
  value: string;
  change?: string;
  trend?: TrendDirection;
  description?: string;
  icon?: React.ReactNode;
};

export function MetricCard({ title, value, change, trend, description, icon }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-chart-2" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case "neutral":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-chart-2";
      case "down":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card data-testid={`metric-card-${title}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-semibold" data-testid={`metric-value-${title}`}>
            {value}
          </div>
          {(change || description) && (
            <div className="flex items-center gap-2 text-xs">
              {change && trend && (
                <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span data-testid={`metric-change-${title}`}>{change}</span>
                </div>
              )}
              {description && (
                <span className="text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
