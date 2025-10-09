
import { useState } from "react";
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
import { parseUserFile, validateUserRow, UserImportRow } from "@/lib/userImport";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserBulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  row: number;
  email: string;
  name: string;
  success: boolean;
  error?: string;
}

export function UserBulkImportDialog({
  open,
  onOpenChange,
}: UserBulkImportDialogProps) {
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

  const importUsers = async () => {
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
      const usersData = await parseUserFile(file);
      
      if (usersData.length === 0) {
        toast({
          title: "Error",
          description: "No data found in the file",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      const results: ImportResult[] = [];
      
      for (let i = 0; i < usersData.length; i++) {
        const row = usersData[i];
        const rowNumber = i + 2;
        
        const validationError = validateUserRow(row, usersData, i);
        if (validationError) {
          results.push({
            row: rowNumber,
            email: row.email || 'Unknown',
            name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
            success: false,
            error: validationError,
          });
          setProgress(((i + 1) / usersData.length) * 100);
          continue;
        }

        const userData = {
          email: row.email.trim(),
          username: row.username?.trim() || null,
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          role: row.role.toLowerCase(),
          department: row.department?.trim() || null,
          status: row.status?.toLowerCase() || 'active',
        };

        try {
          await apiRequest("POST", "/api/users", userData);
          results.push({
            row: rowNumber,
            email: row.email,
            name: `${row.firstName} ${row.lastName}`,
            success: true,
          });
        } catch (error: any) {
          const errorMessage = error.error || error.message || 'Failed to create user';
          results.push({
            row: rowNumber,
            email: row.email,
            name: `${row.firstName} ${row.lastName}`,
            success: false,
            error: errorMessage,
          });
        }
        
        setProgress(((i + 1) / usersData.length) * 100);
      }

      setImportResults(results);
      
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} user(s). ${failCount > 0 ? `${failCount} failed.` : ''}`,
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
          <DialogTitle>Bulk Import Users</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import multiple users at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="user-bulk-upload"
              disabled={importing}
            />
            <label htmlFor="user-bulk-upload" className="cursor-pointer">
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
                <span>Importing users...</span>
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
                      className={`flex items-start gap-3 text-sm p-3 rounded-md ${
                        result.success ? "bg-green-50 dark:bg-green-950/20" : "bg-destructive/10"
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          Row {result.row}: {result.name} ({result.email})
                        </p>
                        {result.error && (
                          <p className="text-xs text-destructive mt-1.5 break-words">
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
              onClick={importUsers}
              disabled={!file || importing}
            >
              {importing ? "Importing..." : "Import Users"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
