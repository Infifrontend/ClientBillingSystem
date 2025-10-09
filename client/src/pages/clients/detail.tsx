import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, FileText, DollarSign } from "lucide-react";
import type { Client, Service, Agreement } from "@shared/schema";

export default function ClientDetail() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id;

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

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    enabled: !!clientId,
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services", { clientId }],
    enabled: !!clientId,
  });

  const { data: agreements } = useQuery<Agreement[]>({
    queryKey: ["/api/agreements", { clientId }],
    enabled: !!clientId,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading client...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Client not found</h2>
          <Link href="/clients">
            <Button>Back to Clients</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="outline" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-display" data-testid="client-name">{client.name}</h1>
            <p className="text-muted-foreground">Client Details</p>
          </div>
        </div>
        <Link href={`/clients/${client.id}/edit`}>
          <Button data-testid="button-edit">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant={client.status === "active" ? "default" : "secondary"} data-testid="client-status">
                {client.status}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Industry</p>
              <p className="font-medium capitalize">{client.industry.replace(/_/g, ' ')}</p>
            </div>

            {client.employeeName && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Employee Name</p>
                <p className="font-medium">{client.employeeName}</p>
              </div>
            )}

            {client.contactPerson && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
                <p className="font-medium">{client.contactPerson}</p>
              </div>
            )}

            {client.email && (
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p className="font-medium">{client.email}</p>
              </div>
            )}

            {client.phone && (
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </p>
                <p className="font-medium">{client.phone}</p>
              </div>
            )}

            {client.region && (
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Region
                </p>
                <p className="font-medium">{client.region}</p>
              </div>
            )}

            {client.gstTaxId && (
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  GST/Tax ID
                </p>
                <p className="font-medium font-mono text-sm">{client.gstTaxId}</p>
              </div>
            )}

            {client.address && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <p className="font-medium text-sm">{client.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Tabs defaultValue="services">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
                <TabsTrigger value="agreements" data-testid="tab-agreements">Agreements</TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="mt-6 space-y-4">
                {services && services.length > 0 ? (
                  services.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 rounded-lg border hover-elevate"
                      data-testid={`service-${service.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold capitalize">{service.serviceType.replace(/_/g, ' ')}</h4>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                          )}
                          {client.employeeName && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="font-medium">Employee:</span> {client.employeeName}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline">
                            ₹{service.amount}
                          </Badge>
                          {service.status && (
                            <Badge 
                              variant={service.status === "paid" ? "default" : "secondary"}
                              className={service.status === "paid" ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}
                            >
                              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                        {service.startDate && (
                          <span>Start: {new Date(service.startDate).toLocaleDateString()}</span>
                        )}
                        {service.goLiveDate && (
                          <span>Go-Live: {new Date(service.goLiveDate).toLocaleDateString()}</span>
                        )}
                        {service.invoiceNumber && (
                          <span>Invoice: {service.invoiceNumber}</span>
                        )}
                        {service.invoiceDate && (
                          <span>Invoice Date: {new Date(service.invoiceDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No services found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="agreements" className="mt-6 space-y-4">
                {agreements && agreements.length > 0 ? (
                  agreements.map((agreement) => (
                    <div
                      key={agreement.id}
                      className="p-4 rounded-lg border hover-elevate"
                      data-testid={`agreement-${agreement.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{agreement.agreementName}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(agreement.startDate).toLocaleDateString()} - {new Date(agreement.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={agreement.status === "active" ? "default" : "secondary"}>
                            {agreement.status}
                          </Badge>
                          {agreement.value && (
                            <p className="text-sm font-medium mt-1">
                              ₹{agreement.value}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No agreements found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
