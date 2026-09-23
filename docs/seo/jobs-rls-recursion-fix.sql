-- Fixes a live bug in the just-run jobs-migration.sql: "jobs" and
-- "job_applications" each have a policy that does EXISTS(select ... from
-- the OTHER table where ...) — a circular RLS reference. Postgres detects
-- this and refuses to evaluate it at all, so EVERY query against "jobs"
-- currently 500s with "infinite recursion detected in policy for relation
-- jobs" (confirmed live via a direct anon-key query).
--
-- Fix: replace the one policy that caused the cycle — "Applicants can read
-- jobs they applied to" on public.jobs — with a SECURITY DEFINER function.
-- That function's internal query to job_applications runs with the
-- function owner's privileges, bypassing job_applications' own RLS, so
-- evaluating jobs' policy no longer re-triggers job_applications' RLS and
-- the cycle is broken. Run this once in the Supabase SQL editor.

begin;

drop policy if exists "Applicants can read jobs they applied to" on public.jobs;

create or replace function public.applicant_has_applied_to_job(target_job_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.job_applications
    where job_applications.job_id = target_job_id
    and job_applications.applicant_id = auth.uid()
  );
$$;

-- Only authenticated users can even call it — no reason for the anon role
-- to invoke a function that checks auth.uid() (always null for anon).
revoke all on function public.applicant_has_applied_to_job(uuid) from public;
grant execute on function public.applicant_has_applied_to_job(uuid) to authenticated;

create policy "Applicants can read jobs they applied to"
  on public.jobs for select
  using (public.applicant_has_applied_to_job(id));

commit;
