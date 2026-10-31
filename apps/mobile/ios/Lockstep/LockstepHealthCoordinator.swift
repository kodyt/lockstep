import Foundation
import HealthKit

extension Notification.Name {
  static let lockstepStateChanged = Notification.Name("LockstepStateChanged")
}

final class LockstepHealthCoordinator {
  static let shared = LockstepHealthCoordinator()

  private let healthStore = HKHealthStore()
  private var observerQuery: HKObserverQuery?

  private var stepType: HKQuantityType? {
    HKObjectType.quantityType(forIdentifier: .stepCount)
  }

  private init() {}

  func requestAuthorization(completion: @escaping (Result<Int, Error>) -> Void) {
    guard HKHealthStore.isHealthDataAvailable(), let stepType else {
      completion(.failure(LockstepHealthError.unavailable))
      return
    }

    healthStore.requestAuthorization(toShare: [], read: [stepType]) { [weak self] success, error in
      if let error {
        completion(.failure(error))
        return
      }
      guard success else {
        completion(.failure(LockstepHealthError.authorizationNotGranted))
        return
      }

      self?.startObserving()
      self?.refreshSteps(completion: completion)
    }
  }

  func startObserving() {
    guard HKHealthStore.isHealthDataAvailable(), let stepType, observerQuery == nil else { return }

    let query = HKObserverQuery(sampleType: stepType, predicate: nil) { [weak self] _, completion, error in
      guard error == nil else {
        completion()
        return
      }

      self?.refreshSteps { _ in completion() }
    }

    observerQuery = query
    healthStore.execute(query)
    healthStore.enableBackgroundDelivery(for: stepType, frequency: .immediate) { _, _ in }
    refreshSteps { _ in }
  }

  func refreshSteps(completion: @escaping (Result<Int, Error>) -> Void) {
    guard HKHealthStore.isHealthDataAvailable(), let stepType else {
      completion(.failure(LockstepHealthError.unavailable))
      return
    }

    let calendar = Calendar.current
    let startOfDay = calendar.startOfDay(for: Date())
    let datePredicate = HKQuery.predicateForSamples(
      withStart: startOfDay,
      end: Date(),
      options: [.strictStartDate]
    )
    let notUserEntered = NSPredicate(
      format: "metadata.%K != YES",
      HKMetadataKeyWasUserEntered
    )
    let predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [datePredicate, notUserEntered])

    let query = HKStatisticsQuery(
      quantityType: stepType,
      quantitySamplePredicate: predicate,
      options: .cumulativeSum
    ) { _, statistics, error in
      if let error {
        completion(.failure(error))
        return
      }

      let steps = Int(statistics?.sumQuantity()?.doubleValue(for: .count()) ?? 0)
      LockstepSharedState.updateSteps(steps)
      DispatchQueue.main.async {
        NotificationCenter.default.post(name: .lockstepStateChanged, object: nil)
      }
      completion(.success(steps))
    }

    healthStore.execute(query)
  }
}

private enum LockstepHealthError: LocalizedError {
  case authorizationNotGranted
  case unavailable

  var errorDescription: String? {
    switch self {
    case .authorizationNotGranted:
      return "Health access was not granted."
    case .unavailable:
      return "HealthKit is not available on this device."
    }
  }
}
