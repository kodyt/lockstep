import { NativeEventEmitter, NativeModules, Platform } from 'react-native'

const nativeControls = NativeModules.LockstepControls

const requireNativeControls = () => {
  if (Platform.OS !== 'ios') {
    throw new Error('App blocking is currently available only on iPhone.')
  }
  if (!nativeControls) {
    throw new Error('Lockstep controls are not installed. Rebuild the iOS app and try again.')
  }
  return nativeControls
}

export const requestControlsAuthorization = () => requireNativeControls().requestAuthorization()

export const getControlsState = () => requireNativeControls().getState()

export const refreshStepCount = () => requireNativeControls().refreshSteps()

export const setDailyGoal = (goal) => requireNativeControls().setGoal(Math.max(1, Math.round(goal)))

export const setBlockingEnabled = (enabled) => requireNativeControls().setBlockingEnabled(Boolean(enabled))

export const chooseBlockedApps = () => requireNativeControls().presentActivityPicker()

export const clearBlockedApps = () => requireNativeControls().clearSelection()

export const addControlsStateListener = (listener) => {
  const module = requireNativeControls()
  const emitter = new NativeEventEmitter(module)
  return emitter.addListener('lockstepStateChanged', listener)
}
