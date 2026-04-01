create table if not exists users (
  id text primary key,
  name text not null,
  daily_goal integer not null default 8000,
  unlock_policy jsonb not null,
  grace_unlocks_remaining integer not null default 2,
  manual_overrides_remaining integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists steps (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  date date not null,
  steps integer not null default 0,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists steps_user_date_idx on steps (user_id, date);

create table if not exists app_groups (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists apps (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  group_id text references app_groups(id) on delete set null,
  enabled boolean not null default true,
  unlock_mode text not null default 'incremental',
  unlock_cost_minutes integer not null default 10,
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id text primary key,
  name text not null,
  owner_id text not null references users(id) on delete cascade,
  goal_steps integer not null default 20000,
  mode text not null default 'shared',
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  id text primary key,
  group_id text not null references groups(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  role text not null default 'member',
  opt_out_of_unlock boolean not null default false,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists unlock_events (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  date date not null,
  type text not null,
  created_at timestamptz not null default now()
);
