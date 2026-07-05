import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Vendor } from "@/data/budgetData";

interface Props {
  vendors: Vendor[];
  onAdd: (vendor: Omit<Vendor, "id" | "createdAt">) => void;
  onUpdate: (id: string, updates: Partial<Vendor>) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

type VendorForm = Omit<Vendor, "id" | "createdAt">;
const defaultForm: VendorForm = {
  companyName: "", contactPerson: "", phone: "", email: "",
  address: "", taxNumber: "", bankDetails: "", remarks: "",
};

export default function VendorManagement({ vendors, onAdd, onUpdate, onDelete, canEdit }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<VendorForm>(defaultForm);

  const openAdd = () => { setEditing(null); setForm(defaultForm); setOpen(true); };
  const openEdit = (v: Vendor) => { setEditing(v); setForm({ companyName: v.companyName, contactPerson: v.contactPerson, phone: v.phone, email: v.email, address: v.address, taxNumber: v.taxNumber, bankDetails: v.bankDetails, remarks: v.remarks }); setOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) onUpdate(editing.id, form);
    else onAdd(form);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Vendors</h3>
        {canEdit && (
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Vendor</Button>
        )}
      </div>

      {vendors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl bg-card/50">No vendors added</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <div key={v.id} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700"><Building2 className="h-4 w-4" /></div>
                  <div>
                    <p className="font-medium text-sm">{v.companyName}</p>
                    <p className="text-xs text-muted-foreground">{v.contactPerson}</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(v.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{v.phone} · {v.email}</p>
                <p>{v.address}</p>
                {v.taxNumber && <p>Tax: {v.taxNumber}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
            <DialogDescription>Enter vendor details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tax Number</Label>
                <Input value={form.taxNumber} onChange={(e) => setForm((f) => ({ ...f, taxNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Bank Details</Label>
                <Input value={form.bankDetails} onChange={(e) => setForm((f) => ({ ...f, bankDetails: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Update" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
