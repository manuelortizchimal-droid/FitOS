-- Minimal Supabase API schemas for isolated PostgreSQL CI (not production setup).
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users(id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create schema storage;
create table storage.buckets(
 id text primary key,
 name text unique not null,
 public boolean not null,
 file_size_limit bigint,
 allowed_mime_types text[]
);
create table storage.objects(
 id bigint generated always as identity primary key,
 bucket_id text not null references storage.buckets(id),
 name text not null
);
