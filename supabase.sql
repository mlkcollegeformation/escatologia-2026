-- Execute no SQL Editor de um projeto Supabase dedicado ao evento.
-- O GitHub Pages não armazena dados ou senhas.
create extension if not exists pgcrypto;
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_slug text not null,
  registration_code text not null unique,
  full_name text not null check (char_length(trim(full_name)) between 3 and 140),
  phone text not null check (phone ~ '^[0-9]{10,13}$'),
  email text not null check (char_length(email) between 5 and 180),
  consent boolean not null default false,
  payment_status text not null default 'pending' check (payment_status in ('pending','confirmed')),
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id),
  constraint registration_event_email_unique unique(event_slug,email),
  constraint registration_event_phone_unique unique(event_slug,phone),
  constraint registration_consent check (consent = true)
);
create index if not exists event_registrations_created_idx on public.event_registrations(event_slug,created_at desc);
create table if not exists public.event_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.event_registrations enable row level security;
alter table public.event_admins enable row level security;
revoke all on public.event_registrations from anon,authenticated;
revoke all on public.event_admins from anon,authenticated;
grant insert on public.event_registrations to anon,authenticated;
grant select,update on public.event_registrations to authenticated;
grant select on public.event_admins to authenticated;
drop policy if exists "event_public_registration_insert" on public.event_registrations;
create policy "event_public_registration_insert" on public.event_registrations
for insert to anon,authenticated with check (
  event_slug='seminario-escatologia-2026'
  and payment_status='pending'
  and confirmed_at is null and confirmed_by is null
  and consent=true
);
drop policy if exists "event_admins_self_read" on public.event_admins;
create policy "event_admins_self_read" on public.event_admins
for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "event_admins_registration_select" on public.event_registrations;
create policy "event_admins_registration_select" on public.event_registrations
for select to authenticated using (
  exists(select 1 from public.event_admins where user_id=(select auth.uid()))
);
drop policy if exists "event_admins_registration_update" on public.event_registrations;
create policy "event_admins_registration_update" on public.event_registrations
for update to authenticated using (
  exists(select 1 from public.event_admins where user_id=(select auth.uid()))
) with check (
  exists(select 1 from public.event_admins where user_id=(select auth.uid()))
);
-- Impede que a atualização pelo navegador modifique dados cadastrais:
create or replace function public.event_guard_payment_update()
returns trigger language plpgsql set search_path=public as $$
begin
 if (old.id,old.event_slug,old.registration_code,old.full_name,old.phone,old.email,old.consent,old.created_at)
 is distinct from
 (new.id,new.event_slug,new.registration_code,new.full_name,new.phone,new.email,new.consent,new.created_at) then
  raise exception 'Apenas informações de pagamento podem ser alteradas';
 end if;
 if new.payment_status='confirmed' then
   if new.confirmed_by is distinct from auth.uid() or new.confirmed_at is null then
     raise exception 'Confirmação exige usuário e data';
   end if;
 else
   if new.confirmed_by is not null or new.confirmed_at is not null then
     raise exception 'Pagamento pendente não pode ter dados de confirmação';
   end if;
 end if;
 return new;
end $$;
drop trigger if exists event_guard_payment_update_trigger on public.event_registrations;
create trigger event_guard_payment_update_trigger before update on public.event_registrations
for each row execute function public.event_guard_payment_update();
-- Crie administrador pelo Authentication > Users no painel Supabase.
-- Substitua o UUID abaixo e execute separadamente, APENAS no SQL Editor:
-- insert into public.event_admins(user_id) values ('COLE_AQUI_UUID_DO_USUARIO');
-- Nunca adicione credenciais secretas, tokens service_role ou senhas no GitHub.
