import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, FileText, Filter, BarChart3, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [reportType, setReportType] = useState("outstanding");
  const [currency, setCurrency] = useState("all");
  const [period, setPeriod] = useState("current_month");

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

  const { data: outstandingReport } = useQuery<any>({
    queryKey: ["/api/reports/outstanding", { currency, period }],
  });

  const { data: revenueReport } = useQuery<any>({
    queryKey: ["/api/reports/revenue", { currency, period }],
  });

  const handleExport = (format: "excel" | "pdf" | "csv") => {
    toast({
      title: "Exporting report",
      description: `Preparing ${format.toUpperCase()} export...`,
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2" data-testid="page-title">Reports</h1>
          <p className="text-muted-foreground">Financial analytics and outstanding invoices</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Period</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")} data-testid="button-export-excel">
                <FileDown className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} data-testid="button-export-pdf">
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("csv")} data-testid="button-export-csv">
                <FileDown className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="outstanding" onValueChange={setReportType}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="outstanding" data-testid="tab-outstanding">
            <FileText className="h-4 w-4 mr-2" />
            Outstanding
          </TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outstanding" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Outstanding</CardDescription>
                <CardTitle className="text-3xl font-bold font-mono">
                  ${(outstandingReport?.total || 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Across all currencies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Overdue Amount</CardDescription>
                <CardTitle className="text-3xl font-bold font-mono text-destructive">
                  ${(outstandingReport?.overdue || 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{outstandingReport?.overdueCount || 0} invoices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Aging Analysis</CardDescription>
                <CardTitle className="text-3xl font-bold font-mono">
                  {outstandingReport?.avgAgingDays || 0} days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Average outstanding period</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Outstanding Invoices</CardTitle>
              <CardDescription>Pending payments by client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {outstandingReport?.invoices && outstandingReport.invoices.length > 0 ? (
                  outstandingReport.invoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                      data-testid={`outstanding-invoice-${invoice.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{invoice.clientName}</p>
                        <p className="text-sm text-muted-foreground">Invoice #{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono">
                          {invoice.currency} {invoice.amount}
                        </p>
                        <Badge variant={invoice.status === "overdue" ? "destructive" : "secondary"} className="mt-1">
                          {invoice.agingDays} days
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No outstanding invoices</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className="text-3xl font-bold font-mono text-chart-3">
                  ${(revenueReport?.total || 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">For selected period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Growth Rate</CardDescription>
                <CardTitle className="text-3xl font-bold font-mono text-chart-1">
                  +{revenueReport?.growthRate || 0}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">vs previous period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg Deal Size</CardDescription>
                <CardTitle className="text-3xl font-bold font-mono">
                  ${(revenueReport?.avgDealSize || 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Per client</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service Type</CardTitle>
                <CardDescription>Breakdown by service category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueReport?.byServiceType && revenueReport.byServiceType.map((item: any) => (
                    <div key={item.type} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{item.type.replace(/_/g, ' ')}</span>
                        <span className="font-semibold font-mono">${item.revenue.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Clients by Revenue</CardTitle>
                <CardDescription>Highest revenue contributors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueReport?.topClients && revenueReport.topClients.map((client: any, index: number) => (
                    <div key={client.id} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.industry}</p>
                      </div>
                      <p className="font-bold font-mono">${client.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
