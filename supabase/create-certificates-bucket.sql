-- Supabase Storage Bucket for Certificates and Templates
-- Enable storage
insert into storage.buckets (id, name, public) 
values ('certificates', 'certificates', true)
on conflict (id) do nothing;

-- Set up security policies for the 'certificates' bucket
create policy "Certificates Public Access"
on storage.objects for select
using ( bucket_id = 'certificates' );

create policy "Certificates Admin Upload Access"
on storage.objects for insert
with check ( bucket_id = 'certificates' and auth.role() = 'authenticated' );

create policy "Certificates Admin Update Access"
on storage.objects for update
using ( bucket_id = 'certificates' and auth.role() = 'authenticated' );

create policy "Certificates Admin Delete Access"
on storage.objects for delete
using ( bucket_id = 'certificates' and auth.role() = 'authenticated' );
