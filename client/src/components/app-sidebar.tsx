import {
  LayoutDashboard,
  Users,
  FileText,
  IndianRupee,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    testId: "sidebar-dashboard",
    roles: ["admin", "csm", "finance", "viewer"],
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    testId: "sidebar-clients",
    roles: ["admin", "csm", "finance", "viewer"],
  },
  {
    title: "Services & Billing",
    url: "/services",
    icon: IndianRupee,
    testId: "sidebar-services",
    roles: ["admin", "csm", "finance", "viewer"],
  },
  {
    title: "Agreements",
    url: "/agreements",
    icon: FileText,
    testId: "sidebar-agreements",
    roles: ["admin", "csm", "finance", "viewer"],
  },
  {
    title: "Invoice Management",
    url: "/invoice-management",
    icon: FileText,
    testId: "sidebar-invoice-management",
    roles: ["admin", "finance"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    testId: "sidebar-reports",
    roles: ["admin", "csm", "finance", "viewer"],
  },
  {
    title: "AI Insights",
    url: "/insights",
    icon: TrendingUp,
    testId: "sidebar-insights",
    roles: ["admin", "csm", "finance", "viewer"],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  return (
    <Sidebar data-testid="sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border/90">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display text-white">
              Client Management & Billing System
            </h2>
            {/* <p className="text-xs text-white/70">Airline Offer Management</p> */}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter((item) => !user?.role || item.roles.includes(user.role))
                .map((item) => {
                  const isActive =
                    item.url === "/"
                      ? location === "/"
                      : location.startsWith(item.url);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-white/80 hover:bg-white/5 hover:text-white"
                        }
                        data-testid={item.testId}
                      >
                        <Link href={item.url} className="cls-fnt-14">
                          <item.icon className="h-6 w-4" />
                          <span className="text-md">{item.title}</span>{" "}
                          {/* Increased font size */}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-sm font-medium text-white">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate text-white"
              data-testid="user-name"
            >
              admin
            </p>
            <p className="text-xs text-white/60 truncate">Admin</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
          onClick={() => {
            sessionStorage.removeItem("isLoggedIn");
            window.location.href = "/";
          }}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
