import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  iconClassName?: string;
  testId?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  iconClassName,
  testId
}: MetricCardProps) {
  return (
    <Card className="hover-elevate" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("p-2 rounded-md bg-primary/10", iconClassName)}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-4xl font-bold font-display" data-testid={`${testId}-value`}>
            {value}
          </p>
          {trend && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={cn(
                "font-medium",
                trend.direction === "up" ? "text-chart-3" : "text-destructive"
              )}>
                {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span>from last month</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
