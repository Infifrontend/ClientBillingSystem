import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceFormDialog } from "@/components/service-form-dialog";
import { Plus, Search, DollarSign, Calendar, Building2, User, FileText } from "lucide-react";
import type { Service } from "@shared/schema";

export default function Services() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2" data-testid="page-title">Services & Billing</h1>
          <p className="text-muted-foreground">Manage client services and billing records</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-service">
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
              ${(services?.stats?.monthlyRevenue || 0).toLocaleString()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-mono" data-testid="stat-arr">
              ${(services?.stats?.annualRevenue || 0).toLocaleString()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Annual Revenue</p>
          </CardHeader>
        </Card>
      </div>

      {servicesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : services?.data && services.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.data.map((service: any) => (
            <Card key={service.id} className="hover-elevate" data-testid={`service-${service.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-chart-2" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg capitalize" data-testid={`service-type-${service.id}`}>
                          {service.serviceType.replace(/_/g, ' ')}
                        </h3>
                        {service.isRecurring && (
                          <Badge variant="outline" className="text-xs">Recurring</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <Building2 className="h-3 w-3" />
                        {service.clientName}
                      </p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono">
                      {service.currency} {service.amount}
                    </p>
                    {service.billingCycle && (
                      <p className="text-xs text-muted-foreground mt-1">{service.billingCycle}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  {service.startDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Start Date</p>
                        <p className="font-medium">{new Date(service.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {service.goLiveDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">Go-Live</p>
                        <p className="font-medium">{new Date(service.goLiveDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No services found</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first service</p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-service">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </CardContent>
        </Card>
      )}

      <ServiceFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        service={selectedService}
      />
    </div>
  );
}
