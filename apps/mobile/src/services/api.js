import { mockApps, mockDashboard, mockGroups, mockLeaderboard, mockProfile, mockUser } from './mock'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:4000/v1'

const request = async (path, options) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Request failed')
  }

  return response.json()
}

export const getUsers = async () => {
  try {
    const users = await request('/users')
    return users.length ? users : [mockUser]
  } catch (error) {
    return [mockUser]
  }
}

export const ensureUserRecord = async (authUserId, name) => {
  try {
    return await request('/users/ensure', {
      method: 'POST',
      body: JSON.stringify({ authUserId, name })
    })
  } catch (error) {
    return { ...mockUser, id: authUserId, name: name || mockUser.name }
  }
}

export const getDashboard = async (userId) => {
  try {
    return await request(`/dashboard?userId=${encodeURIComponent(userId)}`)
  } catch (error) {
    return mockDashboard
  }
}

export const getApps = async (userId) => {
  try {
    return await request(`/apps?userId=${encodeURIComponent(userId)}`)
  } catch (error) {
    return mockApps
  }
}

export const getGroups = async (userId) => {
  try {
    return await request(`/groups?userId=${encodeURIComponent(userId)}`)
  } catch (error) {
    return mockGroups
  }
}

export const getAppGroups = async (userId) => {
  try {
    return await request(`/app-groups?userId=${encodeURIComponent(userId)}`)
  } catch (error) {
    return [
      { id: 'social', name: 'Social' },
      { id: 'video', name: 'Video' },
      { id: 'games', name: 'Games' }
    ]
  }
}

export const getLeaderboard = async (scope = 'daily', groupId) => {
  try {
    const params = new URLSearchParams({ scope })
    if (groupId) params.append('groupId', groupId)
    return await request(`/leaderboard?${params.toString()}`)
  } catch (error) {
    return mockLeaderboard
  }
}

export const getProfile = async (userId) => {
  try {
    return await request(`/profile?userId=${encodeURIComponent(userId)}`)
  } catch (error) {
    return mockProfile
  }
}

export const getStepsToday = async (userId) => {
  try {
    return await request(`/steps/today?userId=${encodeURIComponent(userId)}`)
  } catch (error) {
    return { userId, date: new Date().toLocaleDateString('en-CA'), steps: 0 }
  }
}

export const addSteps = async (userId, steps, source = 'manual') => {
  try {
    return await request('/steps', {
      method: 'POST',
      body: JSON.stringify({ userId, steps, source })
    })
  } catch (error) {
    return { userId, steps }
  }
}

export const useGraceUnlock = async (userId) => {
  try {
    return await request('/grace-unlock', {
      method: 'POST',
      body: JSON.stringify({ userId })
    })
  } catch (error) {
    return { userId, graceUnlocksRemaining: 0, error: error.message }
  }
}
