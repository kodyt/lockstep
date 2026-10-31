import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings

enum LockstepSharedState {
  static let appGroupIdentifier = "group.com.kt2102.lockstep"
  static let defaultGoal = 8_000
  static let activityName = DeviceActivityName("lockstep.daily")

  private enum Key {
    static let activitySelection = "activitySelection"
    static let blockingEnabled = "blockingEnabled"
    static let dailyGoal = "dailyGoal"
    static let stepDate = "stepDate"
    static let stepsToday = "stepsToday"
  }

  private static let store = ManagedSettingsStore(named: .init("lockstep"))

  private static var defaults: UserDefaults {
    UserDefaults(suiteName: appGroupIdentifier) ?? .standard
  }

  static var selection: FamilyActivitySelection {
    get {
      guard let data = defaults.data(forKey: Key.activitySelection),
            let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
      else {
        return FamilyActivitySelection()
      }
      return selection
    }
    set {
      guard let data = try? JSONEncoder().encode(newValue) else { return }
      defaults.set(data, forKey: Key.activitySelection)
    }
  }

  static var goal: Int {
    get {
      let savedGoal = defaults.integer(forKey: Key.dailyGoal)
      return savedGoal > 0 ? savedGoal : defaultGoal
    }
    set {
      defaults.set(max(1, newValue), forKey: Key.dailyGoal)
      applyShield()
    }
  }

  static var blockingEnabled: Bool {
    get {
      if defaults.object(forKey: Key.blockingEnabled) == nil {
        return true
      }
      return defaults.bool(forKey: Key.blockingEnabled)
    }
    set {
      defaults.set(newValue, forKey: Key.blockingEnabled)
      applyShield()
    }
  }

  static var stepsToday: Int {
    resetForNewDayIfNeeded()
    return defaults.integer(forKey: Key.stepsToday)
  }

  static var isUnlocked: Bool {
    stepsToday >= goal
  }

  static func updateSteps(_ steps: Int) {
    defaults.set(todayKey(), forKey: Key.stepDate)
    defaults.set(max(0, steps), forKey: Key.stepsToday)
    applyShield()
  }

  static func resetForNewDayIfNeeded() {
    guard defaults.string(forKey: Key.stepDate) != todayKey() else { return }
    defaults.set(todayKey(), forKey: Key.stepDate)
    defaults.set(0, forKey: Key.stepsToday)
  }

  static func applyShield() {
#if targetEnvironment(simulator)
    // DeviceActivity and ManagedSettings are only functional on a physical device.
    return
#else
    resetForNewDayIfNeeded()

    guard blockingEnabled, !isUnlocked else {
      clearShield()
      return
    }

    let savedSelection = selection
    store.shield.applications = savedSelection.applicationTokens.isEmpty
      ? nil
      : savedSelection.applicationTokens
    store.shield.applicationCategories = savedSelection.categoryTokens.isEmpty
      ? nil
      : .specific(savedSelection.categoryTokens)
    store.shield.webDomains = savedSelection.webDomainTokens.isEmpty
      ? nil
      : savedSelection.webDomainTokens
#endif
  }

  static func clearShield() {
#if !targetEnvironment(simulator)
    store.clearAllSettings()
#endif
  }

  static func scheduleDailyReset() throws {
#if !targetEnvironment(simulator)
    let schedule = DeviceActivitySchedule(
      intervalStart: DateComponents(hour: 0, minute: 0),
      intervalEnd: DateComponents(hour: 23, minute: 59, second: 59),
      repeats: true
    )
    try DeviceActivityCenter().startMonitoring(activityName, during: schedule)
#endif
  }

  static func stateDictionary(authorizationStatus: String) -> [String: Any] {
    let savedSelection = selection
    let steps = stepsToday
    let savedGoal = goal

    return [
      "authorizationStatus": authorizationStatus,
      "blockingEnabled": blockingEnabled,
      "goal": savedGoal,
      "isUnlocked": steps >= savedGoal,
      "remainingSteps": max(0, savedGoal - steps),
      "selectedAppCount": savedSelection.applicationTokens.count,
      "selectedCategoryCount": savedSelection.categoryTokens.count,
      "selectedWebDomainCount": savedSelection.webDomainTokens.count,
      "stepsToday": steps
    ]
  }

  private static func todayKey() -> String {
    let components = Calendar.current.dateComponents([.year, .month, .day], from: Date())
    return "\(components.year ?? 0)-\(components.month ?? 0)-\(components.day ?? 0)"
  }
}
