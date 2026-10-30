-- Lets the admin account delete any file in the public "uploads" bucket.
--
-- Why: when an owner asks for Verified/Premium, fills in its extra data, and
-- then doesn't pay, the admin's "Not paid - publish as Basic" button deletes
-- that unpaid data (cover image, extra photos, images inside the About text).
-- The existing policy only lets a file's own uploader delete it, so without
-- this the database rows would be cleared but the files would stay in storage.
--
-- Keep the email in sync with the other admin policies in supabase/schema.sql.
-- Safe to run more than once.

drop policy if exists "Admin can delete any upload" on storage.objects;

create policy "Admin can delete any upload"
  on storage.objects for delete
  using (bucket_id = 'uploads' and auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');
