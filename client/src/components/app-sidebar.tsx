import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
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
    icon: DollarSign,
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
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    testId: "sidebar-reports",
    roles: ["admin", "finance", "viewer"],
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
  const { user } = useAuth();

  return (
    <Sidebar data-testid="sidebar">
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display">Infiniti CMS</h2>
            <p className="text-xs text-muted-foreground">Client Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter((item) => !user?.role || item.roles.includes(user.role))
                .map((item) => {
                  const isActive = item.url === "/" 
                    ? location === "/" 
                    : location.startsWith(item.url);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={isActive ? "bg-sidebar-accent" : ""}
                        data-testid={item.testId}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="sidebar-notifications">
                  <Link href="/notifications">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild data-testid="sidebar-users">
                    <Link href="/users">
                      <Users className="h-4 w-4" />
                      <span>Users & Roles</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {(user?.role === "admin" || user?.role === "manager") && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild data-testid="sidebar-settings">
                    <Link href="/settings">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              AD
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="user-name">
              Admin User
            </p>
            <p className="text-xs text-muted-foreground truncate">admin@infiniti.com</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
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
