-- Run in Supabase SQL Editor. Supabase Auth remains the source of credentials.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'CITIZEN' check (role in ('CITIZEN', 'UNIVERSITY', 'INDUSTRY', 'ADMIN')),
  phone text,
  district text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data ->> 'role' in ('CITIZEN', 'UNIVERSITY', 'INDUSTRY')
        then new.raw_user_meta_data ->> 'role'
      else 'CITIZEN'
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
