import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Download,
  Upload,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CrInvoice, Client } from "@shared/schema";
import { CrInvoiceFormDialog } from "@/components/cr-invoice-form-dialog";
import { InvoiceBulkImportDialog } from "@/components/invoice-bulk-import-dialog";
import { generateSampleInvoiceSheet } from "@/lib/invoiceImport";

const statusColors = {
  initiated: "default",
  pending: "secondary",
  approved: "default",
} as const;

export default function InvoiceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<
    CrInvoice | undefined
  >();
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/cr-invoices", searchTerm, statusFilter, clientFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (clientFilter !== "all") params.append("clientId", clientFilter);

      const response = await fetch(`/api/cr-invoices?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch invoices");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/cr-invoices/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete invoice");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cr-invoices"] });
      toast({
        title: "Success",
        description: "CR Invoice deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (invoice: CrInvoice) => {
    setSelectedInvoice(invoice);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, crNo: string) => {
    if (window.confirm(`Are you sure you want to delete CR Invoice ${crNo}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "INR":
        return "₹";
      default:
        return currency;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => generateSampleInvoiceSheet()}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Sample
          </Button>
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button
            onClick={() => {
              setSelectedInvoice(undefined);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add CR Invoice
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by CR No or Employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                No CR Invoices found
              </h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first CR invoice
              </p>
              <Button
                onClick={() => {
                  setSelectedInvoice(undefined);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add CR Invoice
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CR No</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.crNo}
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{invoice.employeeName}</TableCell>
                    <TableCell className="font-mono">
                      {getCurrencySymbol(invoice.crCurrency)}
                      {Number(invoice.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusColors[
                            invoice.status as keyof typeof statusColors
                          ]
                        }
                        className="capitalize"
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete(invoice.id, invoice.crNo)
                            }
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CrInvoiceFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        invoice={selectedInvoice}
      />

      <InvoiceBulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
      />
    </div>
  );
}
