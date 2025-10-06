
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, FileText, Filter, DollarSign, Calendar as CalendarIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Static data for Outstanding Report
const staticOutstandingData = {
  invoices: [
    {
      id: "1",
      clientName: "Acme Corporation",
      invoiceNumber: "INV-2024-001",
      dueDate: "2024-01-15",
      amount: 25000,
      currency: "USD",
      agingDays: 45,
      status: "overdue"
    },
    {
      id: "2",
      clientName: "TechStart Inc",
      invoiceNumber: "INV-2024-002",
      dueDate: "2024-02-20",
      amount: 18500,
      currency: "USD",
      agingDays: 10,
      status: "pending"
    },
    {
      id: "3",
      clientName: "Global Enterprises",
      invoiceNumber: "INV-2024-003",
      dueDate: "2024-01-30",
      amount: 42000,
      currency: "USD",
      agingDays: 32,
      status: "overdue"
    },
    {
      id: "4",
      clientName: "Innovation Labs",
      invoiceNumber: "INV-2024-004",
      dueDate: "2024-02-28",
      amount: 15000,
      currency: "USD",
      agingDays: 5,
      status: "pending"
    },
    {
      id: "5",
      clientName: "Digital Solutions",
      invoiceNumber: "INV-2024-005",
      dueDate: "2024-01-10",
      amount: 33000,
      currency: "USD",
      agingDays: 52,
      status: "overdue"
    }
  ]
};

// Static data for Revenue Report
const staticRevenueData = {
  data: [
    {
      id: "1",
      clientName: "Acme Corporation",
      revenueCollected: 150000,
      pending: 25000,
      serviceType: "Consulting",
      location: "New York, NY"
    },
    {
      id: "2",
      clientName: "TechStart Inc",
      revenueCollected: 85000,
      pending: 18500,
      serviceType: "Development",
      location: "San Francisco, CA"
    },
    {
      id: "3",
      clientName: "Global Enterprises",
      revenueCollected: 220000,
      pending: 42000,
      serviceType: "Support",
      location: "London, UK"
    },
    {
      id: "4",
      clientName: "Innovation Labs",
      revenueCollected: 95000,
      pending: 15000,
      serviceType: "Training",
      location: "Austin, TX"
    },
    {
      id: "5",
      clientName: "Digital Solutions",
      revenueCollected: 180000,
      pending: 33000,
      serviceType: "Consulting",
      location: "Seattle, WA"
    }
  ]
};

