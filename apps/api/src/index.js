import express from 'express'
import cors from 'cors'
import { nanoid } from 'nanoid'
import { supabase } from './supabase.js'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const dateKey = (offsetDays = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('en-CA')
}

const lastNDates = (days) => Array.from({ length: days }).map((_, index) => dateKey(-index))

const handleSupabaseError = (error, message = 'Database error') => {
  if (!error) return
  const err = new Error(message)
  err.status = 500
  err.cause = error
  throw err
}

const mapUser = (row) => row && ({
  id: row.id,
  name: row.name,
  dailyGoal: row.daily_goal,
  unlockPolicy: row.unlock_policy,
  graceUnlocksRemaining: row.grace_unlocks_remaining,
  manualOverridesRemaining: row.manual_overrides_remaining,
  createdAt: row.created_at
})

const mapStep = (row) => row && ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  steps: row.steps,
  source: row.source
})

const mapApp = (row) => row && ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  groupId: row.group_id,
  enabled: row.enabled,
  unlockMode: row.unlock_mode,
  unlockCostMinutes: row.unlock_cost_minutes
})

const mapAppGroup = (row) => row && ({
  id: row.id,
  userId: row.user_id,
  name: row.name
})

const mapGroup = (row) => row && ({
  id: row.id,
  name: row.name,
  ownerId: row.owner_id,
  goalSteps: row.goal_steps,
  mode: row.mode,
  createdAt: row.created_at
})

const mapGroupMember = (row) => row && ({
  id: row.id,
  groupId: row.group_id,
  userId: row.user_id,
  role: row.role,
  optOutOfUnlock: row.opt_out_of_unlock
})

const fetchUserById = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  handleSupabaseError(error, 'Failed to load user')
  return mapUser(data)
}

const ensureUser = async (userId) => {
  let user = null
  if (userId) {
    user = await fetchUserById(userId)
  }
  if (!user) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    handleSupabaseError(error, 'Failed to load users')
    if (!data) {
      const err = new Error('No users available')
      err.status = 404
      throw err
    }
    user = mapUser(data)
  }
  if (!user) {
    const err = new Error('User not found')
    err.status = 404
    throw err
  }
  return user
}

const getStepsForDate = async (userId, date) => {
  const { data, error } = await supabase
    .from('steps')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()
  handleSupabaseError(error, 'Failed to load steps')
  return mapStep(data)
}

const setStepsForDate = async (userId, date, steps, source = 'manual') => {
  const existing = await getStepsForDate(userId, date)
  if (existing) {
    const { data, error } = await supabase
      .from('steps')
      .update({
        steps: Math.max(0, steps),
        source
      })
      .eq('id', existing.id)
      .select('*')
      .single()
    handleSupabaseError(error, 'Failed to update steps')
    return mapStep(data)
  }

  const record = {
    id: `step_${nanoid(6)}`,
    user_id: userId,
    date,
    steps: Math.max(0, steps),
    source
  }
  const { data, error } = await supabase
    .from('steps')
    .insert(record)
    .select('*')
    .single()
  handleSupabaseError(error, 'Failed to create steps')
  return mapStep(data)
}

const addSteps = async (userId, date, delta, source = 'manual') => {
  const existing = await getStepsForDate(userId, date)
  if (existing) {
    return setStepsForDate(userId, date, existing.steps + delta, source)
  }
  return setStepsForDate(userId, date, delta, source)
}

const computeStreaks = (entries, goal) => {
  const byDate = new Map(entries.map(entry => [entry.date, entry.steps]))
  const last30 = lastNDates(30)
  let current = 0
  for (const date of last30) {
    const steps = byDate.get(date) ?? 0
    if (steps >= goal) {
      current += 1
    } else {
      break
    }
  }

  let best = 0
  let running = 0
  for (const date of last30.reverse()) {
    const steps = byDate.get(date) ?? 0
    if (steps >= goal) {
      running += 1
      best = Math.max(best, running)
    } else {
      running = 0
    }
  }

  return { current, best }
}

const computeUnlockStatus = (user, stepsToday) => {
  const policy = user.unlockPolicy || {
    stepsPerBlock: Math.max(1, Math.round(user.dailyGoal * 0.3)),
    minutesPerBlock: 15,
    fullUnlockAtSteps: user.dailyGoal
  }

  const blocks = Math.floor(stepsToday / policy.stepsPerBlock)
  const unlockMinutes = blocks * policy.minutesPerBlock
  const isFullUnlock = stepsToday >= policy.fullUnlockAtSteps
  const remainder = stepsToday % policy.stepsPerBlock
  const nextUnlockSteps = isFullUnlock ? 0 : Math.max(0, policy.stepsPerBlock - remainder)

  return {
    blocks,
    minutes: unlockMinutes,
    isFullUnlock,
    nextUnlockSteps,
    policy
  }
}

