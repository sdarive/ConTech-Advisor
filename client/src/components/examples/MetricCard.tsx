import { MetricCard as MetricCardComponent } from "../MetricCard";
import { TrendingUp, DollarSign, Users } from "lucide-react";

export default function MetricCardExample() {
  return (
    <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl">
      <MetricCardComponent
        title="Revenue Growth"
        value="45%"
        change="+12% vs industry"
        trend="up"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCardComponent
        title="Annual Recurring Revenue"
        value="$28M"
        description="YoY growth"
        icon={<DollarSign className="h-4 w-4" />}
      />
      <MetricCardComponent
        title="Customer Retention"
        value="94%"
        change="+6% vs industry"
        trend="up"
        icon={<Users className="h-4 w-4" />}
      />
    </div>
  );
}
