import { currentReferenceMonth } from "./format";
import { isUsingSampleDatabase, newId, sql } from "./db";

export type Student = {
  id: string;
  name: string;
  phone: string;
  email: string;
  monthly_amount_cents: number;
  active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  student_id: string;
  amount_cents: number;
  reference_month: string;
  paid_at: string;
  notes: string;
  recorded_by_sub: string;
  recorded_by_name: string;
  created_at: string;
};

export type StudentWithStatus = Student & {
  status: "adimplente" | "inadimplente";
  payment: Payment | null;
};

let seeded = false;

async function ensureSampleData(): Promise<void> {
  if (!isUsingSampleDatabase() || seeded) return;
  seeded = true;
  const existing = await sql<{ count: string }>(
    "select count(*)::text as count from students",
  );
  if (Number(existing[0]?.count ?? 0) > 0) return;

  const month = currentReferenceMonth();
  const samples: Array<{
    name: string;
    phone: string;
    email: string;
    amount: number;
    paid: boolean;
  }> = [
    {
      name: "Ana Trail",
      phone: "(11) 98888-1001",
      email: "ana@exemplo.com",
      amount: 18000,
      paid: true,
    },
    {
      name: "Bruno Montanha",
      phone: "(11) 97777-2002",
      email: "bruno@exemplo.com",
      amount: 22000,
      paid: false,
    },
    {
      name: "Carla Rua",
      phone: "(11) 96666-3003",
      email: "",
      amount: 15000,
      paid: true,
    },
  ];

  for (const sample of samples) {
    const id = newId();
    await sql(
      `insert into students (id, name, phone, email, monthly_amount_cents, notes)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        sample.name,
        sample.phone,
        sample.email,
        sample.amount,
        "Dados de exemplo — ambiente local sem Postgres.",
      ],
    );
    if (sample.paid) {
      await sql(
        `insert into payments
          (id, student_id, amount_cents, reference_month, paid_at, notes, recorded_by_sub, recorded_by_name)
         values ($1, $2, $3, $4, current_date, $5, $6, $7)`,
        [
          newId(),
          id,
          sample.amount,
          month,
          "Pagamento de exemplo",
          "local-sample",
          "Dev Viewer",
        ],
      );
    }
  }
}

export async function listStudentsWithStatus(
  referenceMonth = currentReferenceMonth(),
  opts: { includeInactive?: boolean; q?: string } = {},
): Promise<StudentWithStatus[]> {
  await ensureSampleData();
  const includeInactive = opts.includeInactive ?? false;
  const q = opts.q?.trim().toLowerCase() ?? "";

  const rows = await sql<
    Student & {
      payment_id: string | null;
      payment_amount_cents: number | null;
      payment_reference_month: string | null;
      payment_paid_at: string | null;
      payment_notes: string | null;
      payment_recorded_by_sub: string | null;
      payment_recorded_by_name: string | null;
      payment_created_at: string | null;
    }
  >(
    `select s.*,
            p.id as payment_id,
            p.amount_cents as payment_amount_cents,
            p.reference_month as payment_reference_month,
            p.paid_at as payment_paid_at,
            p.notes as payment_notes,
            p.recorded_by_sub as payment_recorded_by_sub,
            p.recorded_by_name as payment_recorded_by_name,
            p.created_at as payment_created_at
     from students s
     left join payments p
       on p.student_id = s.id and p.reference_month = $1
     where ($2::boolean or s.active = true)
       and ($3 = '' or lower(s.name) like '%' || $3 || '%'
            or lower(s.phone) like '%' || $3 || '%'
            or lower(s.email) like '%' || $3 || '%')
     order by s.active desc, s.name asc`,
    [referenceMonth, includeInactive, q],
  );

  return rows.map((row) => {
    const payment = row.payment_id
      ? {
          id: row.payment_id,
          student_id: row.id,
          amount_cents: Number(row.payment_amount_cents),
          reference_month: row.payment_reference_month!,
          paid_at: toDateOnly(row.payment_paid_at),
          notes: row.payment_notes ?? "",
          recorded_by_sub: row.payment_recorded_by_sub ?? "",
          recorded_by_name: row.payment_recorded_by_name ?? "",
          created_at: toIso(row.payment_created_at),
        }
      : null;
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      monthly_amount_cents: Number(row.monthly_amount_cents),
      active: Boolean(row.active),
      notes: row.notes,
      created_at: toIso(row.created_at),
      updated_at: toIso(row.updated_at),
      status: payment ? "adimplente" : "inadimplente",
      payment,
    };
  });
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const raw = String(value);
  const asDate = new Date(raw);
  return Number.isNaN(asDate.getTime()) ? raw : asDate.toISOString();
}

function toDateOnly(value: unknown): string {
  const iso = toIso(value);
  return iso.slice(0, 10);
}

export async function getDashboard(referenceMonth = currentReferenceMonth()) {
  const students = await listStudentsWithStatus(referenceMonth, {
    includeInactive: true,
  });
  const active = students.filter((s) => s.active);
  const adimplentes = active.filter((s) => s.status === "adimplente");
  const inadimplentes = active.filter((s) => s.status === "inadimplente");
  const expectedCents = active.reduce((sum, s) => sum + s.monthly_amount_cents, 0);
  const receivedCents = adimplentes.reduce(
    (sum, s) => sum + (s.payment?.amount_cents ?? 0),
    0,
  );

  return {
    referenceMonth,
    totalStudents: students.length,
    activeStudents: active.length,
    inactiveStudents: students.length - active.length,
    adimplentes: adimplentes.length,
    inadimplentes: inadimplentes.length,
    expectedCents,
    receivedCents,
    openCents: Math.max(0, expectedCents - receivedCents),
    sampleData: isUsingSampleDatabase(),
  };
}

export async function getStudent(id: string): Promise<Student | null> {
  await ensureSampleData();
  const rows = await sql<Student>("select * from students where id = $1", [id]);
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    monthly_amount_cents: Number(row.monthly_amount_cents),
    active: Boolean(row.active),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

export async function listPaymentsForStudent(studentId: string): Promise<Payment[]> {
  const rows = await sql<Payment>(
    `select * from payments where student_id = $1 order by reference_month desc, created_at desc`,
    [studentId],
  );
  return rows.map((row) => ({
    ...row,
    amount_cents: Number(row.amount_cents),
    paid_at: toDateOnly(row.paid_at),
    created_at: toIso(row.created_at),
  }));
}

export async function createStudent(input: {
  name: string;
  phone?: string;
  email?: string;
  monthlyAmountCents: number;
  notes?: string;
}): Promise<Student> {
  const id = newId();
  const rows = await sql<Student>(
    `insert into students (id, name, phone, email, monthly_amount_cents, notes)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [
      id,
      input.name.trim(),
      input.phone?.trim() ?? "",
      input.email?.trim() ?? "",
      input.monthlyAmountCents,
      input.notes?.trim() ?? "",
    ],
  );
  const row = rows[0];
  return {
    ...row,
    monthly_amount_cents: Number(row.monthly_amount_cents),
    active: Boolean(row.active),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

export async function updateStudent(
  id: string,
  input: {
    name: string;
    phone?: string;
    email?: string;
    monthlyAmountCents: number;
    notes?: string;
    active: boolean;
  },
): Promise<Student | null> {
  const rows = await sql<Student>(
    `update students
     set name = $2,
         phone = $3,
         email = $4,
         monthly_amount_cents = $5,
         notes = $6,
         active = $7,
         updated_at = now()
     where id = $1
     returning *`,
    [
      id,
      input.name.trim(),
      input.phone?.trim() ?? "",
      input.email?.trim() ?? "",
      input.monthlyAmountCents,
      input.notes?.trim() ?? "",
      input.active,
    ],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    monthly_amount_cents: Number(row.monthly_amount_cents),
    active: Boolean(row.active),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

export async function recordPayment(input: {
  studentId: string;
  amountCents: number;
  referenceMonth: string;
  paidAt?: string;
  notes?: string;
  recordedBySub: string;
  recordedByName: string;
}): Promise<Payment> {
  const id = newId();
  const paidAt = input.paidAt?.trim() || null;
  const rows = await sql<Payment>(
    `insert into payments
       (id, student_id, amount_cents, reference_month, paid_at, notes, recorded_by_sub, recorded_by_name)
     values ($1, $2, $3, $4, coalesce($5::date, current_date), $6, $7, $8)
     on conflict (student_id, reference_month) do update set
       amount_cents = excluded.amount_cents,
       paid_at = excluded.paid_at,
       notes = excluded.notes,
       recorded_by_sub = excluded.recorded_by_sub,
       recorded_by_name = excluded.recorded_by_name
     returning *`,
    [
      id,
      input.studentId,
      input.amountCents,
      input.referenceMonth,
      paidAt,
      input.notes?.trim() ?? "",
      input.recordedBySub,
      input.recordedByName,
    ],
  );
  const row = rows[0];
  return {
    ...row,
    amount_cents: Number(row.amount_cents),
    paid_at: toDateOnly(row.paid_at),
    created_at: toIso(row.created_at),
  };
}

export async function deletePayment(id: string): Promise<boolean> {
  const rows = await sql<{ id: string }>(
    "delete from payments where id = $1 returning id",
    [id],
  );
  return rows.length > 0;
}
