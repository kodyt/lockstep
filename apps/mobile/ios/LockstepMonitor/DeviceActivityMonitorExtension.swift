import DeviceActivity

final class DeviceActivityMonitorExtension: DeviceActivityMonitor {
  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)
    LockstepSharedState.resetForNewDayIfNeeded()
    LockstepSharedState.applyShield()
  }
}