const computeAppUnlocks = (apps, unlockStatus) => {
  if (unlockStatus.isFullUnlock) {
    return { unlockedApps: apps.length, lockedApps: 0 }
  }

  let remainingMinutes = unlockStatus.minutes
  let unlocked = 0

  const incrementalApps = apps.filter(app => app.unlockMode === 'incremental')
  const fullApps = apps.filter(app => app.unlockMode === 'full')

  const sortedIncremental = [...incrementalApps].sort((a, b) => (a.unlockCostMinutes ?? 0) - (b.unlockCostMinutes ?? 0))

  for (const app of sortedIncremental) {
    const cost = app.unlockCostMinutes ?? 0
    if (remainingMinutes >= cost) {
      unlocked += 1
      remainingMinutes -= cost
    }
  }

  const lockedApps = apps.length - unlocked - fullApps.length
  return { unlockedApps: Math.max(0, unlocked), lockedApps: Math.max(0, lockedApps + fullApps.length) }
}

const buildDashboard = async (userId) => {
  const user = await ensureUser(userId)
  const today = dateKey()
  const stepsToday = (await getStepsForDate(user.id, today))?.steps ?? 0

  const { data: appsData, error: appsError } = await supabase
    .from('apps')
    .select('*')
    .eq('user_id', user.id)
    .eq('enabled', true)
  handleSupabaseError(appsError, 'Failed to load apps')

  const apps = (appsData || []).map(mapApp)
  const unlockStatus = computeUnlockStatus(user, stepsToday)
  const { unlockedApps, lockedApps } = computeAppUnlocks(apps, unlockStatus)

  return {
    user,
    stepsToday,
    dailyGoal: user.dailyGoal,
    progress: user.dailyGoal ? Math.min(1, stepsToday / user.dailyGoal) : 0,
    unlockStatus,
    appsLocked: lockedApps,
    appsUnlocked: unlockedApps,
    appsPreview: apps.slice(0, 4)
  }
}

