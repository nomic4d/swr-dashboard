import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, Table2, BarChart3, FileText, Building2, CreditCard,
  ClipboardList, ShieldAlert, Activity,
} from "lucide-react";
import { useBudgetData } from "@/hooks/useBudget";
import { PortalRole } from "@/pages/portalUtils";
import { BudgetAllocation, BudgetTimelineEntry } from "@/data/budgetData";
import BudgetDashboard from "./BudgetDashboard";
import BudgetCharts from "./BudgetCharts";
import BudgetTable from "./BudgetTable";
import BudgetAllocationModal from "./BudgetAllocationModal";
import BudgetEventScreen from "./BudgetEventScreen";
import ExpenseManagement from "./ExpenseManagement";
import InvoiceManagement from "./InvoiceManagement";
import VendorManagement from "./VendorManagement";
import PaymentTracking from "./PaymentTracking";
import BudgetTimeline from "./BudgetTimeline";
import AuditLogs from "./AuditLogs";
import BudgetReports from "./BudgetReports";
import BudgetSummary from "./BudgetSummary";

interface Props {
  role: PortalRole;
}

const BudgetManagementView = ({ role }: Props) => {
  const isStaff = role === "staff";
  const isManager = role === "manager" || role === "admin";
  const isAdmin = role === "admin";

  const {
    budgets, expenses, vendors, invoices, payments, timeline, auditLogs, notifications,
    totals, addBudget, updateBudget, deleteBudget,
    addExpense, updateExpense, deleteExpense,
    addVendor, updateVendor, deleteVendor,
    addInvoice, addPayment, updatePayment,
    markNotificationRead,
  } = useBudgetData();

  const { data: managers = [] } = useQuery({
    queryKey: ["budget-managers"],
    queryFn: async () => {
      const { data: staffRows } = await supabase.from("staff").select("id, name, email");
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .neq("email", null);
      const profileList = (profiles ?? []).map((p: any) => ({ id: p.id, name: p.full_name || p.email }));
      const staffList = (staffRows ?? []).map((s: any) => ({ id: s.id, name: s.name }));
      const seen = new Set<string>();
      return [...staffList, ...profileList].filter((m) => {
        if (seen.has(m.name)) return false;
        seen.add(m.name);
        return true;
      });
    },
    staleTime: 60000,
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetAllocation | null>(null);
  const [viewBudget, setViewBudget] = useState<BudgetAllocation | null>(null);
  const [allocModalKey, setAllocModalKey] = useState(0);

  const handleSaveBudget = useCallback(
    (data: any) => {
      if (editBudget) {
        updateBudget(editBudget.id, data);
      } else {
        addBudget({
          ...data,
          id: "",
          spent: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setEditBudget(null);
    },
    [editBudget, addBudget, updateBudget],
  );

  const handleAction = useCallback(
    (action: string, budgetId: string) => {
      const budget = budgets.find((b) => b.id === budgetId);
      if (!budget) return;
      switch (action) {
        case "increase":
          updateBudget(budgetId, { allocatedAmount: budget.allocatedAmount + Math.round(budget.allocatedAmount * 0.1) });
          break;
        case "reduce":
          updateBudget(budgetId, { allocatedAmount: Math.max(0, budget.allocatedAmount - Math.round(budget.allocatedAmount * 0.1)) });
          break;
        case "freeze":
          updateBudget(budgetId, { status: budget.status === "Frozen" ? "Active" : "Frozen" });
          break;
        case "close":
          updateBudget(budgetId, { status: "Closed" });
          break;
        case "duplicate":
          addBudget({
            ...budget,
            id: "",
            title: `${budget.title} (Copy)`,
            spent: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          break;
        case "archive":
          updateBudget(budgetId, { status: "Archived" });
          break;
        case "release_funds":
          break;
      }
    },
    [budgets, updateBudget, addBudget],
  );

  const handleBulkAction = useCallback(
    (action: string, ids: string[]) => {
      ids.forEach((id) => {
        if (action === "delete") deleteBudget(id);
        else if (action === "archive") updateBudget(id, { status: "Archived" });
        else if (action === "approve") updateBudget(id, { approvalRequired: false });
        else if (action === "reject") updateBudget(id, { remarks: "Rejected" });
      });
    },
    [deleteBudget, updateBudget],
  );

  if (isStaff) {
    return <BudgetSummary budgets={budgets} />;
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "budgets", label: "Budgets", icon: Table2 },
    { id: "charts", label: "Charts", icon: BarChart3 },
    { id: "expenses", label: "Expenses", icon: CreditCard },
    { id: "invoices", label: "Invoices", icon: ClipboardList },
    { id: "vendors", label: "Vendors", icon: Building2 },
    { id: "payments", label: "Payments", icon: Activity },
    { id: "timeline", label: "Timeline", icon: FileText },
    ...(isAdmin ? [{ id: "audit", label: "Audit Logs", icon: ShieldAlert }] : []),
  ];

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budget Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? "Full financial control · Admin" : "Manager · Budget control"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BudgetReports budgets={budgets} />
          {isManager && (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-10 px-4 py-2 text-sm font-medium hover:bg-primary/90"
              onClick={() => { setEditBudget(null); setAllocModalKey(k => k + 1); setAllocModalOpen(true); }}
            >
              Allocate Budget
            </button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <BudgetDashboard budgets={budgets} totals={totals} />
        </TabsContent>

        <TabsContent value="budgets" className="mt-6">
          <BudgetTable
            budgets={budgets}
            onView={setViewBudget}
            onEdit={(b) => { setEditBudget(b); setAllocModalKey(k => k + 1); setAllocModalOpen(true); }}
            onAllocateFunds={(b) => handleAction("release_funds", b.id)}
            onAddExpense={(b) => setViewBudget(b)}
            onUploadInvoice={(b) => setViewBudget(b)}
            onDelete={deleteBudget}
            onBulkAction={handleBulkAction}
            canEdit={isManager}
            canDelete={isAdmin}
          />
        </TabsContent>

        <TabsContent value="charts" className="mt-6">
          <BudgetCharts budgets={budgets} />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <ExpenseManagement
            expenses={expenses}
            budgets={budgets}
            onAdd={addExpense}
            onUpdate={updateExpense}
            onDelete={deleteExpense}
            canEdit={isManager}
          />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <InvoiceManagement
            invoices={invoices}
            budgets={budgets}
            onUpload={addInvoice}
            canEdit={isManager}
          />
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          <VendorManagement
            vendors={vendors}
            onAdd={addVendor}
            onUpdate={updateVendor}
            onDelete={deleteVendor}
            canEdit={isManager}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentTracking payments={payments} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <BudgetTimeline timeline={timeline} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="audit" className="mt-6">
            <AuditLogs logs={auditLogs} />
          </TabsContent>
        )}
      </Tabs>

      <BudgetAllocationModal
        key={allocModalKey}
        open={allocModalOpen}
        onClose={() => { setAllocModalOpen(false); setEditBudget(null); }}
        onSave={handleSaveBudget}
        initialData={editBudget}
        managers={managers}
      />

      <BudgetEventScreen
        budget={viewBudget}
        open={!!viewBudget}
        onClose={() => setViewBudget(null)}
        expenses={expenses}
        invoices={invoices}
        timeline={timeline}
        onEdit={(b) => { setViewBudget(null); setEditBudget(b); setAllocModalKey(k => k + 1); setAllocModalOpen(true); }}
        onAddExpense={(b) => setViewBudget(b)}
        onAddExpenseSave={addExpense}
        onUpdateExpense={updateExpense}
        onDeleteExpense={deleteExpense}
        onUploadInvoice={addInvoice}
        canEdit={isManager}
        canDelete={isAdmin}
        onAction={handleAction}
      />
    </div>
  );
};

export default BudgetManagementView;
