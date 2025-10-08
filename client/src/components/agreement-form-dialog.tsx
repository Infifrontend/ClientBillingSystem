
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Client } from "@shared/schema";

interface AgreementFormData {
  clientId: string;
  agreementName: string;
  startDate: Date;
  endDate: Date;
  paymentTerms: string;
  implementFees: string;
  monthlySubscriptionFees: string;
  changeRequestFees: string;
  status: string;
  year1Fee: string;
  year2Fee: string;
  year3Fee: string;
  currency: string;
  autoRenewal: boolean;
}

interface AgreementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreement?: any | null;
}

export function AgreementFormDialog({ open, onOpenChange, agreement }: AgreementFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!agreement;

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<AgreementFormData>({
    defaultValues: {
      clientId: "",
      agreementName: "",
      paymentTerms: "Net 30",
      implementFees: "",
      monthlySubscriptionFees: "",
      changeRequestFees: "",
      status: "active",
      year1Fee: "",
      year2Fee: "",
      year3Fee: "",
      currency: "INR",
      autoRenewal: false,
    },
  });

  // Update form when agreement changes
  useEffect(() => {
    if (agreement) {
      const totalValue = parseFloat(agreement.value || "0");
      form.reset({
        clientId: agreement.clientId,
        agreementName: agreement.agreementName,
        startDate: new Date(agreement.startDate),
        endDate: new Date(agreement.endDate),
        paymentTerms: "Net 30",
        implementFees: "",
        monthlySubscriptionFees: "",
        changeRequestFees: "",
        status: agreement.status || "active",
        year1Fee: totalValue.toString(),
        year2Fee: "",
        year3Fee: "",
        currency: agreement.currency,
        autoRenewal: agreement.autoRenewal || false,
      });
    } else {
      form.reset({
        clientId: "",
        agreementName: "",
        paymentTerms: "Net 30",
        implementFees: "",
        monthlySubscriptionFees: "",
        changeRequestFees: "",
        status: "active",
        year1Fee: "",
        year2Fee: "",
        year3Fee: "",
        currency: "INR",
        autoRenewal: false,
      });
    }
  }, [agreement, form]);

  const createAgreement = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditing ? `/api/agreements/${agreement.id}` : "/api/agreements";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'create'} agreement`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agreements"] });
      toast({
        title: "Success",
        description: isEditing 
          ? "Agreement updated successfully."
          : "Agreement created successfully. Notifications have been sent to CSM and Finance.",
      });
      form.reset();
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

  const onSubmit = async (data: AgreementFormData) => {
    setIsSubmitting(true);
    try {
      // Calculate total value from multi-year fees
      const year1 = parseFloat(data.year1Fee) || 0;
      const year2 = parseFloat(data.year2Fee) || 0;
      const year3 = parseFloat(data.year3Fee) || 0;
      const totalValue = year1 + year2 + year3;

      const agreementData = {
        clientId: data.clientId,
        agreementName: data.agreementName,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        value: totalValue.toString(),
        currency: data.currency,
        status: data.status as "active" | "expiring_soon" | "expired" | "renewed",
        autoRenewal: data.autoRenewal,
      };

      await createAgreement.mutateAsync(agreementData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Agreement' : 'Add New Agreement'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the agreement details and payment terms.'
              : 'Create a new client agreement with contract details and payment terms.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="clientId"
              rules={{ required: "Client is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
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
              name="agreementName"
              rules={{ required: "Agreement name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agreement Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Annual Service Agreement 2024" {...field} disabled={isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                rules={{ required: "Start date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
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
                    <FormLabel>Contract End Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
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
            </div>

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                      <SelectItem value="Airline Specific - 90 Days">Airline Specific - 90 Days</SelectItem>
                      <SelectItem value="Airline Specific - 120 Days">Airline Specific - 120 Days</SelectItem>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="implementFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Implement Fees</FormLabel>
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

              <FormField
                control={form.control}
                name="monthlySubscriptionFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Subscription Fees</FormLabel>
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

              <FormField
                control={form.control}
                name="changeRequestFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change Request Fees</FormLabel>
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row gap-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="active" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Active
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expiring_soon" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Expiring Soon
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expired" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Expired
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="renewed" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Renewed
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="font-semibold text-sm">Multi-Year Service Fees</div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="year1Fee"
                  rules={{ required: "Year 1 fee is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year 1 Fee *</FormLabel>
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

                <FormField
                  control={form.control}
                  name="year2Fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year 2 Fee</FormLabel>
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

                <FormField
                  control={form.control}
                  name="year3Fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year 3 Fee</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="currency"
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
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Automatic Alerts:</strong> The system will automatically send notifications to CSM and Finance:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>2 months before contract expiry</li>
                <li>1 month before contract expiry</li>
                <li>2 weeks before contract expiry</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update Agreement" : "Create Agreement")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
