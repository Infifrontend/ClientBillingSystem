import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Client, CrInvoice } from "@shared/schema";

interface CrInvoiceFormData {
  clientId: string;
  employeeName: string;
  crNo: string;
  crCurrency: string;
  amount: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

interface CrInvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: CrInvoice;
}

export function CrInvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
}: CrInvoiceFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: employees } = useQuery<string[]>({
    queryKey: ["/api/employees", employeeSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (employeeSearch) {
        params.append("search", employeeSearch);
      }
      const response = await fetch(`/api/employees?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
    enabled: employeeSearch.length >= 3,
  });

  const form = useForm<CrInvoiceFormData>({
    defaultValues: invoice
      ? {
          clientId: invoice.clientId,
          employeeName: invoice.employeeName,
          crNo: invoice.crNo,
          crCurrency: invoice.crCurrency,
          amount: invoice.amount,
          startDate: new Date(invoice.startDate),
          endDate: new Date(invoice.endDate),
          status: invoice.status,
        }
      : {
          clientId: "",
          employeeName: "",
          crNo: "",
          crCurrency: "INR",
          amount: "",
          startDate: new Date(),
          endDate: new Date(),
          status: "initiated",
        },
  });

  useEffect(() => {
    if (invoice && open) {
      form.reset({
        clientId: invoice.clientId,
        employeeName: invoice.employeeName,
        crNo: invoice.crNo,
        crCurrency: invoice.crCurrency,
        amount: invoice.amount,
        startDate: new Date(invoice.startDate),
        endDate: new Date(invoice.endDate),
        status: invoice.status,
      });
    } else if (!invoice && open) {
      form.reset({
        clientId: "",
        employeeName: "",
        crNo: "",
        crCurrency: "INR",
        amount: "",
        startDate: new Date(),
        endDate: new Date(),
        status: "initiated",
      });
      setUploadedFile(null);
    }
  }, [invoice, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/cr-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create CR invoice");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cr-invoices"] });
      toast({
        title: "Success",
        description: "CR Invoice created successfully",
      });
      form.reset();
      setUploadedFile(null);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/cr-invoices/${invoice?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update CR invoice");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cr-invoices"] });
      toast({
        title: "Success",
        description: "CR Invoice updated successfully",
      });
      form.reset();
      setUploadedFile(null);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CrInvoiceFormData) => {
    const invoiceData = {
      clientId: data.clientId,
      employeeName: data.employeeName,
      crNo: data.crNo,
      crCurrency: data.crCurrency,
      amount: data.amount,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      status: data.status,
    };

    if (invoice) {
      await updateMutation.mutateAsync(invoiceData);
    } else {
      await createMutation.mutateAsync(invoiceData);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? "Edit CR Invoice" : "Add CR Invoice"}
          </DialogTitle>
          <DialogDescription>
            {invoice
              ? "Update CR invoice details"
              : "Create a new CR invoice record"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                rules={{ required: "Client is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employeeName"
                rules={{ required: "Employee name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter employee name"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setEmployeeSearch(e.target.value);
                        }}
                        list="employees-list"
                      />
                    </FormControl>
                    <datalist id="employees-list">
                      {employees?.map((emp, idx) => (
                        <option key={idx} value={emp} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="crNo"
                rules={{ required: "CR No is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CR No *</FormLabel>
                    <FormControl>
                      <Input placeholder="CR-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="crCurrency"
                rules={{ required: "Currency is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                rules={{ required: "Amount is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                rules={{ required: "Start date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                rules={{ required: "End date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                rules={{ required: "Status is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="initiated">Initiated</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormLabel>Document Upload</FormLabel>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Upload supporting document
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, or Image up to 10MB
                  </p>
                </label>
              </div>

              {uploadedFile && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <span className="text-sm truncate flex-1">
                    {uploadedFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? invoice
                    ? "Updating..."
                    : "Creating..."
                  : invoice
                    ? "Update Invoice"
                    : "Create Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
