import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  showClientFilter?: boolean;
  clients?: Array<{ id: string; name: string }>;
  selectedClientId?: string;
  onClientChange?: (value: string) => void;
}

export function PageHeader({
  title,
  subtitle,
  showClientFilter = false,
  clients = [],
  selectedClientId = "all",
  onClientChange,
}: PageHeaderProps) {
  return (
    <div className="border-b bg-white py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {showClientFilter && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Filter by Client:
              </label>
              <Select value={selectedClientId} onValueChange={onClientChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Select defaultValue="7days">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
