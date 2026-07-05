import { useAuth } from "@/hooks/useAuth";
import { getPortalRole } from "./portalUtils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import BudgetView from "@/components/BudgetView";

const BudgetManagement = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const role = getPortalRole(user?.email, (user as any)?.user_metadata?.role);
  const isManager = role === "manager" || role === "admin";

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  if (!user || !isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Access denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Only managers and admins can access this page.</p>
            <Button className="mt-4" onClick={() => navigate("/")}>Go home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <BudgetView />
      </div>
    </div>
  );
};

export default BudgetManagement;
