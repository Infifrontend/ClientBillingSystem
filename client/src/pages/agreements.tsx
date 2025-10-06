import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { AgreementFormDialog } from "@/components/agreement-form-dialog";
import type { Agreement } from "@shared/schema";

export default function Agreements() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        <Button data-testid="button-add-agreement" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Agreement
        </Button>
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
              ${(agreements?.stats?.totalValue || 0).toLocaleString()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Total Contract Value</p>
          </CardHeader>
        </Card>
      </div>

      {agreementsLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : agreements?.data && agreements.data.length > 0 ? (
        <div className="space-y-4">
          {agreements.data.map((agreement: any) => {
            const daysLeft = getDaysUntilExpiry(agreement.endDate);
            const isExpiringSoon = daysLeft <= 90 && daysLeft >= 0;

            return (
              <Card key={agreement.id} className="hover-elevate" data-testid={`agreement-${agreement.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1" data-testid={`agreement-name-${agreement.id}`}>
                          {agreement.agreementName}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{agreement.clientName}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getStatusBadgeVariant(agreement.status)}>
                            {agreement.status.replace(/_/g, ' ')}
                          </Badge>
                          {isExpiringSoon && (
                            <Badge variant="outline" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {daysLeft} days left
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {agreement.value && (
                        <p className="text-xl font-bold font-mono">
                          {agreement.currency} {agreement.value.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-medium">{new Date(agreement.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-medium">{new Date(agreement.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {agreement.autoRenewal && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-chart-3" />
                        <span className="font-medium">Auto-Renewal Enabled</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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

      <AgreementFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
