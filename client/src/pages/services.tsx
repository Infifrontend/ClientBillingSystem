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
import { ServiceFormDialog } from "@/components/service-form-dialog";
import { Plus, Search, IndianRupee, Calendar, Building2, User, MoreVertical, Edit, Eye, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import type { Service } from "@shared/schema";

export default function Services() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [previewService, setPreviewService] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete service");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Success",
        description: data?.message || "Service has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (serviceId: string, serviceType: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to delete ${serviceType} service for ${clientName}? This action cannot be undone.`)) {
      deleteMutation.mutate(serviceId);
    }
  };

  const handleEdit = (service: any) => {
    setSelectedService(service);
    setIsDialogOpen(true);
  };

  const handlePreview = (service: any) => {
    setPreviewService(service);
    setIsPreviewOpen(true);
  };

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

  const { data: services, isLoading: servicesLoading } = useQuery<any>({
    queryKey: ["/api/services", searchTerm, serviceTypeFilter, currencyFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (serviceTypeFilter && serviceTypeFilter !== 'all') params.append('serviceType', serviceTypeFilter);
      if (currencyFilter && currencyFilter !== 'all') params.append('currency', currencyFilter);

      const url = `/api/services${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch services');
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

  return (
    <div className="space-y-0">
      <PageHeader 
        title="Services & Billing" 
        subtitle="Manage client services and billing records"
      />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={() => {
          setSelectedService(null);
          setIsDialogOpen(true);
        }} data-testid="button-add-service">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-service-type">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="implementation">Implementation</SelectItem>
                <SelectItem value="cr">CR</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="hosting">Hosting</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="w-full md:w-[150px]" data-testid="select-currency">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-mono" data-testid="stat-total">
              {services?.stats?.total || 0}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Total Services</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-mono" data-testid="stat-recurring">
              {services?.stats?.recurring || 0}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Recurring Services</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-mono text-chart-3" data-testid="stat-mrr">
              ₹{(services?.stats?.monthlyRevenue || 0).toLocaleString()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-mono" data-testid="stat-arr">
              ₹{(services?.stats?.annualRevenue || 0).toLocaleString()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Annual Revenue</p>
          </CardHeader>
        </Card>
      </div>

      {servicesLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : services?.data && services.data.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Go-Live Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.data.map((service: any) => (
                  <TableRow key={service.id} className="cursor-pointer hover:bg-muted/50" data-testid={`service-row-${service.id}`}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                        <IndianRupee className="h-5 w-5 text-chart-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold capitalize" data-testid={`service-type-${service.id}`}>
                        {service.serviceType.replace(/_/g, ' ')}
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {service.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{service.clientName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium font-mono">
                        ₹{service.amount}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.billingCycle ? (
                        <span className="capitalize">{service.billingCycle.replace(/-/g, ' ')}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {service.startDate ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(service.startDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {service.goLiveDate ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(service.goLiveDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {service.isRecurring && (
                        <Badge variant="outline" className="text-xs">Recurring</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`actions-menu-${service.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(service)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePreview(service)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(service.id, service.serviceType, service.clientName)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <IndianRupee className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No services found</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first service</p>
            <Button onClick={() => {
              setSelectedService(null);
              setIsDialogOpen(true);
            }} data-testid="button-add-first-service">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </CardContent>
        </Card>
      )}

      <ServiceFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedService(null);
        }}
        service={selectedService}
      />

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
          </DialogHeader>
          {previewService && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Service Type</p>
                    <p className="font-medium capitalize">{previewService.serviceType.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Client</p>
                    <p className="font-medium">{previewService.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount</p>
                    <p className="font-medium font-mono">{previewService.currency} {previewService.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Billing Cycle</p>
                    <p className="font-medium capitalize">{previewService.billingCycle?.replace(/-/g, ' ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    {previewService.isRecurring ? (
                      <Badge variant="outline">Recurring</Badge>
                    ) : (
                      <Badge variant="secondary">One-time</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {previewService.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{previewService.description}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dates</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {previewService.startDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Start Date
                      </p>
                      <p className="font-medium">{new Date(previewService.startDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {previewService.goLiveDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Go-Live Date
                      </p>
                      <p className="font-medium">{new Date(previewService.goLiveDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsPreviewOpen(false);
                  handleEdit(previewService);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Service
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}