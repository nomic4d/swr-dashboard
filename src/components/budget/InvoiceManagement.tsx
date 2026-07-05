import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, File, FileImage, FileSpreadsheet, FileText, Eye } from "lucide-react";
import { Invoice, BudgetAllocation, formatCurrency } from "@/data/budgetData";

interface Props {
  invoices: Invoice[];
  budgets: BudgetAllocation[];
  budgetId?: string;
  onUpload: (invoice: Omit<Invoice, "id">) => void;
  canEdit: boolean;
}

const defaultForm = {
  expenseId: "", budgetId: "", fileName: "", fileType: "PDF" as const,
  fileUrl: "#", fileSize: "0 B", uploadedBy: "",
};

export default function InvoiceManagement({ invoices, budgets, budgetId, onUpload, canEdit }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const filtered = budgetId ? invoices.filter((i) => i.budgetId === budgetId) : invoices;

  const fileIcon = (type: string) => {
    switch (type) {
      case "PDF": return <FileText className="h-4 w-4 text-red-500" />;
      case "Image": return <FileImage className="h-4 w-4 text-blue-500" />;
      case "Excel": return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
      case "Word": return <FileText className="h-4 w-4 text-blue-600" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpload({
      ...form,
      uploadedAt: new Date().toISOString(),
    });
    setOpen(false);
    setForm(defaultForm);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Invoices & Receipts</h3>
        {canEdit && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Upload className="h-4 w-4 mr-1" />Upload Invoice
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl bg-card/50">
          No invoices uploaded yet
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-20">Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="flex items-center gap-2">
                    {fileIcon(inv.fileType)}
                    <span className="font-medium">{inv.fileName}</span>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{inv.fileType}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inv.fileSize}</TableCell>
                  <TableCell className="text-sm">{inv.uploadedBy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inv.uploadedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Invoice</DialogTitle>
            <DialogDescription>Upload PDF, Image, Excel, or Word file.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>File Name</Label>
              <Input value={form.fileName} onChange={(e) => setForm((f) => ({ ...f, fileName: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select value={form.fileType} onValueChange={(v) => setForm((f) => ({ ...f, fileType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Excel">Excel</SelectItem>
                    <SelectItem value="Word">Word</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File Size</Label>
                <Input value={form.fileSize} onChange={(e) => setForm((f) => ({ ...f, fileSize: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Uploaded By</Label>
              <Input value={form.uploadedBy} onChange={(e) => setForm((f) => ({ ...f, uploadedBy: e.target.value }))} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Upload</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
