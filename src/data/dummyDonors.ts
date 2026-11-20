export interface DummyDonor {
  name: string;
  total: number;
  count: number;
  campaign: string;
}

export const DUMMY_DONORS: DummyDonor[] = [
  { name: "Samina Sabir", total: 12500, count: 1, campaign: "Donations" },
  { name: "Pablo", total: 5000, count: 1, campaign: "Donations" },
  { name: "Asif", total: 5000, count: 1, campaign: "Donations" },
  { name: "Farzana", total: 5000, count: 1, campaign: "Donations" },
];
