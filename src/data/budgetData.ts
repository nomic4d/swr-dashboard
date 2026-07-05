import { addDays, subDays, subMonths, format } from "date-fns";

export type PortalRole = "admin" | "manager" | "staff" | "member";

export const BUDGET_CATEGORIES = [
  "Trips", "Events", "Campaigns", "CSR Activities", "Staff Welfare",
  "Office Events", "Sports Week", "Training", "Workshops", "Conferences",
  "Emergency Activities", "Community Programs", "Donations", "Volunteer Activities",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const EXPENSE_CATEGORIES = [
  "Transportation", "Hotel", "Food", "Refreshments", "Equipment",
  "Decoration", "Marketing", "Printing", "Entertainment", "Photography",
  "Fuel", "Medical", "Miscellaneous",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_STATUSES = ["Paid", "Pending", "Overdue", "Cancelled", "Refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BUDGET_STATUSES = ["Active", "Frozen", "Closed", "Archived"] as const;
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const FUNDING_SOURCES = ["Internal", "Sponsorship", "Grant", "Donation", "Corporate"] as const;
export type FundingSource = (typeof FUNDING_SOURCES)[number];

export const ACTIVITY_TYPES = [
  "Trip", "Event", "Campaign", "CSR", "Welfare", "OfficeEvent",
  "Sports", "Training", "Workshop", "Conference", "Emergency",
  "Community", "Donation", "Volunteer",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  bankDetails: string;
  remarks: string;
  createdAt: string;
}

export interface BudgetAllocation {
  id: string;
  title: string;
  category: BudgetCategory;
  event: string;
  campaign: string;
  department: string;
  budgetYear: number;
  allocatedAmount: number;
  expectedCost: number;
  currency: string;
  fundingSource: FundingSource;
  budgetOwner: string;
  approvalRequired: boolean;
  priority: Priority;
  description: string;
  remarks: string;
  status: BudgetStatus;
  spent: number;
  managerId: string;
  managerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  budgetId: string;
  title: string;
  category: ExpenseCategory;
  expenseDate: string;
  event: string;
  vendor: string;
  vendorId?: string;
  amount: number;
  paymentMethod: string;
  invoiceNumber: string;
  receiptUrl: string;
  attachmentUrl: string;
  notes: string;
  status: PaymentStatus;
  createdBy: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  expenseId: string;
  budgetId: string;
  fileName: string;
  fileType: "PDF" | "Image" | "Excel" | "Word";
  fileUrl: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface PaymentRecord {
  id: string;
  expenseId: string;
  budgetId: string;
  amount: number;
  status: PaymentStatus;
  paidDate: string | null;
  dueDate: string;
  vendorName: string;
  notes: string;
}

export interface BudgetTimelineEntry {
  id: string;
  budgetId: string;
  action: string;
  performedBy: string;
  performedByRole: PortalRole;
  timestamp: string;
  details: string;
}

export interface AuditLog {
  id: string;
  budgetId: string;
  action: "created" | "edited" | "deleted" | "approved" | "rejected" | "restored" | "locked" | "funds_released" | "expense_added" | "invoice_uploaded";
  performedBy: string;
  performedByRole: PortalRole;
  oldValue: string;
  newValue: string;
  timestamp: string;
  ipAddress: string;
  remarks: string;
}

export interface BudgetNotification {
  id: string;
  budgetId: string;
  budgetTitle: string;
  type: "exceeds_80" | "exceeds_90" | "exhausted" | "expense_added" | "invoice_uploaded" | "approved" | "rejected";
  message: string;
  read: boolean;
  createdAt: string;
}

const now = new Date();

export const DUMMY_VENDORS: Vendor[] = [
  { id: "v1", companyName: "Islamabad Caterers", contactPerson: "Ali Khan", phone: "051-2345678", email: "ali@islamabadcaterers.com", address: "Blue Area, Islamabad", taxNumber: "TX-12345", bankDetails: "HBL - 1234567890", remarks: "Preferred vendor", createdAt: subMonths(now, 6).toISOString() },
  { id: "v2", companyName: "Rawalpindi Transport", contactPerson: "Usman Ahmed", phone: "051-3456789", email: "usman@rawalpinditransport.com", address: "Saddar, Rawalpindi", taxNumber: "TX-23456", bankDetails: "UBL - 2345678901", remarks: "", createdAt: subMonths(now, 5).toISOString() },
  { id: "v3", companyName: "Grand Marquee Events", contactPerson: "Sara Fatima", phone: "051-4567890", email: "sara@grandmarquee.com", address: "F-7, Islamabad", taxNumber: "TX-34567", bankDetails: "MCB - 3456789012", remarks: "Decoration specialist", createdAt: subMonths(now, 4).toISOString() },
  { id: "v4", companyName: "PrintMaster Solutions", contactPerson: "Bilal Hussain", phone: "051-5678901", email: "bilal@printmaster.com", address: "I-8, Islamabad", taxNumber: "TX-45678", bankDetails: "ABL - 4567890123", remarks: "", createdAt: subMonths(now, 3).toISOString() },
  { id: "v5", companyName: "Capture Moments Photography", contactPerson: "Zain Ali", phone: "051-6789012", email: "zain@capturemoments.com", address: "G-9, Islamabad", taxNumber: "TX-56789", bankDetails: "HBL - 5678901234", remarks: "Event photographer", createdAt: subMonths(now, 2).toISOString() },
];

export const DUMMY_BUDGETS: BudgetAllocation[] = [
  { id: "b1", title: "Orange Fest", category: "Events", event: "Orange Fest", campaign: "Annual Events", department: "Events", budgetYear: 2026, allocatedAmount: 80000, expectedCost: 85000, currency: "PKR", fundingSource: "Internal", budgetOwner: "Asif Khan", approvalRequired: true, priority: "High", description: "Annual orange festival celebration", remarks: "Approved", status: "Active", spent: 76500, managerId: "m1", managerName: "Asif Khan", createdAt: subMonths(now, 3).toISOString(), updatedAt: subDays(now, 5).toISOString() },
  { id: "b2", title: "Eid Milan Party", category: "Events", event: "Eid Milan Party (High Tea)", campaign: "Cultural Events", department: "Events", budgetYear: 2026, allocatedAmount: 120000, expectedCost: 125000, currency: "PKR", fundingSource: "Internal", budgetOwner: "Sana Malik", approvalRequired: true, priority: "High", description: "Eid celebration with high tea", remarks: "", status: "Active", spent: 118000, managerId: "m2", managerName: "Sana Malik", createdAt: subMonths(now, 2).toISOString(), updatedAt: subDays(now, 3).toISOString() },
  { id: "b3", title: "Fun Fiesta Office Games", category: "Office Events", event: "Fun Fiesta Office Games Day", campaign: "Team Building", department: "HR", budgetYear: 2026, allocatedAmount: 60000, expectedCost: 65000, currency: "PKR", fundingSource: "Internal", budgetOwner: "Usman Ahmed", approvalRequired: false, priority: "Medium", description: "Office games and team building", remarks: "", status: "Active", spent: 45000, managerId: "m1", managerName: "Asif Khan", createdAt: subMonths(now, 2).toISOString(), updatedAt: subDays(now, 7).toISOString() },
  { id: "b4", title: "Tarbela Lake Trip", category: "Trips", event: "Day Trip to Tarbela Lake", campaign: "Annual Trips", department: "Events", budgetYear: 2026, allocatedAmount: 250000, expectedCost: 275000, currency: "PKR", fundingSource: "Sponsorship", budgetOwner: "Ali Raza", approvalRequired: true, priority: "High", description: "Day trip to Tarbela Lake", remarks: "Partly sponsored", status: "Active", spent: 130500, managerId: "m2", managerName: "Sana Malik", createdAt: subMonths(now, 1).toISOString(), updatedAt: subDays(now, 1).toISOString() },
  { id: "b5", title: "Hill Station Retreat", category: "Trips", event: "One Night Retreat at Hill Station", campaign: "Annual Trips", department: "Events", budgetYear: 2026, allocatedAmount: 1387200, expectedCost: 1500000, currency: "PKR", fundingSource: "Internal", budgetOwner: "Asif Khan", approvalRequired: true, priority: "Critical", description: "One night retreat at hill station for team", remarks: "Awaiting approval", status: "Active", spent: 0, managerId: "m1", managerName: "Asif Khan", createdAt: subDays(now, 10).toISOString(), updatedAt: subDays(now, 10).toISOString() },
  { id: "b6", title: "Mango Fest 2026", category: "Events", event: "Mango Fest", campaign: "Annual Events", department: "Events", budgetYear: 2026, allocatedAmount: 90000, expectedCost: 95000, currency: "PKR", fundingSource: "Donation", budgetOwner: "Sana Malik", approvalRequired: false, priority: "Medium", description: "Annual mango festival", remarks: "", status: "Active", spent: 0, managerId: "m2", managerName: "Sana Malik", createdAt: subDays(now, 15).toISOString(), updatedAt: subDays(now, 15).toISOString() },
  { id: "b7", title: "Sports Week 2026", category: "Sports Week", event: "Sports Week", campaign: "Health & Fitness", department: "Sports", budgetYear: 2026, allocatedAmount: 150000, expectedCost: 160000, currency: "PKR", fundingSource: "Internal", budgetOwner: "Usman Ahmed", approvalRequired: true, priority: "High", description: "Annual sports week activities", remarks: "", status: "Active", spent: 0, managerId: "m1", managerName: "Asif Khan", createdAt: subDays(now, 20).toISOString(), updatedAt: subDays(now, 20).toISOString() },
  { id: "b8", title: "Music Night", category: "Events", event: "Music Night", campaign: "Cultural Events", department: "Events", budgetYear: 2026, allocatedAmount: 180000, expectedCost: 190000, currency: "PKR", fundingSource: "Sponsorship", budgetOwner: "Ali Raza", approvalRequired: true, priority: "Medium", description: "Evening music event", remarks: "Sponsor pending", status: "Active", spent: 0, managerId: "m2", managerName: "Sana Malik", createdAt: subDays(now, 25).toISOString(), updatedAt: subDays(now, 25).toISOString() },
  { id: "b9", title: "Hike & Drink", category: "Trips", event: "Hike and Drink", campaign: "Adventure Activities", department: "Events", budgetYear: 2026, allocatedAmount: 200000, expectedCost: 220000, currency: "PKR", fundingSource: "Internal", budgetOwner: "Asif Khan", approvalRequired: false, priority: "Medium", description: "Hiking trip with refreshments", remarks: "", status: "Active", spent: 0, managerId: "m1", managerName: "Asif Khan", createdAt: subDays(now, 30).toISOString(), updatedAt: subDays(now, 30).toISOString() },
  { id: "b10", title: "Soup Day / Movie Night", category: "Events", event: "Soup Day / Movie Night", campaign: "Cultural Events", department: "Events", budgetYear: 2026, allocatedAmount: 70000, expectedCost: 75000, currency: "PKR", fundingSource: "Internal", budgetOwner: "Sana Malik", approvalRequired: false, priority: "Low", description: "Casual soup and movie evening", remarks: "", status: "Frozen", spent: 0, managerId: "m2", managerName: "Sana Malik", createdAt: subDays(now, 35).toISOString(), updatedAt: subDays(now, 2).toISOString() },
];

export const DUMMY_EXPENSES: Expense[] = [
  { id: "e1", budgetId: "b1", title: "Venue Decoration", category: "Decoration", expenseDate: subDays(now, 30).toISOString(), event: "Orange Fest", vendor: "Grand Marquee Events", vendorId: "v3", amount: 25000, paymentMethod: "Bank Transfer", invoiceNumber: "INV-001", receiptUrl: "", attachmentUrl: "", notes: "Orange themed decoration", status: "Paid", createdBy: "Asif Khan", createdAt: subDays(now, 30).toISOString() },
  { id: "e2", budgetId: "b1", title: "Food & Refreshments", category: "Food", expenseDate: subDays(now, 29).toISOString(), event: "Orange Fest", vendor: "Islamabad Caterers", vendorId: "v1", amount: 35000, paymentMethod: "Cash", invoiceNumber: "INV-002", receiptUrl: "", attachmentUrl: "", notes: "Refreshments for 100 people", status: "Paid", createdBy: "Asif Khan", createdAt: subDays(now, 29).toISOString() },
  { id: "e3", budgetId: "b1", title: "Photography Coverage", category: "Photography", expenseDate: subDays(now, 28).toISOString(), event: "Orange Fest", vendor: "Capture Moments Photography", vendorId: "v5", amount: 8500, paymentMethod: "Bank Transfer", invoiceNumber: "INV-003", receiptUrl: "", attachmentUrl: "", notes: "Event photography", status: "Paid", createdBy: "Asif Khan", createdAt: subDays(now, 28).toISOString() },
  { id: "e4", budgetId: "b1", title: "Printing Materials", category: "Printing", expenseDate: subDays(now, 31).toISOString(), event: "Orange Fest", vendor: "PrintMaster Solutions", vendorId: "v4", amount: 8000, paymentMethod: "Cheque", invoiceNumber: "INV-004", receiptUrl: "", attachmentUrl: "", notes: "Banners and flyers", status: "Paid", createdBy: "Asif Khan", createdAt: subDays(now, 31).toISOString() },
  { id: "e5", budgetId: "b2", title: "High Tea Catering", category: "Food", expenseDate: subDays(now, 15).toISOString(), event: "Eid Milan Party", vendor: "Islamabad Caterers", vendorId: "v1", amount: 65000, paymentMethod: "Bank Transfer", invoiceNumber: "INV-005", receiptUrl: "", attachmentUrl: "", notes: "High tea setup", status: "Paid", createdBy: "Sana Malik", createdAt: subDays(now, 15).toISOString() },
  { id: "e6", budgetId: "b2", title: "Venue Decoration", category: "Decoration", expenseDate: subDays(now, 14).toISOString(), event: "Eid Milan Party", vendor: "Grand Marquee Events", vendorId: "v3", amount: 35000, paymentMethod: "Bank Transfer", invoiceNumber: "INV-006", receiptUrl: "", attachmentUrl: "", notes: "Eid themed decoration", status: "Paid", createdBy: "Sana Malik", createdAt: subDays(now, 14).toISOString() },
  { id: "e7", budgetId: "b2", title: "Entertainment Setup", category: "Entertainment", expenseDate: subDays(now, 13).toISOString(), event: "Eid Milan Party", vendor: "Grand Marquee Events", vendorId: "v3", amount: 18000, paymentMethod: "Cash", invoiceNumber: "INV-007", receiptUrl: "", attachmentUrl: "", notes: "Sound system", status: "Pending", createdBy: "Sana Malik", createdAt: subDays(now, 13).toISOString() },
  { id: "e8", budgetId: "b3", title: "Office Games Equipment", category: "Equipment", expenseDate: subDays(now, 20).toISOString(), event: "Fun Fiesta Office Games Day", vendor: "N/A", amount: 25000, paymentMethod: "Bank Transfer", invoiceNumber: "INV-008", receiptUrl: "", attachmentUrl: "", notes: "Board games and sports equipment", status: "Paid", createdBy: "Usman Ahmed", createdAt: subDays(now, 20).toISOString() },
  { id: "e9", budgetId: "b3", title: "Refreshments", category: "Refreshments", expenseDate: subDays(now, 19).toISOString(), event: "Fun Fiesta Office Games Day", vendor: "Islamabad Caterers", vendorId: "v1", amount: 15000, paymentMethod: "Cash", invoiceNumber: "INV-009", receiptUrl: "", attachmentUrl: "", notes: "Snacks and drinks", status: "Paid", createdBy: "Usman Ahmed", createdAt: subDays(now, 19).toISOString() },
  { id: "e10", budgetId: "b3", title: "Prizes for Winners", category: "Miscellaneous", expenseDate: subDays(now, 18).toISOString(), event: "Fun Fiesta Office Games Day", vendor: "N/A", amount: 5000, paymentMethod: "Cash", invoiceNumber: "INV-010", receiptUrl: "", attachmentUrl: "", notes: "Gift certificates for game winners", status: "Paid", createdBy: "Usman Ahmed", createdAt: subDays(now, 18).toISOString() },
  { id: "e11", budgetId: "b4", title: "Bus Rental", category: "Transportation", expenseDate: subDays(now, 5).toISOString(), event: "Day Trip to Tarbela Lake", vendor: "Rawalpindi Transport", vendorId: "v2", amount: 55000, paymentMethod: "Bank Transfer", invoiceNumber: "INV-011", receiptUrl: "", attachmentUrl: "", notes: "Bus for 50 people", status: "Paid", createdBy: "Ali Raza", createdAt: subDays(now, 5).toISOString() },
  { id: "e12", budgetId: "b4", title: "Food Supplies", category: "Food", expenseDate: subDays(now, 4).toISOString(), event: "Day Trip to Tarbela Lake", vendor: "Islamabad Caterers", vendorId: "v1", amount: 45000, paymentMethod: "Cash", invoiceNumber: "INV-012", receiptUrl: "", attachmentUrl: "", notes: "Packed lunch for trip", status: "Paid", createdBy: "Ali Raza", createdAt: subDays(now, 4).toISOString() },
  { id: "e13", budgetId: "b4", title: "Fuel", category: "Fuel", expenseDate: subDays(now, 4).toISOString(), event: "Day Trip to Tarbela Lake", vendor: "N/A", amount: 15000, paymentMethod: "Cash", invoiceNumber: "INV-013", receiptUrl: "", attachmentUrl: "", notes: "Bus fuel", status: "Pending", createdBy: "Ali Raza", createdAt: subDays(now, 4).toISOString() },
  { id: "e14", budgetId: "b4", title: "First Aid Kit", category: "Medical", expenseDate: subDays(now, 6).toISOString(), event: "Day Trip to Tarbela Lake", vendor: "N/A", amount: 5000, paymentMethod: "Cash", invoiceNumber: "INV-014", receiptUrl: "", attachmentUrl: "", notes: "Emergency medical supplies", status: "Paid", createdBy: "Ali Raza", createdAt: subDays(now, 6).toISOString() },
  { id: "e15", budgetId: "b4", title: "Entry Tickets", category: "Miscellaneous", expenseDate: subDays(now, 3).toISOString(), event: "Day Trip to Tarbela Lake", vendor: "N/A", amount: 10500, paymentMethod: "Cash", invoiceNumber: "INV-015", receiptUrl: "", attachmentUrl: "", notes: "Lake entry fees", status: "Paid", createdBy: "Ali Raza", createdAt: subDays(now, 3).toISOString() },
];

export const DUMMY_INVOICES: Invoice[] = [
  { id: "i1", expenseId: "e1", budgetId: "b1", fileName: "orange_fest_decoration.pdf", fileType: "PDF", fileUrl: "#", fileSize: "2.4 MB", uploadedBy: "Asif Khan", uploadedAt: subDays(now, 30).toISOString() },
  { id: "i2", expenseId: "e2", budgetId: "b1", fileName: "catering_bill.jpg", fileType: "Image", fileUrl: "#", fileSize: "1.8 MB", uploadedBy: "Asif Khan", uploadedAt: subDays(now, 29).toISOString() },
  { id: "i3", expenseId: "e5", budgetId: "b2", fileName: "eid_catering_invoice.pdf", fileType: "PDF", fileUrl: "#", fileSize: "3.1 MB", uploadedBy: "Sana Malik", uploadedAt: subDays(now, 15).toISOString() },
  { id: "i4", expenseId: "e11", budgetId: "b4", fileName: "bus_rental_receipt.png", fileType: "Image", fileUrl: "#", fileSize: "1.2 MB", uploadedBy: "Ali Raza", uploadedAt: subDays(now, 5).toISOString() },
  { id: "i5", expenseId: "e12", budgetId: "b4", fileName: "trip_food_bill.jpg", fileType: "Image", fileUrl: "#", fileSize: "0.9 MB", uploadedBy: "Ali Raza", uploadedAt: subDays(now, 4).toISOString() },
  { id: "i6", expenseId: "e4", budgetId: "b1", fileName: "printing_quote.xlsx", fileType: "Excel", fileUrl: "#", fileSize: "1.5 MB", uploadedBy: "Asif Khan", uploadedAt: subDays(now, 31).toISOString() },
];

export const DUMMY_PAYMENTS: PaymentRecord[] = [
  { id: "p1", expenseId: "e1", budgetId: "b1", amount: 25000, status: "Paid", paidDate: subDays(now, 28).toISOString(), dueDate: subDays(now, 25).toISOString(), vendorName: "Grand Marquee Events", notes: "Paid via bank" },
  { id: "p2", expenseId: "e2", budgetId: "b1", amount: 35000, status: "Paid", paidDate: subDays(now, 27).toISOString(), dueDate: subDays(now, 25).toISOString(), vendorName: "Islamabad Caterers", notes: "" },
  { id: "p3", expenseId: "e7", budgetId: "b2", amount: 18000, status: "Pending", paidDate: null, dueDate: addDays(now, 7).toISOString(), vendorName: "Grand Marquee Events", notes: "Awaiting invoice" },
  { id: "p4", expenseId: "e13", budgetId: "b4", amount: 15000, status: "Pending", paidDate: null, dueDate: addDays(now, 14).toISOString(), vendorName: "N/A", notes: "Fuel reimbursement pending" },
];

export const DUMMY_TIMELINE: BudgetTimelineEntry[] = [
  { id: "t1", budgetId: "b1", action: "Budget Created", performedBy: "Asif Khan", performedByRole: "manager", timestamp: subMonths(now, 4).toISOString(), details: "Orange Fest budget created" },
  { id: "t2", budgetId: "b1", action: "Budget Approved", performedBy: "Admin", performedByRole: "admin", timestamp: subMonths(now, 4).toISOString(), details: "Budget approved by admin" },
  { id: "t3", budgetId: "b1", action: "Funds Released", performedBy: "Asif Khan", performedByRole: "manager", timestamp: subMonths(now, 3).toISOString(), details: "Initial funds released" },
  { id: "t4", budgetId: "b1", action: "Expenses Added", performedBy: "Asif Khan", performedByRole: "manager", timestamp: subDays(now, 31).toISOString(), details: "Decoration expenses added" },
  { id: "t5", budgetId: "b1", action: "Invoices Uploaded", performedBy: "Asif Khan", performedByRole: "manager", timestamp: subDays(now, 30).toISOString(), details: "Vendor invoices uploaded" },
  { id: "t6", budgetId: "b1", action: "Budget Edited", performedBy: "Asif Khan", performedByRole: "manager", timestamp: subDays(now, 5).toISOString(), details: "Budget increased by PKR 5,000" },
  { id: "t7", budgetId: "b5", action: "Budget Created", performedBy: "Asif Khan", performedByRole: "manager", timestamp: subDays(now, 10).toISOString(), details: "Hill station retreat budget created" },
  { id: "t8", budgetId: "b5", action: "Budget Approved", performedBy: "Admin", performedByRole: "admin", timestamp: subDays(now, 8).toISOString(), details: "Approved by admin" },
  { id: "t9", budgetId: "b10", action: "Budget Frozen", performedBy: "Sana Malik", performedByRole: "manager", timestamp: subDays(now, 2).toISOString(), details: "Budget frozen due to pending approval" },
];

export const DUMMY_AUDIT_LOGS: AuditLog[] = [
  { id: "a1", budgetId: "b1", action: "created", performedBy: "Asif Khan", performedByRole: "manager", oldValue: "", newValue: "PKR 80,000 allocated", timestamp: subMonths(now, 4).toISOString(), ipAddress: "192.168.1.100", remarks: "Initial creation" },
  { id: "a2", budgetId: "b1", action: "edited", performedBy: "Asif Khan", performedByRole: "manager", oldValue: "PKR 75,000", newValue: "PKR 80,000", timestamp: subDays(now, 5).toISOString(), ipAddress: "192.168.1.100", remarks: "Increased budget" },
  { id: "a3", budgetId: "b1", action: "approved", performedBy: "Admin", performedByRole: "admin", oldValue: "Pending", newValue: "Approved", timestamp: subMonths(now, 4).toISOString(), ipAddress: "192.168.1.1", remarks: "Final approval" },
  { id: "a4", budgetId: "b5", action: "created", performedBy: "Asif Khan", performedByRole: "manager", oldValue: "", newValue: "PKR 1,387,200 allocated", timestamp: subDays(now, 10).toISOString(), ipAddress: "192.168.1.100", remarks: "New retreat budget" },
  { id: "a5", budgetId: "b5", action: "approved", performedBy: "Admin", performedByRole: "admin", oldValue: "Pending", newValue: "Approved", timestamp: subDays(now, 8).toISOString(), ipAddress: "192.168.1.1", remarks: "Approved for retreat" },
  { id: "a6", budgetId: "b10", action: "edited", performedBy: "Sana Malik", performedByRole: "manager", oldValue: "Active", newValue: "Frozen", timestamp: subDays(now, 2).toISOString(), ipAddress: "192.168.1.101", remarks: "Frozen due to policy change" },
  { id: "a7", budgetId: "b4", action: "funds_released", performedBy: "Asif Khan", performedByRole: "manager", oldValue: "Blocked", newValue: "Released", timestamp: subDays(now, 6).toISOString(), ipAddress: "192.168.1.100", remarks: "Trip funds released" },
  { id: "a8", budgetId: "b1", action: "expense_added", performedBy: "Asif Khan", performedByRole: "manager", oldValue: "", newValue: "PKR 25,000 for decoration", timestamp: subDays(now, 30).toISOString(), ipAddress: "192.168.1.100", remarks: "Decoration expense" },
];

export const DUMMY_NOTIFICATIONS: BudgetNotification[] = [
  { id: "n1", budgetId: "b1", budgetTitle: "Orange Fest", type: "exceeds_80", message: "Orange Fest budget has exceeded 80% usage (95.6%)", read: false, createdAt: subDays(now, 2).toISOString() },
  { id: "n2", budgetId: "b2", budgetTitle: "Eid Milan Party", type: "exceeds_90", message: "Eid Milan Party budget has exceeded 90% usage (98.3%)", read: false, createdAt: subDays(now, 1).toISOString() },
  { id: "n3", budgetId: "b4", budgetTitle: "Day Trip to Tarbela Lake", type: "expense_added", message: "New expense added to Tarbela Lake Trip", read: true, createdAt: subDays(now, 4).toISOString() },
  { id: "n4", budgetId: "b1", budgetTitle: "Orange Fest", type: "invoice_uploaded", message: "Invoice uploaded for Orange Fest", read: true, createdAt: subDays(now, 3).toISOString() },
  { id: "n5", budgetId: "b5", budgetTitle: "One Night Retreat at Hill Station", type: "approved", message: "Hill Station Retreat budget has been approved", read: false, createdAt: subDays(now, 8).toISOString() },
];

export const MONTHLY_SPENDING_DATA = [
  { month: "Jan", budget: 80000, actual: 0 },
  { month: "Feb", budget: 80000, actual: 76500 },
  { month: "Mar", budget: 120000, actual: 118000 },
  { month: "Apr", budget: 60000, actual: 45000 },
  { month: "May", budget: 250000, actual: 130500 },
  { month: "Jun", budget: 1387200, actual: 0 },
  { month: "Jul", budget: 90000, actual: 0 },
  { month: "Aug", budget: 0, actual: 0 },
  { month: "Sep", budget: 150000, actual: 0 },
  { month: "Oct", budget: 180000, actual: 0 },
  { month: "Nov", budget: 200000, actual: 0 },
  { month: "Dec", budget: 70000, actual: 0 },
];

export const DEPARTMENT_SPENDING = [
  { name: "Events", budget: 540000, spent: 194500 },
  { name: "HR", budget: 60000, spent: 45000 },
  { name: "Sports", budget: 150000, spent: 0 },
  { name: "Trips", budget: 1837200, spent: 130500 },
];

export const CATEGORY_BREAKDOWN = [
  { name: "Food", value: 145000 },
  { name: "Decoration", value: 60000 },
  { name: "Transportation", value: 55000 },
  { name: "Equipment", value: 25000 },
  { name: "Entertainment", value: 18000 },
  { name: "Miscellaneous", value: 15500 },
  { name: "Refreshments", value: 15000 },
  { name: "Fuel", value: 15000 },
  { name: "Photography", value: 8500 },
  { name: "Printing", value: 8000 },
  { name: "Medical", value: 5000 },
];

export const QUARTERLY_DATA = [
  { quarter: "Q1 2026", budget: 200000, spent: 194500 },
  { quarter: "Q2 2026", budget: 310000, spent: 175500 },
  { quarter: "Q3 2026", budget: 1627200, spent: 0 },
  { quarter: "Q4 2026", budget: 450000, spent: 0 },
];

export const ANNUAL_DATA = [
  { year: "2023", budget: 1800000, spent: 1650000 },
  { year: "2024", budget: 2100000, spent: 1920000 },
  { year: "2025", budget: 2400000, spent: 2100000 },
  { year: "2026", budget: 2587200, spent: 370000 },
];

export function generateExpenseId(): string {
  return `e${Date.now()}`;
}
export function generateBudgetId(): string {
  return `b${Date.now()}`;
}
export function generateVendorId(): string {
  return `v${Date.now()}`;
}
export function generateInvoiceId(): string {
  return `i${Date.now()}`;
}
export function generatePaymentId(): string {
  return `p${Date.now()}`;
}
export function generateLogId(): string {
  return `a${Date.now()}`;
}

export function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString()}`;
}
