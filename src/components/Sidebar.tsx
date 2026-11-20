import { useState } from "react";
import { Calendar, Users, MessageSquare, LayoutDashboard, Image, Heart, Wallet, Shield, BarChart3, User, Mountain, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  { id: "retreats", label: "Office Retreats", icon: Mountain },
  { id: "contributors", label: "Contributors", icon: Heart },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "profile", label: "Profile", icon: User },
];

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [rulesOpen, setRulesOpen] = useState(false);
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
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                : "text-white hover:bg-white/10 hover:text-white"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
        {isManager && (
          <Link to="/budgets" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-white hover:bg-white/10 hover:text-white">
            <BarChart3 className="h-4 w-4" />
            Budget Management
          </Link>
        )}
        {isAdmin && (
          <Link to="/admin" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-white hover:bg-white/10 hover:text-white">
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          type="button"
          onClick={() => setRulesOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-white/10 transition-all"
        >
          <ClipboardList className="h-4 w-4" />
          Activity Rules
        </button>
        <p className="text-sm text-white text-center pt-1">SWR Calendar 2026</p>
      </div>
      </div>
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Activity Rules</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-accent/10 p-4">
              <p className="text-sm font-medium">Staff Eligibility</p>
              <p className="mt-1 text-xs text-muted-foreground">Only staff is eligible for events</p>
            </div>
            <div className="rounded-lg bg-warning/10 p-4">
              <p className="text-sm font-medium">Attendance Requirement</p>
              <p className="mt-1 text-xs text-muted-foreground">Attending 70% is mandatory</p>
            </div>
            <div className="rounded-lg bg-success/10 p-4">
              <p className="text-sm font-medium">Motto</p>
              <p className="mt-1 text-xs text-muted-foreground">Cooperation makes life memorable</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
};

export default Sidebar;
