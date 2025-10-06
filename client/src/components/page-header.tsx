
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notification-bell";
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
  showFilters?: boolean;
}

export function PageHeader({ title, subtitle, showFilters = false }: PageHeaderProps) {
  return (
    <div className="border-b bg-[#1D2F7E] sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-4">
          <SidebarTrigger data-testid="button-sidebar-toggle" className="text-white hover:bg-white/10" />
          <div className="text-sm text-white/80">
            Infiniti Software Solutions
          </div>
        </div>
        <NotificationBell />
      </div>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-sm text-white/70">{subtitle}</p>
          </div>
          {showFilters && (
            <div className="flex items-center gap-3">
              <Select defaultValue="7days">
                <SelectTrigger className="w-[140px] bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="Last 7 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px] bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="secondary" className="bg-white text-[#1D2F7E] hover:bg-white/90">
                Refresh
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
