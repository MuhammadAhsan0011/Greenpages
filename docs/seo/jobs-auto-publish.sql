-- Removes the admin-review gate for new job postings: jobs now publish
-- immediately on submit instead of landing in pending_review. Admin still
-- sees every job on /admin/jobs (Published Jobs table) and can delete one
-- if needed — there's just no approve/reject step in front of going live.
--
-- jobs already exists in production — this replaces the one INSERT policy
-- that hard-required status='pending_review', which would otherwise
-- reject every insert from the updated createJob (app/jobs/actions.js),
-- which now submits status='published'. Run once in the Supabase SQL
-- editor.

begin;

drop policy if exists "Employers can create jobs" on public.jobs;

create policy "Employers can create jobs"
  on public.jobs for insert
  with check (auth.uid() = employer_id and status = 'published');

-- Metadata-only, doesn't touch existing rows — but the app always sets
-- status explicitly, so this just keeps the column's own default in sync
-- with reality instead of silently pointing at the retired review flow.
alter table public.jobs alter column status set default 'published';

commit;
