-- AAPoly · Certificate download payment
-- Additive migration on top of schema.sql. Run this once in the AfriBase SQL editor.

-- Per-student record of the certificate payment.
alter table public.class_students
  add column if not exists certificate_paid        boolean     not null default false,
  add column if not exists certificate_payment_ref text,
  add column if not exists certificate_amount_paid integer,
  add column if not exists certificate_paid_at     timestamptz;

create index if not exists class_students_cert_paid_ref_idx
  on public.class_students (certificate_payment_ref);

-- The fee is read from class_settings (whole Naira, as text):
--   certificate_fee_current — ND / this-year cohort
--   certificate_fee_last    — HND / last-year cohort
-- Set them from the admin dashboard under "Certificate settings".
-- Nothing to seed here; an unset fee simply blocks payment with a clear message.
