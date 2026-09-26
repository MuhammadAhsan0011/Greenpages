-- Adds a security-definer function to bump jobs.view_count from the public
-- job detail page, same pattern as increment_business_view() in
-- supabase/schema.sql. The jobs table's "Employers can update their own
-- jobs" RLS policy only lets the employer update their own row, so a public
-- visitor viewing someone else's job needs this function to increment the
-- counter without a general UPDATE grant.
--
-- Run this once in the Supabase SQL editor, after docs/seo/jobs-migration.sql.

begin;

create function public.increment_job_view(job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.jobs set view_count = view_count + 1 where id = job_id;
end;
$$;

grant execute on function public.increment_job_view(uuid) to anon, authenticated;

commit;
