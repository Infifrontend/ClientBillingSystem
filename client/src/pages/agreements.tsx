import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, FileText, Calendar, IndianRupee, AlertCircle, MoreVertical, Edit, Eye, Trash2, Download, Upload } from "lucide-react";
import { AgreementFormDialog } from "@/components/agreement-form-dialog";
import { AgreementBulkImportDialog } from "@/components/agreement-bulk-import-dialog";
import { generateSampleAgreementSheet } from "@/lib/agreementImport";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Agreement } from "@shared/schema";

export default function Agreements() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewAgreement, setPreviewAgreement] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [agreementToDelete, setAgreementToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingAgreement, setEditingAgreement] = useState<any | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

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

  const { data: agreements, isLoading: agreementsLoading } = useQuery<any>({
    queryKey: ["/api/agreements", searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/agreements?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch agreements");
      }

      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (agreementId: string) => {
      const response = await apiRequest("DELETE", `/api/agreements/${agreementId}`);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agreements"] });
      toast({
        title: "Success",
        description: data?.message || "Agreement has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete agreement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (agreementId: string, agreementName: string) => {
    setAgreementToDelete({ id: agreementId, name: agreementName });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (agreementToDelete) {
      deleteMutation.mutate(agreementToDelete.id);
      setIsDeleteDialogOpen(false);
      setAgreementToDelete(null);
    }
  };

  const handleEdit = (agreement: any) => {
    setEditingAgreement(agreement);
    setIsDialogOpen(true);
  };

  const handlePreview = (agreement: any) => {
    setPreviewAgreement(agreement);
    setIsPreviewOpen(true);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "expiring_soon":
        return "secondary";
      case "expired":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const days = Math.floor(
      (new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2" data-testid="page-title">Agreements</h1>
          <p className="text-muted-foreground">Manage client contracts and renewals</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => generateSampleAgreementSheet()}
            data-testid="button-download-sample"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Sample
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsBulkImportOpen(true)}
            data-testid="button-bulk-import"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button data-testid="button-add-agreement" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agreement
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agreements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="renewed">Renewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-mono" data-testid="stat-total">
              {agreements?.stats?.total || 0}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Total Agreements</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-mono text-chart-4" data-testid="stat-expiring">
              {agreements?.stats?.expiringSoon || 0}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Expiring in 90 Days</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-mono" data-testid="stat-value">
              ₹{(agreements?.stats?.totalValue || 0).toLocaleString()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Total Contract Value</p>
          </CardHeader>
        </Card>
      </div>

      {agreementsLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : agreements?.data && agreements.data.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Agreement Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-center w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.data.map((agreement: any) => {
                  const daysLeft = getDaysUntilExpiry(agreement.endDate);
                  const isExpiringSoon = daysLeft <= 90 && daysLeft >= 0;

                  return (
                    <TableRow key={agreement.id} className="cursor-pointer hover:bg-muted/50" data-testid={`agreement-${agreement.id}`}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold" data-testid={`agreement-name-${agreement.id}`}>
                          {agreement.agreementName}
                        </div>
                        {isExpiringSoon && (
                          <Badge variant="outline" className="gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {daysLeft} days left
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{agreement.clientName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(agreement.status)}>
                          {agreement.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {agreement.paymentTerms ? (
                          <span className="text-sm">{agreement.paymentTerms}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(agreement.startDate).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(agreement.endDate).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {agreement.value && (
                          <div className="flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium font-mono">
                              {agreement.value.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`actions-menu-${agreement.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(agreement)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Agreement
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePreview(agreement)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(agreement.id, agreement.agreementName)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No agreements found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first agreement</p>
            <Button data-testid="button-add-first-agreement" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Agreement
            </Button>
          </CardContent>
        </Card>
      )}

      <AgreementFormDialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingAgreement(null);
        }}
        agreement={editingAgreement}
      />

      <AgreementBulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{agreementToDelete?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAgreementToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agreement Details</DialogTitle>
          </DialogHeader>
          {previewAgreement && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agreement Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Agreement Name</p>
                    <p className="font-medium">{previewAgreement.agreementName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Client</p>
                    <p className="font-medium">{previewAgreement.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge variant={getStatusBadgeVariant(previewAgreement.status)}>
                      {previewAgreement.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {previewAgreement.paymentTerms && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Payment Terms</p>
                      <p className="font-medium">{previewAgreement.paymentTerms}</p>
                    </div>
                  )}
                  {previewAgreement.autoRenewal && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Auto-Renewal</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-chart-3" />
                        <span className="font-medium">Enabled</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contract Period</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </p>
                    <p className="font-medium">{new Date(previewAgreement.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      End Date
                    </p>
                    <p className="font-medium">{new Date(previewAgreement.endDate).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              {previewAgreement.value && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Contract Value
                      </p>
                      <p className="text-2xl font-bold font-mono">
                        ₹{previewAgreement.value.toLocaleString()}
                      </p>
                    </div>
                    {(previewAgreement.year1Fee || previewAgreement.year2Fee || previewAgreement.year3Fee) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                        {previewAgreement.year1Fee && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Year 1 Fee</p>
                            <p className="font-medium font-mono">₹{Number(previewAgreement.year1Fee).toLocaleString()}</p>
                          </div>
                        )}
                        {previewAgreement.year2Fee && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Year 2 Fee</p>
                            <p className="font-medium font-mono">₹{Number(previewAgreement.year2Fee).toLocaleString()}</p>
                          </div>
                        )}
                        {previewAgreement.year3Fee && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Year 3 Fee</p>
                            <p className="font-medium font-mono">₹{Number(previewAgreement.year3Fee).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}