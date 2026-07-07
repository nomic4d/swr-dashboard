import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import CalendarView from "@/components/CalendarView";
import StaffView from "@/components/StaffView";
import MessagesView from "@/components/MessagesView";
import GalleryView from "@/components/GalleryView";
import ContributorsView from "@/components/ContributorsView";
import BudgetView from "@/components/BudgetView";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPortalRole } from "@/pages/portalUtils";
import { LogOut, User, UserCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const role = getPortalRole(user?.email, (user as any)?.user_metadata?.role);
  const initials = (user?.email || "U").split("@")[0].slice(0, 2).toUpperCase();

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase.from("profiles").select("id, avatar_url").eq("email", user.email).maybeSingle();
      return data;
    },
    enabled: !!user?.email,
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-3 lg:p-4 overflow-auto">
        <div className="mb-2 flex justify-end">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-full border bg-card/80 px-3 py-2 shadow-sm outline-none transition-colors hover:bg-card">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-foreground">{user.email?.split("@")[0] || "User"}</p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{role}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email?.split("@")[0] || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/staff/${profile?.id || user.id}`)} className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="flex items-center gap-2 rounded-full border bg-card/80 px-4 py-2 shadow-sm text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <User className="h-4 w-4" />
              Sign in
            </Link>
          )}
        </div>
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "calendar" && <CalendarView />}
        {activeTab === "staff" && <ErrorBoundary><StaffView /></ErrorBoundary>}
        {activeTab === "gallery" && <GalleryView />}
        {activeTab === "contributors" && <ContributorsView />}
        {activeTab === "budget" && <BudgetView />}
        {activeTab === "messages" && <MessagesView />}
      </main>
    </div>
  );
};

export default Index;
