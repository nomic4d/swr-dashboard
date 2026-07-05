import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle, FileUp, DollarSign, X } from "lucide-react";
import { BudgetNotification } from "@/data/budgetData";

interface Props {
  notifications: BudgetNotification[];
  onMarkRead: (id: string) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  exceeds_80: AlertTriangle,
  exceeds_90: AlertTriangle,
  exhausted: AlertTriangle,
  expense_added: DollarSign,
  invoice_uploaded: FileUp,
  approved: CheckCircle,
  rejected: CheckCircle,
};

const typeColors: Record<string, string> = {
  exceeds_80: "text-orange-600 bg-orange-100",
  exceeds_90: "text-red-600 bg-red-100",
  exhausted: "text-red-600 bg-red-100",
  expense_added: "text-blue-600 bg-blue-100",
  invoice_uploaded: "text-purple-600 bg-purple-100",
  approved: "text-emerald-600 bg-emerald-100",
  rejected: "text-rose-600 bg-rose-100",
};

const BudgetNotifications = ({ notifications, onMarkRead }: Props) => {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <Button variant="outline" size="sm" className="relative" onClick={() => setOpen(!open)}>
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
            {unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border bg-card shadow-xl">
            <div className="p-3 border-b flex items-center justify-between">
              <h4 className="font-semibold text-sm">Notifications</h4>
              <span className="text-xs text-muted-foreground">{unread} unread</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type] || Bell;
                  const color = typeColors[n.type] || "text-slate-600 bg-slate-100";
                  return (
                    <div
                      key={n.id}
                      className={`p-3 border-b last:border-b-0 hover:bg-muted/50 transition cursor-pointer ${!n.read ? "bg-muted/30" : ""}`}
                      onClick={() => onMarkRead(n.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`p-1.5 rounded-full ${color} shrink-0`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{n.budgetTitle}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BudgetNotifications;
