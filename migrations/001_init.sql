create table if not exists students (
  id text primary key,
  name text not null,
  phone text not null default '',
  email text not null default '',
  monthly_amount_cents integer not null check (monthly_amount_cents >= 0),
  active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id text primary key,
  student_id text not null references students (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  reference_month text not null,
  paid_at date not null default current_date,
  notes text not null default '',
  recorded_by_sub text not null default '',
  recorded_by_name text not null default '',
  created_at timestamptz not null default now(),
  unique (student_id, reference_month)
);

create index if not exists payments_reference_month_idx on payments (reference_month);
create index if not exists students_active_name_idx on students (active, name);
