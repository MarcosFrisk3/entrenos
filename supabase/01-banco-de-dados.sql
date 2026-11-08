-- ============================================================
-- ENTRENÓS — ETAPA 1
-- Banco de dados, segurança e vínculo do casal
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em RUN.
-- ============================================================


-- ------------------------------------------------------------
-- 1. TABELAS
-- ------------------------------------------------------------

-- Perfil de cada pessoa (sem dados pessoais obrigatórios)
create table if not exists public.perfis (
  id            uuid primary key references auth.users on delete cascade,
  apelido       text,
  maior_idade   boolean not null default false,
  criado_em     timestamptz not null default now()
);

-- O casal: duas pessoas vinculadas
create table if not exists public.casais (
  id          uuid primary key default gen_random_uuid(),
  pessoa_a    uuid not null references auth.users on delete cascade,
  pessoa_b    uuid references auth.users on delete cascade,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

create index if not exists casais_pessoa_a_idx on public.casais (pessoa_a) where ativo;
create index if not exists casais_pessoa_b_idx on public.casais (pessoa_b) where ativo;

-- Convite de uso único para vincular o casal
create table if not exists public.convites (
  id          uuid primary key default gen_random_uuid(),
  codigo      text unique not null,
  criador     uuid not null references auth.users on delete cascade,
  casal_id    uuid not null references public.casais on delete cascade,
  expira_em   timestamptz not null,
  usado       boolean not null default false,
  criado_em   timestamptz not null default now()
);

-- Plano do casal (cobrança vem em etapa futura)
create table if not exists public.assinaturas (
  casal_id       uuid primary key references public.casais on delete cascade,
  plano          text not null default 'gratuito',
  valido_ate     timestamptz,
  atualizado_em  timestamptz not null default now()
);

-- Chave pública de cada celular (para a criptografia das fotos, etapa futura)
create table if not exists public.chaves_publicas (
  usuario_id     uuid primary key references auth.users on delete cascade,
  chave          text not null,
  atualizado_em  timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 2. FUNÇÕES DE APOIO
-- ------------------------------------------------------------

-- Devolve o id do casal da pessoa logada
create or replace function public.meu_casal_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id
    from public.casais
   where ativo
     and (pessoa_a = auth.uid() or pessoa_b = auth.uid())
   limit 1;
$$;

-- Devolve o id do parceiro da pessoa logada
create or replace function public.meu_parceiro_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select case when pessoa_a = auth.uid() then pessoa_b else pessoa_a end
    from public.casais
   where ativo
     and (pessoa_a = auth.uid() or pessoa_b = auth.uid())
   limit 1;
$$;

-- Cria o perfil automaticamente quando a pessoa se cadastra
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, apelido, maior_idade)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'apelido', 'Amor'),
    coalesce((new.raw_user_meta_data->>'maior_idade')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();


-- ------------------------------------------------------------
-- 3. CRIAR CONVITE
-- ------------------------------------------------------------
create or replace function public.criar_convite()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_casal_id  uuid;
  v_codigo    text;
  v_letras    text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sem letras/números confusos
  i           int;
begin
  -- Já está vinculado a alguém com o vínculo completo?
  select id into v_casal_id
    from public.casais
   where ativo
     and (pessoa_a = auth.uid() or pessoa_b = auth.uid())
   limit 1;

  if v_casal_id is not null
     and exists (select 1 from public.casais
                  where id = v_casal_id and pessoa_b is not null) then
    return json_build_object('ok', false, 'erro', 'Você já está vinculado.');
  end if;

  -- Cria o casal se ainda não existir
  if v_casal_id is null then
    insert into public.casais (pessoa_a) values (auth.uid())
    returning id into v_casal_id;

    insert into public.assinaturas (casal_id) values (v_casal_id)
    on conflict (casal_id) do nothing;
  end if;

  -- Invalida convites anteriores
  update public.convites
     set usado = true
   where criador = auth.uid() and usado = false;

  -- Gera um código de 8 caracteres
  loop
    v_codigo := '';
    for i in 1..8 loop
      v_codigo := v_codigo || substr(v_letras, 1 + floor(random() * length(v_letras))::int, 1);
    end loop;
    exit when not exists (select 1 from public.convites where codigo = v_codigo);
  end loop;

  insert into public.convites (codigo, criador, casal_id, expira_em)
  values (v_codigo, auth.uid(), v_casal_id, now() + interval '24 hours');

  return json_build_object(
    'ok', true,
    'codigo', substr(v_codigo, 1, 4) || '-' || substr(v_codigo, 5, 4),
    'expira_em', (now() + interval '24 hours')
  );
end;
$$;


-- ------------------------------------------------------------
-- 4. ACEITAR CONVITE
-- ------------------------------------------------------------
create or replace function public.aceitar_convite(p_codigo text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo   text;
  v_convite  public.convites%rowtype;
  v_casal    public.casais%rowtype;
begin
  -- Limpa o código: tira traços, espaços e deixa maiúsculo
  v_codigo := upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g'));

  if length(v_codigo) <> 8 then
    return json_build_object('ok', false, 'erro', 'Código inválido.');
  end if;

  if exists (select 1 from public.casais
              where ativo
                and pessoa_b is not null
                and (pessoa_a = auth.uid() or pessoa_b = auth.uid())) then
    return json_build_object('ok', false, 'erro', 'Você já está vinculado a alguém.');
  end if;

  select * into v_convite
    from public.convites
   where codigo = v_codigo
     and usado = false
     and expira_em > now();

  if not found then
    return json_build_object('ok', false, 'erro', 'Código inválido ou expirado.');
  end if;

  if v_convite.criador = auth.uid() then
    return json_build_object('ok', false, 'erro', 'Este código é seu. Peça para a outra pessoa usá-lo.');
  end if;

  select * into v_casal
    from public.casais
   where id = v_convite.casal_id and ativo;

  if not found or v_casal.pessoa_b is not null then
    return json_build_object('ok', false, 'erro', 'Este convite não está mais disponível.');
  end if;

  -- Apaga um casal "vazio" que a pessoa tenha criado antes
  delete from public.casais
   where ativo and pessoa_b is null and pessoa_a = auth.uid();

  update public.casais set pessoa_b = auth.uid() where id = v_casal.id;
  update public.convites set usado = true where id = v_convite.id;

  insert into public.assinaturas (casal_id) values (v_casal.id)
  on conflict (casal_id) do nothing;

  return json_build_object('ok', true, 'casal_id', v_casal.id);
end;
$$;


-- ------------------------------------------------------------
-- 5. DESFAZER VÍNCULO (apaga tudo do casal)
-- ------------------------------------------------------------
create or replace function public.desfazer_vinculo()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_casal_id uuid;
begin
  select public.meu_casal_id() into v_casal_id;

  if v_casal_id is null then
    return json_build_object('ok', false, 'erro', 'Você não está vinculado.');
  end if;

  delete from public.casais where id = v_casal_id;

  return json_build_object('ok', true);
end;
$$;


-- ------------------------------------------------------------
-- 6. SITUAÇÃO ATUAL DO CASAL
-- ------------------------------------------------------------
create or replace function public.meu_status()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_casal   public.casais%rowtype;
  v_plano   text;
  v_parceiro text;
begin
  select * into v_casal
    from public.casais
   where ativo and (pessoa_a = auth.uid() or pessoa_b = auth.uid())
   limit 1;

  if not found then
    return json_build_object('vinculado', false, 'aguardando', false);
  end if;

  if v_casal.pessoa_b is null then
    return json_build_object('vinculado', false, 'aguardando', true);
  end if;

  select plano into v_plano from public.assinaturas where casal_id = v_casal.id;

  select apelido into v_parceiro
    from public.perfis
   where id = case when v_casal.pessoa_a = auth.uid()
                   then v_casal.pessoa_b else v_casal.pessoa_a end;

  return json_build_object(
    'vinculado', true,
    'aguardando', false,
    'casal_id', v_casal.id,
    'plano', coalesce(v_plano, 'gratuito'),
    'parceiro', coalesce(v_parceiro, 'Amor')
  );
end;
$$;


-- ------------------------------------------------------------
-- 7. SEGURANÇA (RLS) — cada pessoa só enxerga o que é dela
-- ------------------------------------------------------------

alter table public.perfis          enable row level security;
alter table public.casais          enable row level security;
alter table public.convites        enable row level security;
alter table public.assinaturas     enable row level security;
alter table public.chaves_publicas enable row level security;

-- PERFIS: vejo o meu e o do meu parceiro; só edito o meu
drop policy if exists perfis_ler on public.perfis;
create policy perfis_ler on public.perfis
  for select using (id = auth.uid() or id = public.meu_parceiro_id());

drop policy if exists perfis_editar on public.perfis;
create policy perfis_editar on public.perfis
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists perfis_inserir on public.perfis;
create policy perfis_inserir on public.perfis
  for insert with check (id = auth.uid());

-- CASAIS: só o meu casal
drop policy if exists casais_ler on public.casais;
create policy casais_ler on public.casais
  for select using (pessoa_a = auth.uid() or pessoa_b = auth.uid());

-- CONVITES: só os que eu criei (quem recebe usa a função aceitar_convite)
drop policy if exists convites_ler on public.convites;
create policy convites_ler on public.convites
  for select using (criador = auth.uid());

-- ASSINATURAS: só leitura, do meu casal
drop policy if exists assinaturas_ler on public.assinaturas;
create policy assinaturas_ler on public.assinaturas
  for select using (casal_id = public.meu_casal_id());

-- CHAVES PÚBLICAS: leio a minha e a do parceiro; gravo só a minha
drop policy if exists chaves_ler on public.chaves_publicas;
create policy chaves_ler on public.chaves_publicas
  for select using (usuario_id = auth.uid() or usuario_id = public.meu_parceiro_id());

drop policy if exists chaves_gravar on public.chaves_publicas;
create policy chaves_gravar on public.chaves_publicas
  for insert with check (usuario_id = auth.uid());

drop policy if exists chaves_atualizar on public.chaves_publicas;
create policy chaves_atualizar on public.chaves_publicas
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());


-- ------------------------------------------------------------
-- 8. PERMISSÕES DAS FUNÇÕES
-- ------------------------------------------------------------
revoke all on function public.criar_convite()          from public, anon;
revoke all on function public.aceitar_convite(text)    from public, anon;
revoke all on function public.desfazer_vinculo()       from public, anon;
revoke all on function public.meu_status()             from public, anon;

grant execute on function public.criar_convite()       to authenticated;
grant execute on function public.aceitar_convite(text) to authenticated;
grant execute on function public.desfazer_vinculo()    to authenticated;
grant execute on function public.meu_status()          to authenticated;

-- FIM
