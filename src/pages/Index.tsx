import { useState, useEffect } from "react";
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
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getPortalRole, canAccessManager } from "@/pages/portalUtils";
import { LogOut, User, UserCircle, ArrowLeft, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showPasswordReminder, setShowPasswordReminder] = useState(false);
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const role = getPortalRole(user?.email, (user as any)?.user_metadata?.role);
  const initials = (user?.email || "U").split("@")[0].slice(0, 2).toUpperCase();
  const pageTitles: Record<string, string> = { dashboard: "Dashboard", calendar: "Calendar", staff: "Staff", gallery: "Gallery", contributors: "Contributors", budget: "Budget", profile: "Profile", messages: "Messages" };

  useEffect(() => {
    if (user && !localStorage.getItem("pw-reminder-dismissed")) {
      setShowPasswordReminder(true);
    }
  }, [user]);

  const dismissReminder = (dontRemindAgain: boolean) => {
    setShowPasswordReminder(false);
    if (dontRemindAgain) {
      localStorage.setItem("pw-reminder-dismissed", "1");
    }
  };

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase.from("profiles").select("id, avatar_url").eq("email", user.email).maybeSingle();
      return data;
    },
    enabled: !!user?.email,
  });

  const handleTabChange = (tab: string) => {
    if ((tab === "staff" || tab === "budget") && !canAccessManager(role)) return;
    setActiveTab(tab);
    setMobileMenu(false);
  };

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
      {mobileMenu && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileMenu(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-1/2 max-w-xs h-full" onClick={(e) => e.stopPropagation()}>
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
          </div>
        </div>
      )}
      <main className="flex-1 min-w-0 pl-6 pr-6 pt-2 p-1.5 lg:pl-8 lg:pr-8 lg:pt-2 lg:p-2 overflow-auto">
        <div className="flex items-center justify-between gap-1 min-h-[38px] rounded-lg bg-primary/10 px-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0 shrink-0">
            <button className="lg:hidden p-1 mr-1 -ml-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
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
        {activeTab === "staff" && canAccessManager(role) && <ErrorBoundary><StaffView /></ErrorBoundary>}
        {activeTab === "gallery" && <GalleryView onHeaderChange={setGalleryHeader} />}
        {activeTab === "contributors" && <ContributorsView />}
        {activeTab === "budget" && canAccessManager(role) && <BudgetView />}
        {activeTab === "profile" && <ProfileView />}
        {activeTab === "messages" && <MessagesView />}
      </main>
      <Dialog open={showPasswordReminder} onOpenChange={(open) => { if (!open) dismissReminder(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Your Password</DialogTitle>
            <DialogDescription>
              Please update your password by navigating to the top right of your profile and choosing your own password.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" className="rounded" onClick={(e) => {
              const checked = (e.target as HTMLInputElement).checked;
              dismissReminder(checked);
            }} />
            I already updated my password &mdash; don't remind me again
          </label>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