app.get('/v1/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

app.post('/v1/users', async (req, res) => {
  try {
    const { name, dailyGoal } = req.body || {}
    if (!name) {
      res.status(400).json({ error: 'name is required' })
      return
    }
    const goal = Number(dailyGoal) || 8000
    const user = {
      id: `user_${nanoid(6)}`,
      name,
      daily_goal: goal,
      unlock_policy: {
        stepsPerBlock: 2500,
        minutesPerBlock: 15,
        fullUnlockAtSteps: goal
      },
      grace_unlocks_remaining: 2,
      manual_overrides_remaining: 1
    }

    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select('*')
      .single()
    handleSupabaseError(error, 'Failed to create user')
    res.status(201).json(mapUser(data))
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/users/ensure', async (req, res) => {
  try {
    const { authUserId, name } = req.body || {}
    if (!authUserId) {
      res.status(400).json({ error: 'authUserId is required' })
      return
    }

    const existing = await fetchUserById(authUserId)
    if (existing) {
      res.json(existing)
      return
    }

    const goal = 8000
    const user = {
      id: authUserId,
      name: name || 'Member',
      daily_goal: goal,
      unlock_policy: {
        stepsPerBlock: 2500,
        minutesPerBlock: 15,
        fullUnlockAtSteps: goal
      },
      grace_unlocks_remaining: 2,
      manual_overrides_remaining: 1
    }

    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select('*')
      .single()
    handleSupabaseError(error, 'Failed to create user')
    res.status(201).json(mapUser(data))
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })
    handleSupabaseError(error, 'Failed to load users')
    res.json((data || []).map(mapUser))
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/users/:id', async (req, res) => {
  try {
    const user = await ensureUser(req.params.id)
    const startDate = dateKey(-29)
    const endDate = dateKey()
    const { data: entriesData, error: entriesError } = await supabase
      .from('steps')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
    handleSupabaseError(entriesError, 'Failed to load steps')
    const entries = (entriesData || []).map(mapStep)
    const streaks = computeStreaks(entries, user.dailyGoal)
    res.json({ user, streaks })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/profile', async (req, res) => {
  try {
    const userId = req.query.userId
    const user = await ensureUser(userId)
    const startDate = dateKey(-29)
    const endDate = dateKey()

    const { data: entriesData, error: entriesError } = await supabase
      .from('steps')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
    handleSupabaseError(entriesError, 'Failed to load steps')

    const entries = (entriesData || []).map(mapStep)
    const streaks = computeStreaks(entries, user.dailyGoal)

    const last7 = lastNDates(7).map(date => ({
      date,
      steps: entries.find(entry => entry.date === date)?.steps ?? 0
    }))

    const { data: bestEntry, error: bestError } = await supabase
      .from('steps')
      .select('steps')
      .eq('user_id', user.id)
      .order('steps', { ascending: false })
      .limit(1)
      .maybeSingle()
    handleSupabaseError(bestError, 'Failed to load personal records')

    res.json({
      user,
      streaks,
      history: last7,
      personalRecords: {
        bestDay: bestEntry?.steps ?? 0
      }
    })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/dashboard', async (req, res) => {
  try {
    const userId = req.query.userId
    const payload = await buildDashboard(userId)
    res.json(payload)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/steps/today', async (req, res) => {
  try {
    const userId = req.query.userId
    const user = await ensureUser(userId)
    const today = dateKey()
    const stepsToday = (await getStepsForDate(user.id, today))?.steps ?? 0
    res.json({ userId: user.id, date: today, steps: stepsToday })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/steps', async (req, res) => {
  try {
    const { userId, steps, source } = req.body || {}
    const user = await ensureUser(userId)
    const today = dateKey()
    const record = await addSteps(user.id, today, Number(steps) || 0, source || 'manual')
    res.status(201).json({ ...record })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/apps', async (req, res) => {
  try {
    const userId = req.query.userId
    const user = await ensureUser(userId)
    const { data, error } = await supabase
      .from('apps')
      .select('*')
      .eq('user_id', user.id)
    handleSupabaseError(error, 'Failed to load apps')
    res.json((data || []).map(mapApp))
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/apps', async (req, res) => {
  try {
    const { userId, name, groupId, unlockMode, unlockCostMinutes, enabled } = req.body || {}
    const user = await ensureUser(userId)
    if (!name) {
      res.status(400).json({ error: 'name is required' })
      return
    }
    const appEntry = {
      id: `app_${nanoid(6)}`,
      user_id: user.id,
      name,
      group_id: groupId || null,
      enabled: enabled ?? true,
      unlock_mode: unlockMode || 'incremental',
      unlock_cost_minutes: Number(unlockCostMinutes) || 10
    }
    const { data, error } = await supabase
      .from('apps')
      .insert(appEntry)
      .select('*')
      .single()
    handleSupabaseError(error, 'Failed to create app')
    res.status(201).json(mapApp(data))
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.patch('/v1/apps/:id', async (req, res) => {
  try {
    const { name, groupId, unlockMode, unlockCostMinutes, enabled } = req.body || {}
    const updates = {}
    if (name !== undefined) updates.name = name
    if (groupId !== undefined) updates.group_id = groupId
    if (unlockMode !== undefined) updates.unlock_mode = unlockMode
    if (unlockCostMinutes !== undefined) updates.unlock_cost_minutes = Number(unlockCostMinutes)
    if (enabled !== undefined) updates.enabled = enabled

    const { data, error } = await supabase
      .from('apps')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle()
    handleSupabaseError(error, 'Failed to update app')
    if (!data) {
      res.status(404).json({ error: 'app not found' })
      return
    }
    res.json(mapApp(data))
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.delete('/v1/apps/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('apps')
      .delete()
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle()
    handleSupabaseError(error, 'Failed to delete app')
    if (!data) {
      res.status(404).json({ error: 'app not found' })
      return
    }
    res.json(mapApp(data))
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/app-groups', async (req, res) => {
  try {
    const userId = req.query.userId
    const user = await ensureUser(userId)
    const { data, error } = await supabase
      .from('app_groups')
      .select('*')
      .eq('user_id', user.id)
    handleSupabaseError(error, 'Failed to load app groups')
    res.json((data || []).map(mapAppGroup))
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/app-groups', async (req, res) => {
  try {
    const { userId, name } = req.body || {}
    const user = await ensureUser(userId)
    if (!name) {
      res.status(400).json({ error: 'name is required' })
      return
    }
    const group = { id: `ag_${nanoid(6)}`, user_id: user.id, name }
    const { data, error } = await supabase
      .from('app_groups')
      .insert(group)
      .select('*')
      .single()
    handleSupabaseError(error, 'Failed to create app group')
    res.status(201).json(mapAppGroup(data))
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/groups', async (req, res) => {
  try {
    const userId = req.query.userId
    const user = await ensureUser(userId)
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('*')
      .eq('user_id', user.id)
    handleSupabaseError(memberError, 'Failed to load group memberships')

    const memberships = (memberData || []).map(mapGroupMember)
    if (!memberships.length) {
      res.json([])
      return
    }

    const groupIds = memberships.map(member => member.groupId)
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
    handleSupabaseError(groupError, 'Failed to load groups')

    const groups = (groupData || []).map(mapGroup)
    const response = memberships.map(member => {
      const group = groups.find(entry => entry.id === member.groupId)
      return group ? { ...group, role: member.role, optOutOfUnlock: member.optOutOfUnlock } : null
    }).filter(Boolean)

    res.json(response)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/groups', async (req, res) => {
  try {
    const { userId, name, goalSteps, mode } = req.body || {}
    const user = await ensureUser(userId)
    if (!name) {
      res.status(400).json({ error: 'name is required' })
      return
    }
    const group = {
      id: `grp_${nanoid(6)}`,
      name,
      owner_id: user.id,
      goal_steps: Number(goalSteps) || 20000,
      mode: mode || 'shared'
    }
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert(group)
      .select('*')
      .single()
    handleSupabaseError(groupError, 'Failed to create group')

    const membership = {
      id: `gm_${nanoid(6)}`,
      group_id: group.id,
      user_id: user.id,
      role: 'owner',
      opt_out_of_unlock: false
    }
    const { error: memberError } = await supabase
      .from('group_members')
      .insert(membership)
    handleSupabaseError(memberError, 'Failed to create group membership')

    res.status(201).json(mapGroup(groupData))
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/groups/:id/join', async (req, res) => {
  try {
    const { userId } = req.body || {}
    const user = await ensureUser(userId)
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle()
    handleSupabaseError(groupError, 'Failed to load group')
    if (!groupData) {
      res.status(404).json({ error: 'group not found' })
      return
    }

    const { data: existing, error: existingError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', req.params.id)
      .eq('user_id', user.id)
      .maybeSingle()
    handleSupabaseError(existingError, 'Failed to check membership')
    if (existing) {
      res.status(200).json({ groupId: req.params.id, userId: user.id })
      return
    }

    const membership = {
      id: `gm_${nanoid(6)}`,
      group_id: req.params.id,
      user_id: user.id,
      role: 'member',
      opt_out_of_unlock: false
    }
    const { error: memberError } = await supabase
      .from('group_members')
      .insert(membership)
    handleSupabaseError(memberError, 'Failed to join group')

    res.status(201).json({ groupId: req.params.id, userId: user.id })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/leaderboard', async (req, res) => {
  try {
    const scope = req.query.scope || 'daily'
    const groupId = req.query.groupId
    const rangeDays = scope === 'weekly' ? 7 : 1
    const dateRange = lastNDates(rangeDays)

    let userIds = []
    if (groupId) {
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
      handleSupabaseError(membersError, 'Failed to load group members')
      userIds = (membersData || []).map(entry => entry.user_id)
    } else {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id')
      handleSupabaseError(usersError, 'Failed to load users')
      userIds = (usersData || []).map(entry => entry.id)
    }

    if (!userIds.length) {
      res.json({ scope, groupId, entries: [] })
      return
    }

    const { data: stepsData, error: stepsError } = await supabase
      .from('steps')
      .select('*')
      .in('user_id', userIds)
      .in('date', dateRange)
    handleSupabaseError(stepsError, 'Failed to load steps')

    const totals = new Map(userIds.map(id => [id, 0]))
    for (const row of stepsData || []) {
      totals.set(row.user_id, (totals.get(row.user_id) || 0) + row.steps)
    }

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds)
    handleSupabaseError(usersError, 'Failed to load users')
    const users = (usersData || []).map(mapUser)

    const entries = users.map(user => ({
      userId: user.id,
      name: user.name,
      steps: totals.get(user.id) || 0
    })).sort((a, b) => b.steps - a.steps)

    res.json({ scope, groupId, entries })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/grace-unlock', async (req, res) => {
  try {
    const { userId } = req.body || {}
    const user = await ensureUser(userId)
    if (user.graceUnlocksRemaining <= 0) {
      res.status(400).json({ error: 'No grace unlocks remaining' })
      return
    }

    const newCount = user.graceUnlocksRemaining - 1
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ grace_unlocks_remaining: newCount })
      .eq('id', user.id)
      .select('*')
      .single()
    handleSupabaseError(updateError, 'Failed to update user')

    const unlockEvent = {
      id: `unlock_${nanoid(6)}`,
      user_id: user.id,
      date: dateKey(),
      type: 'grace'
    }
    const { error: unlockError } = await supabase
      .from('unlock_events')
      .insert(unlockEvent)
    handleSupabaseError(unlockError, 'Failed to log unlock')

    res.status(201).json({ userId: updatedUser.id, graceUnlocksRemaining: updatedUser.grace_unlocks_remaining })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.use((error, req, res, next) => {
  res.status(error.status || 500).json({ error: error.message || 'Unexpected error' })
})

app.listen(port, () => {
  console.log(`Lockstep API listening on ${port}`)
})
