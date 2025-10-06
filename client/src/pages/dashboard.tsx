import { useToast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, DollarSign, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { UrgentCasesBanner } from "@/components/urgent-cases-banner";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: revenueData } = useQuery<any>({
    queryKey: ["/api/dashboard/revenue-trends"],
  });

  const { data: clientDistribution } = useQuery<any>({
    queryKey: ["/api/dashboard/client-distribution"],
  });

  const { data: upcomingRenewals } = useQuery<any>({
    queryKey: ["/api/dashboard/upcoming-renewals"],
  });

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display mb-2" data-testid="page-title">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your client management and billing operations</p>
      </div>

      <UrgentCasesBanner />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Clients"
          value={stats?.totalClients || 0}
          icon={Users}
          trend={{ value: 12, direction: "up" }}
          testId="metric-clients"
        />
        <MetricCard
          title="Active Agreements"
          value={stats?.activeAgreements || 0}
          icon={FileText}
          trend={{ value: 5, direction: "up" }}
          testId="metric-agreements"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 18, direction: "up" }}
          testId="metric-revenue"
        />
        <MetricCard
          title="Outstanding"
          value={`$${(stats?.outstanding || 0).toLocaleString()}`}
          icon={AlertCircle}
          iconClassName="bg-destructive/10"
          testId="metric-outstanding"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Last 6 months revenue analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Distribution</CardTitle>
            <CardDescription>By industry sector</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clientDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(clientDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Upcoming Renewals</CardTitle>
              <CardDescription>Agreements expiring in next 90 days</CardDescription>
            </div>
            <Link href="/agreements">
              <Button variant="outline" size="sm" data-testid="button-view-all-renewals">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingRenewals && upcomingRenewals.length > 0 ? (
                upcomingRenewals.slice(0, 5).map((renewal: any) => (
                  <div key={renewal.id} className="flex items-center justify-between p-3 rounded-lg border hover-elevate" data-testid={`renewal-${renewal.id}`}>
                    <div className="flex-1">
                      <p className="font-medium">{renewal.clientName}</p>
                      <p className="text-sm text-muted-foreground">{renewal.agreementName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={renewal.daysLeft < 30 ? "destructive" : "default"}>
                        {renewal.daysLeft} days
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{renewal.value}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming renewals</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Revenue predictions & client health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-chart-3/10 border border-chart-3/20">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-chart-3" />
                  <h4 className="font-semibold">Revenue Forecast</h4>
                </div>
                <p className="text-2xl font-bold font-mono mb-1">${(stats?.forecastedRevenue || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Predicted next month (85% confidence)</p>
              </div>

              <div className="p-4 rounded-lg bg-chart-4/10 border border-chart-4/20">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="h-5 w-5 text-chart-4" />
                  <h4 className="font-semibold">At-Risk Clients</h4>
                </div>
                <p className="text-2xl font-bold font-mono mb-1">{stats?.atRiskClients || 0}</p>
                <p className="text-sm text-muted-foreground">Require immediate attention</p>
              </div>

              <Link href="/insights">
                <Button variant="outline" className="w-full" data-testid="button-view-insights">
                  View Detailed Insights
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}