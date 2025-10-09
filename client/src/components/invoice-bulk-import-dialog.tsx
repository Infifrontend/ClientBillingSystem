import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { parseInvoiceFile, validateInvoiceRow, type InvoiceImportRow } from "@/lib/invoiceImport";
import type { Client } from "@shared/schema";

interface InvoiceBulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  row: number;
  data: InvoiceImportRow;
  success: boolean;
  error?: string;
}

export function InvoiceBulkImportDialog({
  open,
  onOpenChange,
}: InvoiceBulkImportDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportResults([]);

    try {
      const rows = await parseInvoiceFile(file);
      const results: ImportResult[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;

        const validationError = validateInvoiceRow(row);
        if (validationError) {
          results.push({
            row: rowNumber,
            data: row,
            success: false,
            error: validationError,
          });
          continue;
        }

        const client = clients.find(
          (c) => c.name.toLowerCase() === row.clientName.toLowerCase()
        );

        if (!client) {
          results.push({
            row: rowNumber,
            data: row,
            success: false,
            error: `Client "${row.clientName}" not found`,
          });
          continue;
        }

        try {
          const crInvoiceData = {
            clientId: client.id,
            employeeName: client.employeeName || "Not Specified",
            crNo: row.invoiceNumber,
            crCurrency: row.currency.toUpperCase(),
            amount: row.amount.toString(),
            startDate: new Date(row.issueDate).toISOString(),
            endDate: new Date(row.dueDate).toISOString(),
            status: row.status.toLowerCase() === "paid" ? "approved" : row.status.toLowerCase() === "pending" ? "pending" : "initiated",
          };

          const response = await fetch("/api/cr-invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(crInvoiceData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create CR invoice");
          }

          results.push({
            row: rowNumber,
            data: row,
            success: true,
          });
        } catch (error: any) {
          results.push({
            row: rowNumber,
            data: row,
            success: false,
            error: error.message,
          });
        }
      }

      setImportResults(results);

      queryClient.invalidateQueries({ queryKey: ["/api/cr-invoices"] });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} CR invoices. ${failCount} failed.`,
        variant: failCount > 0 ? "destructive" : "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import CR Invoices</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple CR invoices at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              id="invoice-file-upload"
            />
            <label
              htmlFor="invoice-file-upload"
              className={`cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-2">
                {isProcessing ? "Processing..." : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground">
                CSV or Excel file (XLSX, XLS)
              </p>
            </label>
          </div>

          {importResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Import Results</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {importResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Row {result.row}: {result.data.clientName} - {result.data.invoiceNumber}
                        </p>
                        {!result.success && result.error && (
                          <p className="text-sm text-red-600 mt-1">{result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}