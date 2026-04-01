insert into users (id, name, daily_goal, unlock_policy, grace_unlocks_remaining, manual_overrides_remaining)
values
  ('user_jordan', 'Jordan', 8000, '{"stepsPerBlock":2500,"minutesPerBlock":15,"fullUnlockAtSteps":8000}', 2, 1),
  ('user_sam', 'Sam', 7000, '{"stepsPerBlock":2400,"minutesPerBlock":15,"fullUnlockAtSteps":7000}', 1, 1),
  ('user_priya', 'Priya', 9000, '{"stepsPerBlock":3000,"minutesPerBlock":20,"fullUnlockAtSteps":9000}', 2, 2)
on conflict (id) do nothing;

insert into app_groups (id, user_id, name)
values
  ('ag_social', 'user_jordan', 'Social'),
  ('ag_video', 'user_jordan', 'Video'),
  ('ag_games', 'user_jordan', 'Games'),
  ('ag_focus', 'user_jordan', 'Focus')
on conflict (id) do nothing;

insert into apps (id, user_id, name, group_id, enabled, unlock_mode, unlock_cost_minutes)
values
  ('app_instagram', 'user_jordan', 'Instagram', 'ag_social', true, 'incremental', 10),
  ('app_tiktok', 'user_jordan', 'TikTok', 'ag_video', true, 'incremental', 15),
  ('app_youtube', 'user_jordan', 'YouTube', 'ag_video', true, 'incremental', 20),
  ('app_reddit', 'user_jordan', 'Reddit', 'ag_social', true, 'incremental', 10),
  ('app_chess', 'user_jordan', 'Chess', 'ag_games', true, 'full', 30),
  ('app_mail', 'user_jordan', 'Mail', 'ag_focus', true, 'full', 0)
on conflict (id) do nothing;

insert into groups (id, name, owner_id, goal_steps, mode)
values
  ('grp_morning', 'Morning Movers', 'user_jordan', 30000, 'shared')
on conflict (id) do nothing;

insert into group_members (id, group_id, user_id, role, opt_out_of_unlock)
values
  ('gm_jordan', 'grp_morning', 'user_jordan', 'owner', false),
  ('gm_sam', 'grp_morning', 'user_sam', 'member', false),
  ('gm_priya', 'grp_morning', 'user_priya', 'member', true)
on conflict (id) do nothing;

insert into steps (id, user_id, date, steps, source)
values
  ('step_jordan_0', 'user_jordan', current_date, 7600, 'health'),
  ('step_jordan_1', 'user_jordan', current_date - interval '1 day', 8200, 'health'),
  ('step_jordan_2', 'user_jordan', current_date - interval '2 day', 6900, 'health'),
  ('step_jordan_3', 'user_jordan', current_date - interval '3 day', 9100, 'health'),
  ('step_jordan_4', 'user_jordan', current_date - interval '4 day', 7400, 'health'),
  ('step_jordan_5', 'user_jordan', current_date - interval '5 day', 6100, 'health'),
  ('step_jordan_6', 'user_jordan', current_date - interval '6 day', 8300, 'health'),

  ('step_sam_0', 'user_sam', current_date, 6800, 'health'),
  ('step_sam_1', 'user_sam', current_date - interval '1 day', 7200, 'health'),
  ('step_sam_2', 'user_sam', current_date - interval '2 day', 6400, 'health'),
  ('step_sam_3', 'user_sam', current_date - interval '3 day', 7000, 'health'),
  ('step_sam_4', 'user_sam', current_date - interval '4 day', 5900, 'health'),
  ('step_sam_5', 'user_sam', current_date - interval '5 day', 6600, 'health'),
  ('step_sam_6', 'user_sam', current_date - interval '6 day', 6100, 'health'),

  ('step_priya_0', 'user_priya', current_date, 9000, 'health'),
  ('step_priya_1', 'user_priya', current_date - interval '1 day', 8800, 'health'),
  ('step_priya_2', 'user_priya', current_date - interval '2 day', 9200, 'health'),
  ('step_priya_3', 'user_priya', current_date - interval '3 day', 9600, 'health'),
  ('step_priya_4', 'user_priya', current_date - interval '4 day', 8400, 'health'),
  ('step_priya_5', 'user_priya', current_date - interval '5 day', 7900, 'health'),
  ('step_priya_6', 'user_priya', current_date - interval '6 day', 8700, 'health')
on conflict (id) do nothing;

insert into unlock_events (id, user_id, date, type)
values
  ('unlock_jordan_today', 'user_jordan', current_date, 'grace')
on conflict (id) do nothing;
