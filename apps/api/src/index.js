import express from 'express'
import cors from 'cors'
import { nanoid } from 'nanoid'
import { initDb, getDb } from './db.js'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

await initDb()
const db = getDb()

const dateKey = (offsetDays = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('en-CA')
}

const lastNDates = (days) => Array.from({ length: days }).map((_, index) => dateKey(-index))

const findUser = (userId) => db.data.users.find(user => user.id === userId)

const ensureUser = (userId) => {
  const resolvedId = userId || db.data.users[0]?.id
  if (!resolvedId) {
    const error = new Error('No users available')
    error.status = 404
    throw error
  }
  const user = findUser(resolvedId)
  if (!user) {
    const error = new Error('User not found')
    error.status = 404
    throw error
  }
  return user
}

const getStepsForDate = (userId, date) => db.data.steps.find(step => step.userId === userId && step.date === date)

const setStepsForDate = (userId, date, steps, source = 'manual') => {
  const existing = getStepsForDate(userId, date)
  if (existing) {
    existing.steps = Math.max(0, steps)
    existing.source = source
    return existing
  }
  const record = {
    id: `step_${nanoid(6)}`,
    userId,
    date,
    steps: Math.max(0, steps),
    source
  }
  db.data.steps.push(record)
  return record
}

const addSteps = (userId, date, delta, source = 'manual') => {
  const existing = getStepsForDate(userId, date)
  if (existing) {
    existing.steps = Math.max(0, existing.steps + delta)
    existing.source = source
    return existing
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

const buildDashboard = (userId) => {
  const user = ensureUser(userId)
  const today = dateKey()
  const stepsToday = getStepsForDate(userId, today)?.steps ?? 0
  const apps = db.data.apps.filter(app => app.userId === userId && app.enabled)
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
  const { name, dailyGoal } = req.body || {}
  if (!name) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  const user = {
    id: `user_${nanoid(6)}`,
    name,
    dailyGoal: Number(dailyGoal) || 8000,
    unlockPolicy: {
      stepsPerBlock: 2500,
      minutesPerBlock: 15,
      fullUnlockAtSteps: Number(dailyGoal) || 8000
    },
    graceUnlocksRemaining: 2,
    manualOverridesRemaining: 1,
    createdAt: new Date().toISOString()
  }
  db.data.users.push(user)
  await db.write()
  res.status(201).json(user)
})

app.get('/v1/users', (req, res) => {
  res.json(db.data.users)
})

app.get('/v1/users/:id', (req, res) => {
  try {
    const user = ensureUser(req.params.id)
    const entries = db.data.steps.filter(step => step.userId === user.id)
    const streaks = computeStreaks(entries, user.dailyGoal)
    res.json({
      user,
      streaks
    })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/profile', (req, res) => {
  try {
    const userId = req.query.userId
    const user = ensureUser(userId)
    const entries = db.data.steps.filter(step => step.userId === user.id)
    const streaks = computeStreaks(entries, user.dailyGoal)
    const last7 = lastNDates(7).map(date => ({
      date,
      steps: entries.find(entry => entry.date === date)?.steps ?? 0
    }))
    const personalRecordDay = Math.max(0, ...entries.map(entry => entry.steps))

    res.json({
      user,
      streaks,
      history: last7,
      personalRecords: {
        bestDay: personalRecordDay
      }
    })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/dashboard', (req, res) => {
  try {
    const userId = req.query.userId
    res.json(buildDashboard(userId))
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/steps/today', (req, res) => {
  try {
    const userId = req.query.userId
    ensureUser(userId)
    const today = dateKey()
    const stepsToday = getStepsForDate(userId, today)?.steps ?? 0
    res.json({ userId, date: today, steps: stepsToday })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/steps', async (req, res) => {
  try {
    const { userId, steps, source } = req.body || {}
    ensureUser(userId)
    const today = dateKey()
    const record = addSteps(userId, today, Number(steps) || 0, source || 'manual')
    await db.write()
    res.status(201).json({ ...record })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/apps', (req, res) => {
  try {
    const userId = req.query.userId
    ensureUser(userId)
    const apps = db.data.apps.filter(app => app.userId === userId)
    res.json(apps)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/apps', async (req, res) => {
  try {
    const { userId, name, groupId, unlockMode, unlockCostMinutes, enabled } = req.body || {}
    ensureUser(userId)
    if (!name) {
      res.status(400).json({ error: 'name is required' })
      return
    }
    const appEntry = {
      id: `app_${nanoid(6)}`,
      userId,
      name,
      groupId: groupId || null,
      enabled: enabled ?? true,
      unlockMode: unlockMode || 'incremental',
      unlockCostMinutes: Number(unlockCostMinutes) || 10
    }
    db.data.apps.push(appEntry)
    await db.write()
    res.status(201).json(appEntry)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.patch('/v1/apps/:id', async (req, res) => {
  try {
    const appEntry = db.data.apps.find(app => app.id === req.params.id)
    if (!appEntry) {
      res.status(404).json({ error: 'app not found' })
      return
    }
    const { name, groupId, unlockMode, unlockCostMinutes, enabled } = req.body || {}
    if (name !== undefined) appEntry.name = name
    if (groupId !== undefined) appEntry.groupId = groupId
    if (unlockMode !== undefined) appEntry.unlockMode = unlockMode
    if (unlockCostMinutes !== undefined) appEntry.unlockCostMinutes = Number(unlockCostMinutes)
    if (enabled !== undefined) appEntry.enabled = enabled
    await db.write()
    res.json(appEntry)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.delete('/v1/apps/:id', async (req, res) => {
  const index = db.data.apps.findIndex(app => app.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ error: 'app not found' })
    return
  }
  const [removed] = db.data.apps.splice(index, 1)
  await db.write()
  res.json(removed)
})

app.get('/v1/app-groups', (req, res) => {
  try {
    const userId = req.query.userId
    ensureUser(userId)
    const groups = db.data.appGroups.filter(group => group.userId === userId)
    res.json(groups)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/app-groups', async (req, res) => {
  try {
    const { userId, name } = req.body || {}
    ensureUser(userId)
    if (!name) {
      res.status(400).json({ error: 'name is required' })
      return
    }
    const group = { id: `ag_${nanoid(6)}`, userId, name }
    db.data.appGroups.push(group)
    await db.write()
    res.status(201).json(group)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/groups', (req, res) => {
  try {
    const userId = req.query.userId
    ensureUser(userId)
    const memberships = db.data.groupMembers.filter(member => member.userId === userId)
    const groups = memberships.map(member => ({
      ...db.data.groups.find(group => group.id === member.groupId),
      role: member.role,
      optOutOfUnlock: member.optOutOfUnlock
    }))
    res.json(groups)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/groups', async (req, res) => {
  try {
    const { userId, name, goalSteps, mode } = req.body || {}
    const user = ensureUser(userId)
    if (!name) {
      res.status(400).json({ error: 'name is required' })
      return
    }
    const group = {
      id: `grp_${nanoid(6)}`,
      name,
      ownerId: user.id,
      goalSteps: Number(goalSteps) || 20000,
      mode: mode || 'shared',
      createdAt: new Date().toISOString()
    }
    db.data.groups.push(group)
    db.data.groupMembers.push({ groupId: group.id, userId: user.id, role: 'owner', optOutOfUnlock: false })
    await db.write()
    res.status(201).json(group)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/groups/:id/join', async (req, res) => {
  try {
    const { userId } = req.body || {}
    ensureUser(userId)
    const group = db.data.groups.find(entry => entry.id === req.params.id)
    if (!group) {
      res.status(404).json({ error: 'group not found' })
      return
    }
    const exists = db.data.groupMembers.find(member => member.groupId === group.id && member.userId === userId)
    if (exists) {
      res.status(200).json({ groupId: group.id, userId })
      return
    }
    db.data.groupMembers.push({ groupId: group.id, userId, role: 'member', optOutOfUnlock: false })
    await db.write()
    res.status(201).json({ groupId: group.id, userId })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.get('/v1/leaderboard', (req, res) => {
  try {
    const scope = req.query.scope || 'daily'
    const groupId = req.query.groupId
    const rangeDays = scope === 'weekly' ? 7 : 1
    const dateRange = lastNDates(rangeDays)

    let userIds = db.data.users.map(user => user.id)
    if (groupId) {
      userIds = db.data.groupMembers.filter(member => member.groupId === groupId).map(member => member.userId)
    }

    const entries = userIds.map(userId => {
      const user = ensureUser(userId)
      const total = db.data.steps
        .filter(step => step.userId === userId && dateRange.includes(step.date))
        .reduce((sum, step) => sum + step.steps, 0)

      return {
        userId,
        name: user.name,
        steps: total
      }
    }).sort((a, b) => b.steps - a.steps)

    res.json({ scope, groupId, entries })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.post('/v1/grace-unlock', async (req, res) => {
  try {
    const { userId } = req.body || {}
    const user = ensureUser(userId)
    if (user.graceUnlocksRemaining <= 0) {
      res.status(400).json({ error: 'No grace unlocks remaining' })
      return
    }
    user.graceUnlocksRemaining -= 1
    db.data.unlockEvents.push({
      id: `unlock_${nanoid(6)}`,
      userId,
      date: dateKey(),
      type: 'grace',
      createdAt: new Date().toISOString()
    })
    await db.write()
    res.status(201).json({ userId, graceUnlocksRemaining: user.graceUnlocksRemaining })
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
