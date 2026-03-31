export const mockUser = {
  id: 'demo_user',
  name: 'Jordan',
  dailyGoal: 8000,
  graceUnlocksRemaining: 2,
  manualOverridesRemaining: 1,
  unlockPolicy: {
    stepsPerBlock: 2500,
    minutesPerBlock: 15,
    fullUnlockAtSteps: 8000
  }
}

export const mockDashboard = {
  user: mockUser,
  stepsToday: 4200,
  dailyGoal: 8000,
  progress: 0.53,
  unlockStatus: {
    blocks: 1,
    minutes: 15,
    isFullUnlock: false,
    nextUnlockSteps: 800,
    policy: mockUser.unlockPolicy
  },
  appsLocked: 4,
  appsUnlocked: 2,
  appsPreview: [
    { id: 'app_1', name: 'Instagram' },
    { id: 'app_2', name: 'TikTok' },
    { id: 'app_3', name: 'YouTube' },
    { id: 'app_4', name: 'Reddit' }
  ]
}

export const mockApps = [
  { id: 'app_1', name: 'Instagram', groupId: 'social', enabled: true, unlockMode: 'incremental', unlockCostMinutes: 10 },
  { id: 'app_2', name: 'TikTok', groupId: 'video', enabled: true, unlockMode: 'incremental', unlockCostMinutes: 15 },
  { id: 'app_3', name: 'YouTube', groupId: 'video', enabled: true, unlockMode: 'incremental', unlockCostMinutes: 20 },
  { id: 'app_4', name: 'Reddit', groupId: 'social', enabled: true, unlockMode: 'incremental', unlockCostMinutes: 10 },
  { id: 'app_5', name: 'Chess', groupId: 'games', enabled: true, unlockMode: 'full', unlockCostMinutes: 30 }
]

export const mockGroups = [
  { id: 'grp_1', name: 'Morning Movers', goalSteps: 30000, mode: 'shared', role: 'owner', optOutOfUnlock: false }
]

export const mockLeaderboard = {
  scope: 'daily',
  entries: [
    { userId: 'demo_user', name: 'Jordan', steps: 8200 },
    { userId: 'sam', name: 'Sam', steps: 7100 },
    { userId: 'priya', name: 'Priya', steps: 6800 }
  ]
}

export const mockProfile = {
  user: mockUser,
  streaks: { current: 3, best: 12 },
  history: [
    { date: 'Mon', steps: 7200 },
    { date: 'Tue', steps: 8100 },
    { date: 'Wed', steps: 5400 },
    { date: 'Thu', steps: 9000 },
    { date: 'Fri', steps: 7600 },
    { date: 'Sat', steps: 6200 },
    { date: 'Sun', steps: 8300 }
  ],
  personalRecords: { bestDay: 12450 }
}
