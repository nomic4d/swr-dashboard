// Static dummy SWR PRM 2026 budget — values in PKR
export interface BudgetItem {
  event_number: number;
  title: string;
  category: "Trip" | "Event" | "Activity";
  allocated: number;
  consumed: number;
}

export const BUDGET: BudgetItem[] = [
  { event_number: 1, title: "Orange Fest", category: "Event", allocated: 80000, consumed: 76500 },
  { event_number: 2, title: "Eid Milan Party (High Tea)", category: "Event", allocated: 120000, consumed: 118000 },
  { event_number: 3, title: "Fun Fiesta Office Games Day", category: "Activity", allocated: 60000, consumed: 45000 },
  { event_number: 4, title: "Day Trip to Tarbela Lake", category: "Trip", allocated: 250000, consumed: 130500 },
  { event_number: 5, title: "One Night Retreat at Hill Station", category: "Trip", allocated: 1387200, consumed: 0 },
  { event_number: 6, title: "Mango Fest", category: "Event", allocated: 90000, consumed: 0 },
  { event_number: 7, title: "Sports Week", category: "Activity", allocated: 150000, consumed: 0 },
  { event_number: 8, title: "Music Night", category: "Event", allocated: 180000, consumed: 0 },
  { event_number: 9, title: "Hike and Drink", category: "Trip", allocated: 200000, consumed: 0 },
  { event_number: 10, title: "Soup Day / Movie Night", category: "Event", allocated: 70000, consumed: 0 },
];

export const budgetTotals = () => {
  const allocated = BUDGET.reduce((s, b) => s + b.allocated, 0);
  const consumed = BUDGET.reduce((s, b) => s + b.consumed, 0);
  return { allocated, consumed, remaining: allocated - consumed, pct: (consumed / allocated) * 100 };
};
