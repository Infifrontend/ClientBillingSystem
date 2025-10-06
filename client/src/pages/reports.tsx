
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, FileText, Filter, DollarSign, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [reportType, setReportType] = useState("outstanding");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

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

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const { data: outstandingReport } = useQuery<any>({
    queryKey: ["/api/reports/outstanding", { clients: selectedClients, dateRange }],
  });

  const { data: revenueReport } = useQuery<any>({
    queryKey: ["/api/reports/revenue", { clients: selectedClients, dateRange }],
  });

  const handleExport = (format: "excel" | "pdf" | "csv") => {
    toast({
      title: "Exporting report",
      description: `Preparing ${format.toUpperCase()} export...`,
    });
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
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
              <label className="text-sm font-medium mb-2 block">Client (Multi-select)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="select-clients">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedClients.length === 0
                      ? "All Clients"
                      : `${selectedClients.length} client(s) selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <div className="font-medium text-sm mb-2">Select Clients</div>
                    {clients?.map((client) => (
                      <div key={client.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`client-${client.id}`}
                          checked={selectedClients.includes(client.id)}
                          onChange={() => toggleClientSelection(client.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`client-${client.id}`} className="text-sm flex-1 cursor-pointer">
                          {client.name}
                        </label>
                      </div>
                    ))}
                    {clients?.length === 0 && (
                      <div className="text-sm text-muted-foreground">No clients available</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                    data-testid="select-date-range"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
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
            Outstanding Report
          </TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outstanding" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Report</CardTitle>
              <CardDescription>Pending payments by client with invoice details</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Overdue Days</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingReport?.invoices && outstandingReport.invoices.length > 0 ? (
                    outstandingReport.invoices.map((invoice: any) => (
                      <TableRow key={invoice.id} data-testid={`outstanding-invoice-${invoice.id}`}>
                        <TableCell className="font-medium">{invoice.clientName}</TableCell>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-mono">
                          {invoice.currency} {invoice.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={invoice.agingDays > 30 ? "destructive" : "secondary"}>
                            {invoice.agingDays} days
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={invoice.status === "overdue" ? "destructive" : "default"}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No outstanding invoices</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Report</CardTitle>
              <CardDescription>Revenue collected and pending by client</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Revenue Collected</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueReport?.data && revenueReport.data.length > 0 ? (
                    revenueReport.data.map((item: any) => (
                      <TableRow key={item.id} data-testid={`revenue-item-${item.id}`}>
                        <TableCell className="font-medium">{item.clientName}</TableCell>
                        <TableCell className="text-right font-mono text-chart-3">
                          ${item.revenueCollected.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-chart-1">
                          ${item.pending.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.serviceType}</Badge>
                        </TableCell>
                        <TableCell>{item.location}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No revenue data available</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