// Static clients for filtering
const staticClients = [
  { id: "1", name: "Acme Corporation" },
  { id: "2", name: "TechStart Inc" },
  { id: "3", name: "Global Enterprises" },
  { id: "4", name: "Innovation Labs" },
  { id: "5", name: "Digital Solutions" }
];

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

  const handleExport = (format: "excel" | "pdf" | "csv") => {
    const data = reportType === "outstanding" ? filteredOutstandingData : filteredRevenueData;
    
    if (format === "csv") {
      // Generate CSV
      const headers = reportType === "outstanding" 
        ? ["Client", "Invoice No", "Due Date", "Amount", "Currency", "Overdue Days", "Status"]
        : ["Client", "Revenue Collected", "Pending", "Service Type", "Location"];
      
      const rows = data.map(item => {
        if (reportType === "outstanding") {
          const inv = item as any;
          return [inv.clientName, inv.invoiceNumber, inv.dueDate, inv.amount, inv.currency, inv.agingDays, inv.status];
        } else {
          const rev = item as any;
          return [rev.clientName, rev.revenueCollected, rev.pending, rev.serviceType, rev.location];
        }
      });
      
      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_report_${format}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: `${format.toUpperCase()} file downloaded successfully`,
      });
    } else if (format === "excel" || format === "pdf") {
      // Simulate export for Excel/PDF (in real app, you'd use libraries like xlsx or jsPDF)
      toast({
        title: "Export in progress",
        description: `Generating ${format.toUpperCase()} file... (This is a demo)`,
      });
      
      setTimeout(() => {
        toast({
          title: "Export complete",
          description: `${format.toUpperCase()} file would be downloaded in production`,
        });
      }, 1500);
    }
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const clearFilters = () => {
    setSelectedClients([]);
    setDateRange({ from: undefined, to: undefined });
  };

  // Filter outstanding invoices based on selected clients and date range
  const filteredOutstandingData = staticOutstandingData.invoices.filter((invoice) => {
    // Filter by client
    if (selectedClients.length > 0) {
      const client = staticClients.find(c => c.name === invoice.clientName);
      if (!client || !selectedClients.includes(client.id)) {
        return false;
      }
    }

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      const invoiceDate = new Date(invoice.dueDate);
      if (dateRange.from && invoiceDate < dateRange.from) {
        return false;
      }
      if (dateRange.to && invoiceDate > dateRange.to) {
        return false;
      }
    }

    return true;
  });

  // Filter revenue data based on selected clients
  const filteredRevenueData = staticRevenueData.data.filter((item) => {
    // Filter by client
    if (selectedClients.length > 0) {
      const client = staticClients.find(c => c.name === item.clientName);
      if (!client || !selectedClients.includes(client.id)) {
        return false;
      }
    }

    return true;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2" data-testid="page-title">Reports</h1>
          <p className="text-muted-foreground">Financial analytics and outstanding invoices</p>
        </div>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filters & Export
              </CardTitle>
              <CardDescription className="mt-1">Filter data and export reports in your preferred format</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Client (Multi-select)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-11 hover:bg-accent/50" data-testid="select-clients">
                    <span className="flex items-center gap-2 text-sm">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      {selectedClients.length === 0
                        ? "All Clients"
                        : `${selectedClients.length} client(s) selected`}
                    </span>
                    {selectedClients.length > 0 && (
                      <X 
                        className="h-4 w-4 hover:bg-destructive/10 hover:text-destructive rounded-sm transition-colors p-0.5" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClients([]);
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-4 space-y-3">
                    <div className="font-semibold text-sm border-b pb-2">Select Clients</div>
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                      {staticClients.map((client) => (
                        <div key={client.id} className="flex items-center space-x-3 p-2.5 hover:bg-accent rounded-md transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            id={`client-${client.id}`}
                            checked={selectedClients.includes(client.id)}
                            onChange={() => toggleClientSelection(client.id)}
                            className="h-4 w-4 rounded border-input cursor-pointer accent-primary"
                          />
                          <label htmlFor={`client-${client.id}`} className="text-sm flex-1 cursor-pointer">
                            {client.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between h-11 font-normal hover:bg-accent/50",
                      !dateRange.from && "text-muted-foreground"
                    )}
                    data-testid="select-date-range"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "MMM dd, yyyy")
                        )
                      ) : (
                        "Pick a date range"
                      )}
                    </span>
                    {dateRange.from && (
                      <X 
                        className="h-4 w-4 hover:bg-destructive/10 hover:text-destructive rounded-sm transition-colors p-0.5" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateRange({ from: undefined, to: undefined });
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className="rounded-md border-0"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-1">Export:</span>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")} data-testid="button-export-excel" className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200 dark:hover:bg-green-950 dark:hover:text-green-400">
                <FileDown className="h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} data-testid="button-export-pdf" className="gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950 dark:hover:text-red-400">
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("csv")} data-testid="button-export-csv" className="gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 dark:hover:bg-blue-950 dark:hover:text-blue-400">
                <FileDown className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="outstanding" onValueChange={setReportType}>
        <TabsList className="grid w-full max-w-md grid-cols-2 h-11">
          <TabsTrigger value="outstanding" data-testid="tab-outstanding" className="gap-2">
            <FileText className="h-4 w-4" />
            Outstanding Report
          </TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outstanding" className="mt-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Outstanding Report</CardTitle>
              <CardDescription>Pending payments by client with invoice details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Client</TableHead>
                      <TableHead className="font-semibold">Invoice No</TableHead>
                      <TableHead className="font-semibold">Due Date</TableHead>
                      <TableHead className="text-right font-semibold">Amount</TableHead>
                      <TableHead className="text-center font-semibold">Overdue Days</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOutstandingData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No invoices found matching the selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOutstandingData.map((invoice) => (
                        <TableRow key={invoice.id} data-testid={`outstanding-invoice-${invoice.id}`} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{invoice.clientName}</TableCell>
                          <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {invoice.currency} {invoice.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={invoice.agingDays > 30 ? "destructive" : "secondary"} className="font-semibold">
                              {invoice.agingDays} days
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={invoice.status === "overdue" ? "destructive" : "default"} className="capitalize">
                              {invoice.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Revenue Report</CardTitle>
              <CardDescription>Revenue collected and pending by client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Client</TableHead>
                      <TableHead className="text-right font-semibold">Revenue Collected</TableHead>
                      <TableHead className="text-right font-semibold">Pending</TableHead>
                      <TableHead className="font-semibold">Service Type</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRevenueData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No revenue data found matching the selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRevenueData.map((item) => (
                        <TableRow key={item.id} data-testid={`revenue-item-${item.id}`} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{item.clientName}</TableCell>
                          <TableCell className="text-right font-mono font-semibold text-green-600 dark:text-green-500">
                            ${item.revenueCollected.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-orange-600 dark:text-orange-500">
                            ${item.pending.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">{item.serviceType}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.location}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
