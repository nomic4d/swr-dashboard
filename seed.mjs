import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjvxclsrpkvhpdibtjhn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdnhjbHNycGt2aHBkaWJ0amhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzMxNzEsImV4cCI6MjA5ODc0OTE3MX0.GwCwqnsv1HvSqHP3ZwDqSaMVuyIoSAcZWTfEE6xTg8o';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const events = [
  { title: 'Orange Fest', event_date: '2026-02-02', month: 'February', event_number: 1, location: 'Islamabad', description: 'Annual Orange Fest celebration' },
  { title: 'Eid Milan Party (High Tea)', event_date: '2026-03-15', month: 'March', event_number: 2, location: 'Islamabad', description: 'Eid Milan high tea event' },
  { title: 'Fun Fiesta Office Games Day', event_date: '2026-04-28', month: 'April', event_number: 3, location: 'Islamabad', description: 'Office games and fun activities' },
  { title: 'Day Trip to Tarbela Lake', event_date: '2026-05-28', month: 'May', event_number: 4, location: 'Tarbela', description: 'Day trip to Tarbela Lake' },
  { title: 'One Night Retreat at Hill Station & Dinner', event_date: '2026-06-15', month: 'June', event_number: 5, location: 'Hill Station', description: 'Overnight retreat at hill station' },
  { title: 'Mango Fest', event_date: '2026-07-15', month: 'July-August', event_number: 6, location: 'Islamabad', description: 'Mango festival celebration' },
  { title: 'Sports Week', event_date: '2026-09-12', month: 'September', event_number: 7, location: 'Islamabad', description: 'Annual sports week' },
  { title: 'Music Night', event_date: '2026-10-17', month: 'October', event_number: 8, location: 'Islamabad', description: 'Music night performance' },
  { title: 'Hike and Drink', event_date: '2026-11-14', month: 'November', event_number: 9, location: 'Margalla Hills', description: 'Hiking trip to Margalla Hills' },
  { title: 'Soup Day / Movie Night', event_date: '2026-12-12', month: 'December', event_number: 10, location: 'Islamabad', description: 'Soup day and movie night' },
];

const staff = [
  { name: 'Ahmad Khan', phone_number: '0300-1234567', email: 'ahmad@swr.com', department: 'Management', is_active: true },
  { name: 'Sara Ali', phone_number: '0300-2345678', email: 'sara@swr.com', department: 'HR', is_active: true },
  { name: 'Usman Tariq', phone_number: '0300-3456789', email: 'usman@swr.com', department: 'Finance', is_active: true },
  { name: 'Fatima Noor', phone_number: '0300-4567890', email: 'fatima@swr.com', department: 'Operations', is_active: true },
  { name: 'Bilal Ahmed', phone_number: '0300-5678901', email: 'bilal@swr.com', department: 'IT', is_active: true },
  { name: 'Zainab Hussain', phone_number: '0300-6789012', email: 'zainab@swr.com', department: 'Marketing', is_active: true },
  { name: 'Omar Farooq', phone_number: '0300-7890123', email: 'omar@swr.com', department: 'Management', is_active: true },
  { name: 'Hira Batool', phone_number: '0300-8901234', email: 'hira@swr.com', department: 'HR', is_active: false },
];

const campaigns = [
  { title: 'Flood Relief Campaign', description: 'Support for flood-affected families', category: 'Emergency Response', goal_amount: 500000, raised_amount: 150000, status: 'active' },
  { title: 'Food Distribution Drive', description: 'Distributing food packages to communities in need', category: 'Community Service', goal_amount: 200000, raised_amount: 80000, status: 'active' },
  { title: 'Medical Camp', description: 'Free medical checkup camp for underprivileged', category: 'Healthcare', goal_amount: 300000, raised_amount: 120000, status: 'active' },
  { title: 'Tree Plantation Drive', description: 'Planting trees for a greener environment', category: 'Environment', goal_amount: 100000, raised_amount: 45000, status: 'active' },
];

async function seed() {
  console.log('Seeding events...');
  const { data: insertedEvents, error: evErr } = await supabase.from('events').insert(events).select();
  if (evErr) { console.error('Events error:', evErr); return; }
  console.log(`  Inserted ${insertedEvents.length} events`);

  console.log('Seeding staff...');
  const { data: insertedStaff, error: stErr } = await supabase.from('staff').insert(staff).select();
  if (stErr) { console.error('Staff error:', stErr); return; }
  console.log(`  Inserted ${insertedStaff.length} staff members`);

  console.log('Seeding campaigns (skipped - requires auth RLS)...');

  console.log('Done!');
}

seed();
