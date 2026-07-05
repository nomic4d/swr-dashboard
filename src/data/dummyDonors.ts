export interface DummyDonor {
  name: string;
  total: number;
  count: number;
  campaign: string;
}

export const DUMMY_DONORS: DummyDonor[] = [
  { name: "Ahmed Raza", total: 75000, count: 3, campaign: "Helping the Poor" },
  { name: "Fatima Khan", total: 50000, count: 2, campaign: "Education Drive" },
  { name: "Hassan Ali", total: 35000, count: 1, campaign: "Disaster Relief" },
  { name: "Ayesha Siddiqui", total: 28000, count: 4, campaign: "Health Fund" },
];
