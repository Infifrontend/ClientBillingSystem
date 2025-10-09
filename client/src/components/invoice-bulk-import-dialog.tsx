
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { parseInvoiceFile, validateInvoiceRow, InvoiceImportRow } from "@/lib/invoiceImport";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Client, Service } from "@shared/schema";

interface InvoiceBulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  row: number;
  clientName: string;
  invoiceNumber: string;
  success: boolean;
  error?: string;
}

export function InvoiceBulkImportDialog({
  open,
  onOpenChange,
}: InvoiceBulkImportDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: servicesResponse } = useQuery<{ data: Service[] }>({
    queryKey: ["/api/services"],
  });

  const services = servicesResponse?.data || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResults([]);
    }
  };

  const importInvoices = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setImportResults([]);
    setProgress(0);

    try {
      const invoicesData = await parseInvoiceFile(file);
      
      if (invoicesData.length === 0) {
        toast({
          title: "Error",
          description: "No data found in the file",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      const results: ImportResult[] = [];
      
      for (let i = 0; i < invoicesData.length; i++) {
        const row = invoicesData[i];
        const rowNumber = i + 2;
        
        const validationError = validateInvoiceRow(row);
        if (validationError) {
          results.push({
            row: rowNumber,
            clientName: row.clientName || 'Unknown',
            invoiceNumber: row.invoiceNumber || 'Unknown',
            success: false,
            error: validationError,
          });
          setProgress(((i + 1) / invoicesData.length) * 100);
          continue;
        }

        const client = clients?.find(c => 
          c.name.toLowerCase() === row.clientName.trim().toLowerCase()
        );

        if (!client) {
          results.push({
            row: rowNumber,
            clientName: row.clientName,
            invoiceNumber: row.invoiceNumber,
            success: false,
            error: 'Client not found',
          });
          setProgress(((i + 1) / invoicesData.length) * 100);
          continue;
        }

        let serviceId = null;
        if (row.serviceType) {
          const service = services?.find(s => 
            s.clientId === client.id && 
            s.serviceType.toLowerCase() === row.serviceType.toLowerCase()
          );
          serviceId = service?.id || null;
        }

        const amount = parseFloat(row.amount);

        const invoiceData = {
          clientId: client.id,
          serviceId: serviceId,
          invoiceNumber: row.invoiceNumber.trim(),
          amount: amount.toString(),
          currency: row.currency.toUpperCase(),
          issueDate: new Date(row.issueDate).toISOString(),
          dueDate: new Date(row.dueDate).toISOString(),
          paidDate: row.paidDate ? new Date(row.paidDate).toISOString() : null,
          status: row.status?.toLowerCase() || 'pending',
          notes: row.notes?.trim() || null,
        };

        try {
          await apiRequest("POST", "/api/invoices", invoiceData);
          results.push({
            row: rowNumber,
            clientName: row.clientName,
            invoiceNumber: row.invoiceNumber,
            success: true,
          });
        } catch (error: any) {
          const errorMessage = error.error || error.message || 'Failed to create invoice';
          results.push({
            row: rowNumber,
            clientName: row.clientName,
            invoiceNumber: row.invoiceNumber,
            success: false,
            error: errorMessage,
          });
        }
        
        setProgress(((i + 1) / invoicesData.length) * 100);
      }

      setImportResults(results);
      
      // Invalidate invoice queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} invoice(s). ${failCount > 0 ? `${failCount} failed.` : ''}`,
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to parse file",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResults([]);
    setProgress(0);
    onOpenChange(false);
  };

  const successCount = importResults.filter(r => r.success).length;
  const failCount = importResults.filter(r => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Bulk Import Invoices</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import multiple invoices at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="invoice-bulk-upload"
              disabled={importing}
            />
            <label htmlFor="invoice-bulk-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground">
                Excel (.xlsx, .xls) or CSV files
              </p>
            </label>
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing invoices...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {importResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{successCount} succeeded</span>
                </div>
                {failCount > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{failCount} failed</span>
                  </div>
                )}
              </div>

              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-2">
                  {importResults.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 text-sm p-2 rounded ${
                        result.success ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          Row {result.row}: {result.clientName} - {result.invoiceNumber}
                        </p>
                        {result.error && (
                          <p className="text-red-600 text-xs mt-1">
                            {result.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={importing}
            >
              {importResults.length > 0 ? "Close" : "Cancel"}
            </Button>
            <Button
              onClick={importInvoices}
              disabled={!file || importing}
            >
              {importing ? "Importing..." : "Import Invoices"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
