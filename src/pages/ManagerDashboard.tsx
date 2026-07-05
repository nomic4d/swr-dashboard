import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, LayoutDashboard, CalendarRange, Wallet, Megaphone, Users } from "lucide-react";
import { canAccessManager, getPortalRole } from "./portalUtils";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const role = useMemo(() => getPortalRole(user?.email, (user as any)?.user_metadata?.role), [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  if (!user || !canAccessManager(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Access denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Only managers and admins can access this dashboard.</p>
            <Button className="mt-4" onClick={() => navigate("/")}>Go home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: "Campaigns", value: "12", icon: Megaphone },
    { label: "Events", value: "8", icon: CalendarRange },
    { label: "Budget", value: "$84k", icon: Wallet },
    { label: "Team", value: "24", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manager Dashboard</h1>
            <p className="text-sm text-muted-foreground">Campaigns, budgets, events, and visibility controls in one place.</p>
          </div>
          <Badge variant="secondary">{role}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LayoutDashboard className="h-5 w-5" /> Management shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin")}>Open admin controls</Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/")}>View main portal</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming priorities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Review active campaigns</li>
                <li>Update event schedule</li>
                <li>Approve budget requests</li>
                <li>Monitor staff contributions</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
