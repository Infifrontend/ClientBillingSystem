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
import { Plus, Search, Users, Building2, Mail, Phone, MapPin, MoreVertical, Edit, Eye, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

export default function ClientsList() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [previewClient, setPreviewClient] = useState<Client | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await apiRequest("DELETE", `/api/clients/${clientId}`);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: data?.message || "Client has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (clientId: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      deleteMutation.mutate(clientId);
    }
  };

  const handlePreview = (client: Client) => {
    setPreviewClient(client);
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

  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", searchTerm, statusFilter, industryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (industryFilter && industryFilter !== "all") params.append("industry", industryFilter);

      const response = await fetch(`/api/clients?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2" data-testid="page-title">Clients</h1>
          <p className="text-muted-foreground">Manage your client portfolio</p>
        </div>
        <Link href="/clients/new">
          <Button data-testid="button-add-client">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-industry">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="airlines">Airlines</SelectItem>
                <SelectItem value="travel_agency">Travel Agency</SelectItem>
                <SelectItem value="gds">GDS</SelectItem>
                <SelectItem value="ota">OTA</SelectItem>
                <SelectItem value="aviation_services">Aviation Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {clientsLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : clients && clients.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-center w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" data-testid={`client-row-${client.id}`}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/clients/${client.id}`}>
                        <div className="font-semibold hover:text-primary transition-colors" data-testid={`client-name-${client.id}`}>
                          {client.name}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === "active" ? "default" : "secondary"}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{client.industry.replace(/_/g, ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.region && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{client.region}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`actions-menu-${client.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate("/clients/new")}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Client
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePreview(client)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(client.id, client.name)}
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
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No clients found</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first client</p>
            <Link href="/clients/new">
              <Button data-testid="button-add-first-client">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {previewClient && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Client Name</p>
                    <p className="font-medium">{previewClient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge variant={previewClient.status === "active" ? "default" : "secondary"}>
                      {previewClient.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Industry</p>
                    <p className="font-medium capitalize">{previewClient.industry.replace(/_/g, ' ')}</p>
                  </div>
                  {previewClient.employeeName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Employee Name</p>
                      <p className="font-medium">{previewClient.employeeName}</p>
                    </div>
                  )}
                  {previewClient.region && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Region</p>
                      <p className="font-medium">{previewClient.region}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {previewClient.contactPerson && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
                      <p className="font-medium">{previewClient.contactPerson}</p>
                    </div>
                  )}
                  {previewClient.email && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </p>
                      <p className="font-medium">{previewClient.email}</p>
                    </div>
                  )}
                  {previewClient.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </p>
                      <p className="font-medium">{previewClient.phone}</p>
                    </div>
                  )}
                  {previewClient.gstTaxId && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">GST/Tax ID</p>
                      <p className="font-medium font-mono text-sm">{previewClient.gstTaxId}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {previewClient.address && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-sm">{previewClient.address}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsPreviewOpen(false);
                  navigate(`/clients/${previewClient.id}/edit`);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Client
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}