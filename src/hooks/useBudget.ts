import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BudgetAllocation, Expense, Vendor, Invoice, PaymentRecord, BudgetTimelineEntry,
  AuditLog, BudgetNotification,
  MONTHLY_SPENDING_DATA, DEPARTMENT_SPENDING, CATEGORY_BREAKDOWN,
  QUARTERLY_DATA, ANNUAL_DATA,
} from "@/data/budgetData";

const mapBudget = (b: any): BudgetAllocation => ({
  id: b.id,
  title: b.title,
  category: b.budget_categories?.name || "Events",
  event: "",
  campaign: "",
  department: b.department || "",
  budgetYear: b.budget_year || new Date().getFullYear(),
  allocatedAmount: Number(b.allocated_amount) || 0,
  expectedCost: Number(b.expected_cost) || 0,
  currency: b.currency || "PKR",
  fundingSource: b.funding_source || "Internal",
  budgetOwner: b.budget_owner || "",
  approvalRequired: b.approval_required ?? true,
  priority: (b.priority || "medium").charAt(0).toUpperCase() + (b.priority || "medium").slice(1),
  description: b.description || "",
  remarks: b.remarks || "",
  status: b.status === "draft" ? "Active" : b.status === "approved" ? "Active" : b.status.charAt(0).toUpperCase() + b.status.slice(1),
  spent: Number(b.spent_amount) || 0,
  managerId: "",
  managerName: b.budget_owner || "",
  createdAt: b.created_at,
  updatedAt: b.updated_at || b.created_at,
});

const mapExpense = (e: any, budgets: any[]): Expense => ({
  id: e.id,
  budgetId: e.budget_id,
  title: e.title,
  category: e.category || "Miscellaneous",
  expenseDate: e.expense_date || e.created_at,
  event: "",
  vendor: e.vendors?.company_name || "",
  vendorId: e.vendor_id || "",
  amount: Number(e.amount) || 0,
  paymentMethod: e.payment_method || "",
  invoiceNumber: e.invoice_number || "",
  receiptUrl: e.receipt_url || "",
  attachmentUrl: e.attachment_url || "",
  notes: e.notes || "",
  status: e.status === "paid" ? "Paid" : e.status === "pending" ? "Pending" : e.status === "cancelled" ? "Cancelled" : e.status === "refunded" ? "Refunded" : "Pending",
  createdBy: e.created_by || "",
  createdAt: e.created_at,
});

const mapVendor = (v: any): Vendor => ({
  id: v.id,
  companyName: v.company_name,
  contactPerson: v.contact_person || "",
  phone: v.phone || "",
  email: v.email || "",
  address: v.address || "",
  taxNumber: v.tax_number || "",
  bankDetails: v.bank_details || "",
  remarks: v.remarks || "",
  createdAt: v.created_at,
});

