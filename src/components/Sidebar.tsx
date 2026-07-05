import { Calendar, Users, MessageSquare, LayoutDashboard, Image, Heart, Wallet, Shield, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { isAdminUser } from "@/pages/adminUtils";
import { getPortalRole } from "@/pages/portalUtils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "staff", label: "Staff", icon: Users },
  { id: "gallery", label: "Gallery", icon: Image },
  { id: "contributors", label: "Contributors", icon: Heart },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "messages", label: "Messages", icon: MessageSquare },
];

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user?.email, user?.user_metadata?.role);
  const role = getPortalRole(user?.email, user?.user_metadata?.role);
  const isManager = role === "manager" || role === "admin";
  return (
    <aside className="w-64 gradient-navy min-h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sidebar-foreground tracking-tight">
            SWR <span className="text-gradient">PRM</span>
          </h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">ADB PRM · Islamabad</p>
        </div>
        <NotificationBell />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
              activeTab === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
        {isManager && (
          <Link to="/budgets" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <BarChart3 className="h-4 w-4" />
            Budget Management
          </Link>
        )}
        {isAdmin && (
          <Link to="/admin" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40 text-center">SWR Calendar 2026</p>
      </div>
    </aside>
  );
};

export default Sidebar;
