-- Jobs marketplace schema — Phase 1 (no messaging tables; that's a
-- separate follow-up migration once the chat system is built).
--
-- Run this once in the Supabase SQL editor. Mirrors the exact RLS/column
-- conventions already used by businesses/articles in schema.sql — same
-- admin-email check, same "public can read published, owner can read/edit
-- their own regardless of status" shape.
--
-- Run docs/seo/jobs-categories-seed.sql AFTER this file — it inserts into
-- job_categories, which this file creates.

begin;

-- ---------------------------------------------------------------
-- job_categories: DB-backed (unlike businesses/blog, which use static JS
-- files) so admins can add/edit/delete/reorder/activate-deactivate without
-- a code deploy — the one deliberate architecture deviation from the rest
-- of the site's taxonomy pattern, because the spec explicitly requires
-- admin CRUD for this one.
-- ---------------------------------------------------------------
create table public.job_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  -- null = top-level (parent) category; set = a subcategory of that parent.
  parent_id uuid references public.job_categories(id) on delete cascade,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  description text,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now()
);

alter table public.job_categories enable row level security;

create policy "Active job categories are publicly readable"
  on public.job_categories for select
  using (is_active = true);

-- Admin needs to see inactive ones too (to reactivate them), and to
-- manage the table at all.
create policy "Admin can read all job categories"
  on public.job_categories for select
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create policy "Admin can manage job categories"
  on public.job_categories for all
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com')
  with check (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create index job_categories_parent_id_idx on public.job_categories(parent_id);

-- ---------------------------------------------------------------
-- jobs: one row per job posting. employer_id is whoever posted it — any
-- signed-in user, same as any signed-in user can create a business today.
-- business_id optionally links an existing Green Pages business listing
-- instead of duplicating company info (spec section 19).
-- ---------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  company_name text not null,
  company_logo_url text,
  title text not null,
  slug text not null unique,
  category_id uuid not null references public.job_categories(id),
  description text not null,
  responsibilities text,
  requirements text,
  skills text,
  experience_level text not null check (
    experience_level in ('no_experience', 'entry_level', '1_2_years', '2_5_years', '5_10_years', '10_plus_years')
  ),
  education text,
  employment_type text not null check (
    employment_type in ('full_time', 'part_time', 'contract', 'temporary', 'internship', 'freelance', 'apprenticeship')
  ),
  work_mode text not null check (work_mode in ('onsite', 'remote', 'hybrid')),
  salary_min integer,
  salary_max integer,
  salary_currency text not null default 'PKR',
  salary_negotiable boolean not null default false,
  -- Distinct from salary_negotiable: a negotiable job still has a real
  -- range being discussed; "not disclosed" means the employer chooses not
  -- to reveal one at all. Mutually exclusive in the posting form.
  salary_not_disclosed boolean not null default false,
  country text not null default 'Pakistan',
  city text,
  area text,
  address text,
  application_deadline date,
  apply_on_greenpages boolean not null default true,
  apply_whatsapp text,
  apply_email text,
  apply_website_url text,
  -- No 'draft': the form is submit-only, and publishes immediately (no
  -- admin review gate — see the "Employers can create jobs" policy
  -- below). 'pending_review'/'rejected' stay valid values in case a
  -- review step is reintroduced later, just unused by any code path
  -- today. No cron-driven 'expired' write — expiry is computed live from
  -- application_deadline/expires_at at query time, same pattern
  -- articles.published_at scheduling already uses.
  status text not null default 'published' check (
    status in ('pending_review', 'published', 'rejected', 'expired', 'closed')
  ),
  is_verified boolean not null default false,
  verified_at timestamptz,
  verified_by text,
  is_featured boolean not null default false,
  admin_notes text,
  rejection_reason text,
  published_at timestamptz,
  expires_at timestamptz,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

create policy "Published jobs are publicly readable"
  on public.jobs for select
  using (status = 'published');

create policy "Employers can read their own jobs"
  on public.jobs for select
  using (auth.uid() = employer_id);

-- Required for /admin/jobs' Pending Jobs table — without this, admin's
-- SELECT has nothing to match under RLS for another employer's
-- pending_review job (admin isn't its employer and it isn't published
-- yet), same reasoning as "Admin can read all job categories" above.
create policy "Admin can read all jobs"
  on public.jobs for select
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

-- Jobs publish immediately on submit — no admin review gate. Admin still
-- sees every job on /admin/jobs and can delete one if needed.
create policy "Employers can create jobs"
  on public.jobs for insert
  with check (auth.uid() = employer_id and status = 'published');

create policy "Employers can update their own jobs"
  on public.jobs for update
  using (auth.uid() = employer_id);

create policy "Employers can delete their own jobs"
  on public.jobs for delete
  using (auth.uid() = employer_id);

create policy "Admin can update any job"
  on public.jobs for update
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create policy "Admin can delete any job"
  on public.jobs for delete
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create index jobs_category_id_idx on public.jobs(category_id);
create index jobs_employer_id_idx on public.jobs(employer_id);
create index jobs_status_idx on public.jobs(status);
create index jobs_city_idx on public.jobs(city);

-- ---------------------------------------------------------------
-- job_applications: one row per (job, applicant) pair.
-- ---------------------------------------------------------------
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  cv_url text,
  cover_letter text,
  relevant_experience text,
  portfolio_url text,
  linkedin_url text,
  status text not null default 'applied' check (
    status in ('applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn')
  ),
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

alter table public.job_applications enable row level security;

create policy "Applicants can read their own applications"
  on public.job_applications for select
  using (auth.uid() = applicant_id);

-- Employers need to see applications to jobs they posted — checked via a
-- subquery against jobs.employer_id, same join-based-policy shape used
-- elsewhere in this schema (e.g. reviews -> businesses.owner_id, if it
-- existed) adapted for this relationship.
create policy "Employers can read applications to their jobs"
  on public.job_applications for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_applications.job_id and jobs.employer_id = auth.uid()
    )
  );

