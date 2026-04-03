import { nanoid } from 'nanoid'

const todayKey = () => new Date().toLocaleDateString('en-CA')

const dateKey = (offsetDays = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('en-CA')
}

const buildWeek = (base, variance = 1200) => {
  return Array.from({ length: 7 }).map((_, index) => {
    const offset = -index
    const swing = Math.round((Math.sin(index) + 1) * 0.5 * variance)
    return { date: dateKey(offset), steps: Math.max(0, base + swing - index * 150) }
  })
}

export async function seedIfEmpty(db) {
  if (db.data?.users?.length) return

  const jordanId = `user_${nanoid(6)}`
  const samId = `user_${nanoid(6)}`
  const priyaId = `user_${nanoid(6)}`

  const now = new Date().toISOString()

  db.data.users = [
    {
      id: jordanId,
      name: 'Jordan',
      dailyGoal: 8000,
      unlockPolicy: {
        stepsPerBlock: 2500,
        minutesPerBlock: 15,
        fullUnlockAtSteps: 8000
      },
      graceUnlocksRemaining: 2,
      manualOverridesRemaining: 1,
      createdAt: now
    },
    {
      id: samId,
      name: 'Sam',
      dailyGoal: 7000,
      unlockPolicy: {
        stepsPerBlock: 2400,
        minutesPerBlock: 15,
        fullUnlockAtSteps: 7000
      },
      graceUnlocksRemaining: 1,
      manualOverridesRemaining: 1,
      createdAt: now
    },
    {
      id: priyaId,
      name: 'Priya',
      dailyGoal: 9000,
      unlockPolicy: {
        stepsPerBlock: 3000,
        minutesPerBlock: 20,
        fullUnlockAtSteps: 9000
      },
      graceUnlocksRemaining: 2,
      manualOverridesRemaining: 2,
      createdAt: now
    }
  ]

  const socialGroupId = `ag_${nanoid(6)}`
  const videoGroupId = `ag_${nanoid(6)}`
  const gamesGroupId = `ag_${nanoid(6)}`
  const focusGroupId = `ag_${nanoid(6)}`

  db.data.appGroups = [
    { id: socialGroupId, userId: jordanId, name: 'Social' },
    { id: videoGroupId, userId: jordanId, name: 'Video' },
    { id: gamesGroupId, userId: jordanId, name: 'Games' },
    { id: focusGroupId, userId: jordanId, name: 'Focus' }
  ]

  db.data.apps = [
    {
      id: `app_${nanoid(6)}`,
      userId: jordanId,
      name: 'Instagram',
      groupId: socialGroupId,
      enabled: true,
      unlockMode: 'incremental',
      unlockCostMinutes: 10
    },
    {
      id: `app_${nanoid(6)}`,
      userId: jordanId,
      name: 'TikTok',
      groupId: videoGroupId,
      enabled: true,
      unlockMode: 'incremental',
      unlockCostMinutes: 15
    },
    {
      id: `app_${nanoid(6)}`,
      userId: jordanId,
      name: 'YouTube',
      groupId: videoGroupId,
      enabled: true,
      unlockMode: 'incremental',
      unlockCostMinutes: 20
    },
    {
      id: `app_${nanoid(6)}`,
      userId: jordanId,
      name: 'Reddit',
      groupId: socialGroupId,
      enabled: true,
      unlockMode: 'incremental',
      unlockCostMinutes: 10
    },
    {
      id: `app_${nanoid(6)}`,
      userId: jordanId,
      name: 'Chess',
      groupId: gamesGroupId,
      enabled: true,
      unlockMode: 'full',
      unlockCostMinutes: 30
    },
    {
      id: `app_${nanoid(6)}`,
      userId: jordanId,
      name: 'Mail',
      groupId: focusGroupId,
      enabled: true,
      unlockMode: 'full',
      unlockCostMinutes: 0
    }
  ]

  const groupId = `grp_${nanoid(6)}`
  db.data.groups = [
    {
      id: groupId,
      name: 'Morning Movers',
      ownerId: jordanId,
      goalSteps: 30000,
      mode: 'shared',
      createdAt: now
    }
  ]

  db.data.groupMembers = [
    { groupId, userId: jordanId, role: 'owner', optOutOfUnlock: false },
    { groupId, userId: samId, role: 'member', optOutOfUnlock: false },
    { groupId, userId: priyaId, role: 'member', optOutOfUnlock: true }
  ]

  const jordanWeek = buildWeek(7400)
  const samWeek = buildWeek(6200)
  const priyaWeek = buildWeek(8800)

  db.data.steps = [
    ...jordanWeek.map(entry => ({
      id: `step_${nanoid(6)}`,
      userId: jordanId,
      date: entry.date,
      steps: entry.steps,
      source: 'health'
    })),
    ...samWeek.map(entry => ({
      id: `step_${nanoid(6)}`,
      userId: samId,
      date: entry.date,
      steps: entry.steps,
      source: 'health'
    })),
    ...priyaWeek.map(entry => ({
      id: `step_${nanoid(6)}`,
      userId: priyaId,
      date: entry.date,
      steps: entry.steps,
      source: 'health'
    }))
  ]

  const today = todayKey()
  db.data.unlockEvents = [
    {
      id: `unlock_${nanoid(6)}`,
      userId: jordanId,
      date: today,
      type: 'grace',
      createdAt: now
    }
  ]
}
