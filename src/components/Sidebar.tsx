import { Calendar, Users, MessageSquare, LayoutDashboard, Image, Heart, Wallet, Shield, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { isAdminUser } from "@/pages/adminUtils";
import { getPortalRole } from "@/pages/portalUtils";
import swrLogo from "@/assets/swrlogo.png";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const allNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "staff", label: "Staff", icon: Users },
  { id: "gallery", label: "Gallery", icon: Image },
  { id: "contributors", label: "Contributors", icon: Heart },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "profile", label: "Profile", icon: User },
];

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user?.email, user?.user_metadata?.role);
  const role = getPortalRole(user?.email, user?.user_metadata?.role);
  const isManager = role === "manager" || role === "admin";
  const navItems = allNavItems.filter((item) => (item.id !== "staff" && item.id !== "budget") || isManager);
  return (
    <aside className="w-56 min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://images.pexels.com/photos/33801846/pexels-photo-33801846.jpeg')" }} />
      <div className="absolute inset-0 backdrop-blur-md bg-black/30" />
      <div className="relative z-10 flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="pb-3">
          <img src={swrLogo} alt="SWR" className="h-10 w-auto brightness-0 invert" />
        </div>
        <NotificationBell />
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
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
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/40 text-center">SWR Calendar 2026</p>
      </div>
      </div>
    </aside>
  );
};

export default Sidebar;