create policy "Signed-in users can apply to jobs"
  on public.job_applications for insert
  with check (auth.uid() = applicant_id);

create policy "Applicants can update(withdraw) their own applications"
  on public.job_applications for update
  using (auth.uid() = applicant_id);

create policy "Employers can update status of applications to their jobs"
  on public.job_applications for update
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_applications.job_id and jobs.employer_id = auth.uid()
    )
  );

create index job_applications_job_id_idx on public.job_applications(job_id);
create index job_applications_applicant_id_idx on public.job_applications(applicant_id);

-- Without this, an applicant's own /account/applications page would lose
-- visibility into a job's title/company the moment it's closed/expired/
-- rejected — the "Published jobs are publicly readable" policy above only
-- covers status='published', and PostgREST enforces jobs' own RLS on the
-- embedded `jobs(...)` resource even when the parent job_applications row
-- is readable. This mirrors "Employers can read applications to their
-- jobs" the other direction. Defined here (not up with jobs' other
-- policies) because it depends on job_applications, which doesn't exist
-- yet at that point in the script.
--
-- Uses a SECURITY DEFINER function rather than a plain EXISTS subquery on
-- purpose: job_applications' own "Employers can read applications to
-- their jobs" policy does EXISTS(... from jobs ...) right back — a plain
-- subquery here would create a circular RLS reference between the two
-- tables, which Postgres refuses to evaluate at all ("infinite recursion
-- detected in policy for relation jobs", confirmed live the hard way).
-- SECURITY DEFINER makes this function's internal query bypass
-- job_applications' RLS, breaking the cycle.
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

revoke all on function public.applicant_has_applied_to_job(uuid) from public;
grant execute on function public.applicant_has_applied_to_job(uuid) to authenticated;

create policy "Applicants can read jobs they applied to"
  on public.jobs for select
  using (public.applicant_has_applied_to_job(id));

-- ---------------------------------------------------------------
-- saved_jobs
-- ---------------------------------------------------------------
create table public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

alter table public.saved_jobs enable row level security;

create policy "Users can manage their own saved jobs"
  on public.saved_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- job_alerts: preference storage only. No sending mechanism exists
-- anywhere in this codebase (no email/push infra) so none is faked here —
-- this just persists what a user asked to be alerted about, ready for a
-- future session to wire up real delivery.
-- ---------------------------------------------------------------
create table public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  keywords text,
  category_id uuid references public.job_categories(id) on delete set null,
  city text,
  employment_type text,
  work_mode text,
  created_at timestamptz not null default now()
);

alter table public.job_alerts enable row level security;

create policy "Users can manage their own job alerts"
  on public.job_alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
