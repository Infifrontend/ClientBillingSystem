
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { parseClientFile, validateClientRow, ClientImportRow } from "@/lib/clientImport";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientBulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  row: number;
  name: string;
  success: boolean;
  error?: string;
}

export function ClientBulkImportDialog({
  open,
  onOpenChange,
}: ClientBulkImportDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResults([]);
    }
  };

  const importClients = async () => {
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
      const clientsData = await parseClientFile(file);
      
      if (clientsData.length === 0) {
        toast({
          title: "Error",
          description: "No data found in the file",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      const results: ImportResult[] = [];
      
      for (let i = 0; i < clientsData.length; i++) {
        const row = clientsData[i];
        const rowNumber = i + 2; // +2 because row 1 is header and array is 0-indexed
        
        // Validate row
        const validationError = validateClientRow(row);
        if (validationError) {
          results.push({
            row: rowNumber,
            name: row.name || 'Unknown',
            success: false,
            error: validationError,
          });
          setProgress(((i + 1) / clientsData.length) * 100);
          continue;
        }

        // Prepare client data
        const clientData = {
          name: row.name.trim(),
          employeeName: row.employeeName?.trim() || null,
          contactPerson: row.contactPerson?.trim() || null,
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
          address: row.address?.trim() || null,
          gstTaxId: row.gstTaxId?.trim() || null,
          industry: row.industry,
          region: row.region?.trim() || null,
          status: row.status || 'active',
        };

        try {
          await apiRequest("POST", "/api/clients", clientData);
          results.push({
            row: rowNumber,
            name: row.name,
            success: true,
          });
        } catch (error: any) {
          results.push({
            row: rowNumber,
            name: row.name,
            success: false,
            error: error.message || 'Failed to create client',
          });
        }
        
        setProgress(((i + 1) / clientsData.length) * 100);
      }

      setImportResults(results);
      
      // Refresh clients list
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} client(s). ${failCount > 0 ? `${failCount} failed.` : ''}`,
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
          <DialogTitle>Bulk Import Clients</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import multiple clients at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="client-bulk-upload"
              disabled={importing}
            />
            <label htmlFor="client-bulk-upload" className="cursor-pointer">
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
                <span>Importing clients...</span>
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
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    <span>{failCount} failed</span>
                  </div>
                )}
              </div>

              <ScrollArea className="h-[200px] border rounded-md p-3">
                <div className="space-y-2">
                  {importResults.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 text-sm p-2 rounded ${
                        result.success ? "bg-green-50" : "bg-destructive/10"
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          Row {result.row}: {result.name}
                        </p>
                        {result.error && (
                          <p className="text-xs text-destructive mt-1">
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

          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={importing}
            >
              {importResults.length > 0 ? "Close" : "Cancel"}
            </Button>
            <Button
              onClick={importClients}
              disabled={!file || importing}
            >
              {importing ? "Importing..." : "Import Clients"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
