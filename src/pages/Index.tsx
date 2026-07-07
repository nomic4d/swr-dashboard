import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import CalendarView from "@/components/CalendarView";
import StaffView from "@/components/StaffView";
import MessagesView from "@/components/MessagesView";
import GalleryView from "@/components/GalleryView";
import ProfileView from "@/components/ProfileView";
import ContributorsView from "@/components/ContributorsView";
import BudgetView from "@/components/BudgetView";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getPortalRole } from "@/pages/portalUtils";
import { LogOut, User, UserCircle, ArrowLeft } from "lucide-react";
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
  const [galleryHeader, setGalleryHeader] = useState<any>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const role = getPortalRole(user?.email, (user as any)?.user_metadata?.role);
  const initials = (user?.email || "U").split("@")[0].slice(0, 2).toUpperCase();
  const pageTitles: Record<string, string> = { dashboard: "Dashboard", calendar: "Calendar", staff: "Staff", gallery: "Gallery", contributors: "Contributors", budget: "Budget", profile: "Profile", messages: "Messages" };

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
      <main className="flex-1 pl-6 pr-6 pt-2 p-1.5 lg:pl-8 lg:pr-8 lg:pt-2 lg:p-2 overflow-auto">
        <div className="flex items-center justify-between gap-1 min-h-[38px] rounded-lg bg-primary/10 px-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0 shrink-0">
            {activeTab === "gallery" && galleryHeader && galleryHeader.activeAlbum ? (
              <>
                <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 shrink-0 text-xs" onClick={() => { galleryHeader.onBack(); }}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
                <span className="w-4 shrink-0" />
                <span className="text-base font-bold text-primary truncate">{galleryHeader.activeAlbum.title}</span>
                <span className="w-4 shrink-0" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{galleryHeader.albumMediaCount} media</span>
              </>
            ) : (
              <span className="text-base font-bold text-primary">{pageTitles[activeTab] || activeTab}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-[8px] border bg-card/80 px-1.5 py-0.5 shadow-sm outline-none transition-colors hover:bg-card">
                    <Avatar className="h-6 w-6 rounded-[8px]">
                      <AvatarImage src={profile?.avatar_url || ""} className="rounded-[8px]" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-[8px] text-[9px]">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 text-left leading-none hidden sm:block">
                      <p className="text-[10px] font-semibold text-foreground leading-tight">{user.email?.split("@")[0] || "User"}</p>
                      <p className="text-[8px] uppercase tracking-wide text-muted-foreground leading-tight">{role}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal py-1.5">
                    <div className="flex flex-col">
                      <p className="text-xs font-medium leading-none">{user.email?.split("@")[0] || "User"}</p>
                      <p className="text-[10px] leading-none text-muted-foreground mt-0.5">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveTab("profile")} className="cursor-pointer text-xs">
                    <UserCircle className="mr-2 h-3.5 w-3.5" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive text-xs">
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="flex items-center gap-1.5 rounded-[8px] border bg-card/80 px-2 py-1 shadow-sm text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <User className="h-3 w-3" />
                Sign in
              </Link>
            )}
          </div>
        </div>
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "calendar" && <CalendarView />}
        {activeTab === "staff" && <ErrorBoundary><StaffView /></ErrorBoundary>}
        {activeTab === "gallery" && <GalleryView onHeaderChange={setGalleryHeader} />}
        {activeTab === "contributors" && <ContributorsView />}
        {activeTab === "budget" && <BudgetView />}
        {activeTab === "profile" && <ProfileView />}
        {activeTab === "messages" && <MessagesView />}
      </main>
    </div>
  );
};

export default Index;
