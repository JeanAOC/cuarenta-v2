-- Ejecutar una vez en Supabase: SQL Editor > New query > pegar > Run.
-- El torneo completo vive en un solo documento. La columna "version" evita que
-- dos guardados simultáneos se pisen entre sí.

create table if not exists public.tournament_state (
  id          int primary key default 1 check (id = 1),
  state       jsonb not null,
  version     int not null default 0,
  updated_at  timestamptz not null default now()
);

-- Sin políticas: nadie puede leer ni escribir desde el navegador.
-- Solo el servidor (con la service role key) accede a la tabla.
alter table public.tournament_state enable row level security;
