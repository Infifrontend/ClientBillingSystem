import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileDown,
  FileText,
  Filter,
  DollarSign,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/page-header";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Client, Invoice, Service } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [reportType, setReportType] = useState("outstanding");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch clients dynamically
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients");
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      return response.json();
    },
  });

  // Fetch invoices dynamically
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const response = await fetch("/api/invoices");
      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }
      return response.json();
    },
  });

  // Fetch services dynamically
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const response = await fetch("/api/services");
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
  });

  const invoices = invoicesData?.data || [];
  const services = servicesData?.data || [];

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
    const data =
      reportType === "outstanding"
        ? filteredOutstandingData
        : filteredRevenueData;

    if (format === "csv") {
      // Generate CSV
      const headers =
        reportType === "outstanding"
          ? [
              "Client",
              "Invoice No",
              "Due Date",
              "Amount",
              "Currency",
              "Overdue Days",
              "Status",
            ]
          : [
              "Client",
              "Revenue Collected",
              "Pending",
              "Service Type",
              "Location",
            ];

      const rows = data.map((item) => {
        if (reportType === "outstanding") {
          const inv = item as any;
          return [
            inv.clientName,
            inv.invoiceNumber,
            inv.dueDate,
            inv.amount,
            inv.currency,
            inv.agingDays,
            inv.status,
          ];
        } else {
          const rev = item as any;
          return [
            rev.clientName,
            rev.revenueCollected,
            rev.pending,
            rev.serviceType,
            rev.location,
          ];
        }
      });

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
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
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId],
    );
  };

  const clearFilters = () => {
    setSelectedClients([]);
    setDateRange({ from: undefined, to: undefined });
  };

  // Calculate aging days for invoices
  const calculateAgingDays = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Static data for specific clients
  const staticOutstandingData = [
    {
      id: "static-1",
      clientId: "cleartrip-client",
      clientName: "ClearTrip",
      invoiceNumber: "INV-CT-2025-001",
      amount: "250000",
      currency: "INR" as const,
      issueDate: new Date("2025-01-15"),
      dueDate: new Date("2025-02-15"),
      status: "pending" as const,
      agingDays: calculateAgingDays(new Date("2025-02-15")),
    },
    {
      id: "static-2",
      clientId: "cleartrip-client",
      clientName: "ClearTrip",
      invoiceNumber: "INV-CT-2024-012",
      amount: "180000",
      currency: "INR" as const,
      issueDate: new Date("2024-12-10"),
      dueDate: new Date("2025-01-10"),
      status: "overdue" as const,
      agingDays: calculateAgingDays(new Date("2025-01-10")),
    },
    {
      id: "static-3",
      clientId: "infiniti-client",
      clientName: "INFINITI SOFTWARE SOLUTIONS",
      invoiceNumber: "INV-INF-2025-003",
      amount: "320000",
      currency: "INR" as const,
      issueDate: new Date("2025-01-20"),
      dueDate: new Date("2025-02-20"),
      status: "pending" as const,
      agingDays: calculateAgingDays(new Date("2025-02-20")),
    },
    {
      id: "static-4",
      clientId: "infiniti-client",
      clientName: "INFINITI SOFTWARE SOLUTIONS",
      invoiceNumber: "INV-INF-2024-015",
      amount: "275000",
      currency: "INR" as const,
      issueDate: new Date("2024-11-15"),
      dueDate: new Date("2024-12-15"),
      status: "overdue" as const,
      agingDays: calculateAgingDays(new Date("2024-12-15")),
    },
  ];

  // Filter outstanding invoices based on selected clients and date range
  const dynamicOutstandingData = invoices
    .map((invoice: Invoice) => {
      const client = clients.find((c) => c.id === invoice.clientId);
      const agingDays = calculateAgingDays(invoice.dueDate);
      return {
        ...invoice,
        clientName: client?.name || "Unknown Client",
        agingDays,
      };
    })
    .filter((invoice) => {
      // Filter by client
      if (
        selectedClients.length > 0 &&
        !selectedClients.includes(invoice.clientId)
      ) {
        return false;
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

  // Add static data for specific clients when they are selected
  const filteredStaticData = staticOutstandingData.filter((invoice) => {
    const selectedClientNames = selectedClients
      .map((id) => clients.find((c) => c.id === id)?.name)
      .filter(Boolean);

    if (selectedClients.length > 0) {
      const matchesClient = selectedClientNames.some(
        (name) =>
          (name === "ClearTrip" && invoice.clientName === "ClearTrip") ||
          (name === "INFINITI SOFTWARE SOLUTIONS" &&
            invoice.clientName === "INFINITI SOFTWARE SOLUTIONS"),
      );
      if (!matchesClient) return false;
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

  const filteredOutstandingData = [
    ...dynamicOutstandingData,
    ...filteredStaticData,
  ];

  // Static revenue data for specific clients
  const staticRevenueData = [
    {
      id: "cleartrip-revenue",
      clientName: "ClearTrip",
      revenueCollected: 1250000,
      pending: 430000,
      serviceType: "implementation",
      location: "Bangalore, India",
    },
    {
      id: "infiniti-revenue",
      clientName: "INFINITI SOFTWARE SOLUTIONS",
      revenueCollected: 980000,
      pending: 595000,
      serviceType: "subscription",
      location: "Chennai, India",
    },
  ];

  // Filter revenue data based on selected clients
  const dynamicRevenueData = clients
    .filter((client) => {
      // Filter by selected clients
      if (selectedClients.length > 0 && !selectedClients.includes(client.id)) {
        return false;
      }
      return true;
    })
    .map((client) => {
      const clientServices = services.filter(
        (s: Service) => s.clientId === client.id,
      );
      const clientInvoices = invoices.filter(
        (inv: Invoice) => inv.clientId === client.id,
      );

      const revenueCollected = clientInvoices
        .filter((inv: Invoice) => inv.status === "paid")
        .reduce((sum, inv: Invoice) => sum + Number(inv.amount), 0);

      const pending = clientInvoices
        .filter(
          (inv: Invoice) => inv.status !== "paid" && inv.status !== "cancelled",
        )
        .reduce((sum, inv: Invoice) => sum + Number(inv.amount), 0);

      const serviceType =
        clientServices.length > 0 ? clientServices[0].serviceType : "N/A";

      return {
        id: client.id,
        clientName: client.name,
        revenueCollected,
        pending,
        serviceType,
        location: client.region || "N/A",
      };
    })
    .filter((item) => item.revenueCollected > 0 || item.pending > 0);

  // Add static revenue data for specific clients when they are selected
  const filteredStaticRevenue = staticRevenueData.filter((item) => {
    const selectedClientNames = selectedClients
      .map((id) => clients.find((c) => c.id === id)?.name)
      .filter(Boolean);

    if (selectedClients.length > 0) {
      return selectedClientNames.some(
        (name) =>
          (name === "ClearTrip" && item.clientName === "ClearTrip") ||
          (name === "INFINITI SOFTWARE SOLUTIONS" &&
            item.clientName === "INFINITI SOFTWARE SOLUTIONS"),
      );
    }

    return false;
  });

  const filteredRevenueData = [...dynamicRevenueData, ...filteredStaticRevenue];

  if (isLoading || !isAuthenticated || invoicesLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-0 relative">
      <PageHeader
        title="Reports"
        subtitle="Financial analytics and outstanding invoices"
      />
      <div className="">
        {/* Floating Filter Button */}
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="cls-f-icon z-50 h-14 w-14 rounded-full shadow-lg"
              data-testid="floating-filter-button"
            >
              <Filter className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md overflow-y-auto"
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  Filters & Export
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Filter data and export reports in your preferred format
                </p>
              </div>

              <div className="space-y-6">
                {/* Export Buttons */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Export Options
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("excel")}
                      data-testid="button-export-excel"
                      className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200 dark:hover:bg-green-950 dark:hover:text-green-400"
                    >
                      <FileDown className="h-4 w-4" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("pdf")}
                      data-testid="button-export-pdf"
                      className="gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950 dark:hover:text-red-400"
                    >
                      <FileDown className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("csv")}
                      data-testid="button-export-csv"
                      className="gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                    >
                      <FileDown className="h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </div>

                {/* Client Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Client (Multi-select)
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-11 hover:bg-accent/50"
                        data-testid="select-clients"
                      >
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
                        <div className="font-semibold text-sm border-b pb-2">
                          Select Clients
                        </div>
                        {clientsLoading ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading clients...
                          </div>
                        ) : clients.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No clients available
                          </div>
                        ) : (
                          <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                            {clients.map((client) => (
                              <div
                                key={client.id}
                                className="flex items-center space-x-3 p-2.5 hover:bg-accent rounded-md transition-colors cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  id={`drawer-client-${client.id}`}
                                  checked={selectedClients.includes(client.id)}
                                  onChange={() =>
                                    toggleClientSelection(client.id)
                                  }
                                  className="h-4 w-4 rounded border-input cursor-pointer accent-primary"
                                />
                                <label
                                  htmlFor={`drawer-client-${client.id}`}
                                  className="text-sm flex-1 cursor-pointer"
                                >
                                  {client.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Date Range
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between h-11 font-normal hover:bg-accent/50",
                          !dateRange.from && "text-muted-foreground",
                        )}
                        data-testid="select-date-range"
                      >
                        <span className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                                {format(dateRange.to, "MMM dd, yyyy")}
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
                        onSelect={(range) =>
                          setDateRange({ from: range?.from, to: range?.to })
                        }
                        numberOfMonths={2}
                        className="rounded-md border-0"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Clear Filters Button */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full h-11 gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Tabs defaultValue="outstanding" onValueChange={setReportType}>
          <TabsList className="grid w-full max-w-md grid-cols-2 h-11">
            <TabsTrigger
              value="outstanding"
              data-testid="tab-outstanding"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Outstanding Report
            </TabsTrigger>
            <TabsTrigger
              value="revenue"
              data-testid="tab-revenue"
              className="gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Revenue Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outstanding" className="mt-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Outstanding Report</CardTitle>
                <CardDescription>
                  Pending payments by client with invoice details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">
                          Invoice No
                        </TableHead>
                        <TableHead className="font-semibold">
                          Due Date
                        </TableHead>
                        <TableHead className="text-right font-semibold">
                          Amount
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          Overdue Days
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOutstandingData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No invoices found matching the selected filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOutstandingData.map((invoice: any) => (
                          <TableRow
                            key={invoice.id}
                            data-testid={`outstanding-invoice-${invoice.id}`}
                            className="hover:bg-muted/30"
                          >
                            <TableCell className="font-medium">
                              {invoice.clientName}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {invoice.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              {new Date(invoice.dueDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {invoice.currency === "INR"
                                ? "₹"
                                : invoice.currency === "USD"
                                  ? "$"
                                  : "€"}
                              {Number(invoice.amount).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  invoice.agingDays > 30
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="font-semibold"
                              >
                                {invoice.agingDays} days
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  invoice.status === "overdue"
                                    ? "destructive"
                                    : "default"
                                }
                                className="capitalize"
                              >
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
                <CardDescription>
                  Revenue collected and pending by client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="text-right font-semibold">
                          Revenue Collected
                        </TableHead>
                        <TableHead className="text-right font-semibold">
                          Pending
                        </TableHead>
                        <TableHead className="font-semibold">
                          Service Type
                        </TableHead>
                        <TableHead className="font-semibold">
                          Location
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRevenueData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No revenue data found matching the selected filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRevenueData.map((item: any) => (
                          <TableRow
                            key={item.id}
                            data-testid={`revenue-item-${item.id}`}
                            className="hover:bg-muted/30"
                          >
                            <TableCell className="font-medium">
                              {item.clientName}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-green-600 dark:text-green-500">
                              ₹{item.revenueCollected.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-orange-600 dark:text-orange-500">
                              ₹{item.pending.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="font-medium capitalize"
                              >
                                {item.serviceType.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.location}
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
        </Tabs>
      </div>
    </div>
  );
}
