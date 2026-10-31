import { refreshStepCount } from './lockstepControls'

export const getTodayStepCount = async ({ includeManuallyAdded = false } = {}) => {
  const state = await refreshStepCount()
  return state.stepsToday
}

export const syncHealthSteps = async (userId) => {
  const healthSteps = await getTodayStepCount({ includeManuallyAdded: false })

  return {
    healthSteps,
    apiSteps: healthSteps,
    delta: 0
  }
}
