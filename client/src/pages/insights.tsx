import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, Target, Brain, IndianRupee, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Insights() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: insights } = useQuery<any>({
    queryKey: ["/api/insights"],
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display mb-2" data-testid="page-title">AI Insights</h1>
        <p className="text-muted-foreground">Revenue forecasting, client health & risk analysis powered by AI/ML</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Revenue Forecast</CardTitle>
              <TrendingUp className="h-5 w-5 text-chart-3" />
            </div>
            <CardDescription>Next month prediction</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-mono mb-2 text-chart-3">
              ₹{(insights?.revenueForecast?.amount || 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Progress value={insights?.revenueForecast?.confidence || 85} className="flex-1" />
              <span className="text-sm font-medium">{insights?.revenueForecast?.confidence || 85}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Confidence level</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 border-chart-4/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">At-Risk Clients</CardTitle>
              <AlertTriangle className="h-5 w-5 text-chart-4" />
            </div>
            <CardDescription>Require immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-mono mb-2 text-chart-4">
              {insights?.atRiskClients?.count || 0}
            </p>
            <p className="text-sm text-muted-foreground">
              Total risk value: ₹{(insights?.atRiskClients?.totalValue || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Churn Probability</CardTitle>
              <Target className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Average across portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-mono mb-2 text-primary">
              {insights?.churnProbability || 12}%
            </p>
            <Badge variant={insights?.churnProbability > 20 ? "destructive" : "default"}>
              {insights?.churnProbability > 20 ? "High Risk" : "Low Risk"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Health Scores
            </CardTitle>
            <CardDescription>Risk assessment for key clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights?.clientHealthScores && insights.clientHealthScores.map((client: any) => (
                <div key={client.id} className="space-y-2" data-testid={`client-health-${client.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.industry}</p>
                    </div>
                    <Badge
                      variant={
                        client.score >= 80
                          ? "default"
                          : client.score >= 50
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {client.score}/100
                    </Badge>
                  </div>
                  <Progress
                    value={client.score}
                    className={
                      client.score >= 80
                        ? "bg-chart-3/20"
                        : client.score >= 50
                        ? "bg-chart-4/20"
                        : "bg-destructive/20"
                    }
                  />
                  <p className="text-xs text-muted-foreground">{client.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Profitability Analysis
            </CardTitle>
            <CardDescription>Top performing clients by margin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights?.profitabilityAnalysis && insights.profitabilityAnalysis.map((client: any, index: number) => (
                <div key={client.id} className="flex items-center gap-4" data-testid={`profitability-${client.id}`}>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Revenue: ₹{client.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-chart-3">+{client.marginPercent}%</p>
                    <p className="text-xs text-muted-foreground">Margin</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-chart-5/5 to-background border-chart-5/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Actionable insights based on data analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights?.recommendations && insights.recommendations.map((rec: any, index: number) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover-elevate"
                data-testid={`recommendation-${index}`}
              >
                <div className="flex items-start gap-3">
                  <Badge variant={rec.priority === "high" ? "destructive" : "default"}>
                    {rec.priority}
                  </Badge>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    {rec.potentialImpact && (
                      <p className="text-sm text-chart-3 font-medium mt-2">
                        Potential impact: ₹{rec.potentialImpact.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
