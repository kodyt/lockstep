import { Platform } from 'react-native'
// Use require() to avoid default export interop issues with react-native-health.
const AppleHealthKit = require('react-native-health')
import { addSteps, getStepsToday } from './api'

let initPromise = null

const ensureHealthKit = () => {
  if (Platform.OS !== 'ios') {
    return Promise.reject(new Error('HealthKit is only available on iOS.'))
  }

  if (!AppleHealthKit || typeof AppleHealthKit.isAvailable !== 'function') {
    return Promise.reject(
      new Error(
        'HealthKit module not loaded. Rebuild the dev client after adding react-native-health, and run on a real iPhone.'
      )
    )
  }

  if (!initPromise) {
    initPromise = new Promise((resolve, reject) => {
      AppleHealthKit.isAvailable((availabilityError, available) => {
        if (availabilityError) {
          initPromise = null
          reject(availabilityError)
          return
        }

        if (!available) {
          initPromise = null
          reject(new Error('HealthKit is not available on this device.'))
          return
        }

        const permissions = {
          permissions: {
            read: [AppleHealthKit.Constants.Permissions.Steps]
          }
        }

        AppleHealthKit.initHealthKit(permissions, (error) => {
          if (error) {
            initPromise = null
            reject(error)
            return
          }
          resolve(true)
        })
      })
    })
  }

  return initPromise
}

export const getTodayStepCount = async ({ includeManuallyAdded = false } = {}) => {
  await ensureHealthKit()

  return new Promise((resolve, reject) => {
    AppleHealthKit.getStepCount(
      {
        date: new Date().toISOString(),
        includeManuallyAdded
      },
      (error, results) => {
        if (error) {
          reject(error)
          return
        }
        const value = Math.max(0, Math.round(results?.value || 0))
        resolve(value)
      }
    )
  })
}

export const syncHealthSteps = async (userId) => {
  if (!userId) {
    throw new Error('Missing user for HealthKit sync.')
  }

  const healthSteps = await getTodayStepCount({ includeManuallyAdded: false })
  const today = await getStepsToday(userId)
  const apiSteps = today?.steps ?? 0
  const delta = Math.max(0, healthSteps - apiSteps)

  if (delta > 0) {
    await addSteps(userId, delta, 'healthkit')
  }

  return {
    healthSteps,
    apiSteps,
    delta
  }
}