export function useBudgetData() {
  const queryClient = useQueryClient();

  // Fetch budgets with category name
  const budgetsQuery = useQuery({
    queryKey: ["budgets-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*, budget_categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapBudget);
    },
  });

  // Fetch expenses with vendor name
  const expensesQuery = useQuery({
    queryKey: ["expenses-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, vendors(company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((e) => mapExpense(e, (data as any[]) || []));
    },
  });

  const vendorsQuery = useQuery({
    queryKey: ["vendors-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("company_name");
      if (error) throw error;
      return (data ?? []).map(mapVendor);
    },
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoices-full"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []).map((i: any) => ({
        id: i.id,
        expenseId: i.expense_id || "",
        budgetId: "",
        fileName: i.invoice_number || "invoice",
        fileType: (i.file_type || "PDF") as "PDF" | "Image" | "Excel" | "Word",
        fileUrl: i.file_url || "",
        fileSize: "",
        uploadedBy: "",
        uploadedAt: i.created_at,
      })) as Invoice[];
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments-full"],
    queryFn: async () => {
      const { data: expenses } = await supabase
        .from("expenses")
        .select("id, amount, status, created_at, vendor_id, notes");
      return ((expenses ?? []).filter((e: any) => e.status === "paid" || e.status === "pending" || e.status === "overdue")).map((e: any) => ({
        id: `p-${e.id}`,
        expenseId: e.id,
        budgetId: "",
        amount: Number(e.amount) || 0,
        status: e.status === "paid" ? "Paid" : e.status === "pending" ? "Pending" : "Overdue",
        paidDate: e.status === "paid" ? e.created_at : null,
        dueDate: e.created_at,
        vendorName: "",
        notes: e.notes || "",
      })) as PaymentRecord[];
    },
  });

  const timelineQuery = useQuery({
    queryKey: ["timeline-full"],
    queryFn: async () => {
      const { data: auditLogs } = await supabase
        .from("budget_audit_logs")
        .select("*")
        .order("created_at", { ascending: false });
      return ((auditLogs ?? []).map((l: any) => ({
        id: l.id,
        budgetId: l.budget_id || "",
        action: l.action,
        performedBy: l.performed_by || "System",
        performedByRole: "manager" as const,
        timestamp: l.created_at,
        details: `${l.field_name ? l.field_name + ": " : ""}${l.old_value || ""} → ${l.new_value || ""}`,
      }))) as BudgetTimelineEntry[];
    },
  });

  const auditLogsQuery = useQuery({
    queryKey: ["auditLogs-full"],
    queryFn: async () => {
      const { data } = await supabase
        .from("budget_audit_logs")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []).map((l: any) => ({
        id: l.id,
        budgetId: l.budget_id || "",
        action: l.action,
        performedBy: l.performed_by || "System",
        performedByRole: "manager" as const,
        oldValue: l.old_value || "",
        newValue: l.new_value || "",
        timestamp: l.created_at,
        ipAddress: l.ip_address || "",
        remarks: l.remarks || "",
      })) as AuditLog[];
    },
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications-full"],
    queryFn: async () => {
      const { data } = await supabase
        .from("budget_notifications")
        .select("*, budgets(title)")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []).map((n: any) => ({
        id: n.id,
        budgetId: n.budget_id || "",
        budgetTitle: n.budgets?.title || "",
        type: (n.type === "warning" ? "exceeds_80" : n.type === "error" ? "exhausted" : n.type === "success" ? "approved" : "expense_added") as any,
        message: n.message,
        read: n.read || false,
        createdAt: n.created_at,
      })) as BudgetNotification[];
    },
  });

  const budgets = budgetsQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];
  const vendors = vendorsQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const timeline = timelineQuery.data ?? [];
  const auditLogs = auditLogsQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];

  const totals = useMemo(() => {
    const totalAllocated = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const pctUsed = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
    const activeBudgets = budgets.filter((b) => b.status === "Active").length;
    const pendingApproval = budgets.filter((b) => b.approvalRequired).length;
    const totalEvents = new Set(budgets.map((b) => b.event)).size;
    const totalVendors = vendors.length;
    const paidInvoices = payments.filter((p) => p.status === "Paid").length;
    const pendingPayments = payments.filter((p) => p.status === "Pending" || p.status === "Overdue").length;
    return { totalAllocated, totalSpent, totalRemaining, pctUsed, activeBudgets, pendingApproval, totalEvents, totalVendors, paidInvoices, pendingPayments };
  }, [budgets, vendors, payments]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["budgets-full"] });
    queryClient.invalidateQueries({ queryKey: ["expenses-full"] });
    queryClient.invalidateQueries({ queryKey: ["vendors-full"] });
    queryClient.invalidateQueries({ queryKey: ["invoices-full"] });
    queryClient.invalidateQueries({ queryKey: ["payments-full"] });
    queryClient.invalidateQueries({ queryKey: ["timeline-full"] });
    queryClient.invalidateQueries({ queryKey: ["auditLogs-full"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-full"] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["vendors"] });
    queryClient.invalidateQueries({ queryKey: ["budget_categories"] });
  }, [queryClient]);

  const resolveCategoryId = async (category: string): Promise<string | null> => {
    if (!category) return null;
    const { data } = await supabase.from("budget_categories").select("id").eq("name", category).maybeSingle();
    return data?.id || null;
  };

  const addBudget = useMutation({
    mutationFn: async (budget: any) => {
      let category_id = budget.category_id || null;
      if (!category_id && budget.category) {
        category_id = await resolveCategoryId(budget.category);
      }
      const { error } = await supabase.from("budgets").insert({
        title: budget.title,
        category_id,
        event_id: budget.event_id || null,
        campaign_id: budget.campaign_id || null,
        department: budget.department || null,
        budget_year: budget.budgetYear || budget.budget_year || new Date().getFullYear(),
        allocated_amount: Number(budget.allocatedAmount ?? budget.allocated_amount ?? 0),
        expected_cost: Number(budget.expectedCost ?? budget.expected_cost ?? 0),
        currency: budget.currency || "PKR",
        funding_source: budget.fundingSource || budget.funding_source || null,
        budget_owner: budget.budgetOwner || budget.budget_owner || null,
        priority: (budget.priority || "medium").toLowerCase(),
        status: "draft",
        approval_required: budget.approvalRequired ?? budget.approval_required ?? true,
        description: budget.description || null,
        remarks: budget.remarks || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Budget created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const payload: any = {};
      if (data.title) payload.title = data.title;
      if (data.category_id || data.category) {
        payload.category_id = data.category_id || await resolveCategoryId(data.category);
      }
      if (data.allocatedAmount !== undefined) payload.allocated_amount = Number(data.allocatedAmount);
      if (data.expectedCost !== undefined) payload.expected_cost = Number(data.expectedCost);
      if (data.allocated_amount !== undefined) payload.allocated_amount = Number(data.allocated_amount);
      if (data.expected_cost !== undefined) payload.expected_cost = Number(data.expected_cost);
      if (data.department !== undefined) payload.department = data.department;
      if (data.status) payload.status = (data.status === "Active" || data.status === "active" ? "approved" : data.status.toLowerCase());
      if (data.fundingSource !== undefined) payload.funding_source = data.fundingSource;
      if (data.funding_source !== undefined) payload.funding_source = data.funding_source;
      if (data.description !== undefined) payload.description = data.description;
      if (data.remarks !== undefined) payload.remarks = data.remarks;
      if (data.priority) payload.priority = data.priority.toLowerCase();
      if (data.spent !== undefined) payload.spent_amount = Number(data.spent);
      if (data.spent_amount !== undefined) payload.spent_amount = Number(data.spent_amount);

      const { error } = await supabase.from("budgets").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Budget updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Budget deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addExpense = useMutation({
    mutationFn: async (expense: any) => {
      const { error } = await supabase.from("expenses").insert({
        budget_id: expense.budgetId,
        title: expense.title,
        category: expense.category || "Miscellaneous",
        expense_date: expense.expenseDate || new Date().toISOString().split("T")[0],
        vendor_id: expense.vendorId || null,
        amount: Number(expense.amount) || 0,
        payment_method: expense.paymentMethod || "Cash",
        invoice_number: expense.invoiceNumber || null,
        notes: expense.notes || null,
        status: "pending",
        created_by: expense.createdBy || "",
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Expense added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateExpenseFn = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const payload: any = {};
      if (updates.title) payload.title = updates.title;
      if (updates.category) payload.category = updates.category;
      if (updates.amount !== undefined) payload.amount = Number(updates.amount);
      if (updates.status) payload.status = updates.status.toLowerCase();
      if (updates.paymentMethod) payload.payment_method = updates.paymentMethod;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      const { error } = await supabase.from("expenses").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Expense updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteExpenseFn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Expense deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addVendor = useMutation({
    mutationFn: async (vendor: any) => {
      const { error } = await supabase.from("vendors").insert({
        company_name: vendor.companyName,
        contact_person: vendor.contactPerson || null,
        phone: vendor.phone || null,
        email: vendor.email || null,
        address: vendor.address || null,
        tax_number: vendor.taxNumber || null,
        bank_details: vendor.bankDetails || null,
        remarks: vendor.remarks || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Vendor added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateVendor = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const payload: any = {};
      if (updates.companyName) payload.company_name = updates.companyName;
      if (updates.contactPerson !== undefined) payload.contact_person = updates.contactPerson;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.address !== undefined) payload.address = updates.address;
      const { error } = await supabase.from("vendors").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Vendor updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteVendor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Vendor deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addInvoice = useMutation({
    mutationFn: async (inv: any) => {
      const { error } = await supabase.from("invoices").insert({
        expense_id: inv.expenseId || null,
        vendor_id: inv.vendorId || null,
        invoice_number: inv.invoiceNumber || null,
        amount: Number(inv.amount) || 0,
        file_url: inv.fileUrl || null,
        file_type: inv.fileType || "PDF",
        notes: inv.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Invoice uploaded"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addPayment = useMutation({
    mutationFn: async (payment: any) => {
      const { error } = await supabase.from("expenses").update({
        status: "paid",
        payment_method: payment.paymentMethod || "Bank Transfer",
      }).eq("id", payment.expenseId);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Payment recorded"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from("expenses").update({
        status: updates.status?.toLowerCase(),
      }).eq("id", id.replace("p-", ""));
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Payment updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const markNotificationRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budget_notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
    onError: () => {},
  });

  return {
    budgets: budgetsQuery.data ?? [],
    expenses: expensesQuery.data ?? [],
    vendors: vendorsQuery.data ?? [],
    invoices: invoicesQuery.data ?? [],
    payments: paymentsQuery.data ?? [],
    timeline: timelineQuery.data ?? [],
    auditLogs: auditLogsQuery.data ?? [],
    notifications: notificationsQuery.data ?? [],
    isLoading: budgetsQuery.isLoading,
    totals,
    addBudget: (data: any) => addBudget.mutate(data),
    updateBudget: (id: string, data: any) => updateBudget.mutate({ id, ...data }),
    deleteBudget: (id: string) => deleteBudget.mutate(id),
    addExpense: (data: any) => addExpense.mutate(data),
    updateExpense: (id: string, data: any) => updateExpenseFn.mutate({ id, ...data }),
    deleteExpense: (id: string) => deleteExpenseFn.mutate(id),
    addVendor: (data: any) => addVendor.mutate(data),
    updateVendor: (id: string, data: any) => updateVendor.mutate({ id, ...data }),
    deleteVendor: (id: string) => deleteVendor.mutate(id),
    addInvoice: (data: any) => addInvoice.mutate(data),
    addPayment: (data: any) => addPayment.mutate(data),
    updatePayment: (id: string, data: any) => updatePayment.mutate({ id, ...data }),
    markNotificationRead: (id: string) => markNotificationRead.mutate(id),
  };
}
