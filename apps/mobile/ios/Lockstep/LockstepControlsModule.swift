import FamilyControls
import React
import SwiftUI

@objc(LockstepControls)
final class LockstepControlsModule: RCTEventEmitter {
  private var hasListeners = false

  override init() {
    super.init()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleStateChange),
      name: .lockstepStateChanged,
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    ["lockstepStateChanged"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(requestAuthorization:rejecter:)
  func requestAuthorization(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task { @MainActor in
      do {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        try LockstepSharedState.scheduleDailyReset()
        LockstepSharedState.applyShield()

        LockstepHealthCoordinator.shared.requestAuthorization { result in
          DispatchQueue.main.async {
            switch result {
            case .success:
              resolve(self.currentState())
            case .failure(let error):
              reject("HEALTH_AUTHORIZATION_FAILED", error.localizedDescription, error)
            }
          }
        }
      } catch {
        reject("FAMILY_CONTROLS_AUTHORIZATION_FAILED", error.localizedDescription, error)
      }
    }
  }

  @objc(getState:rejecter:)
  func getState(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter _: @escaping RCTPromiseRejectBlock
  ) {
    resolve(currentState())
  }

  @objc(refreshSteps:rejecter:)
  func refreshSteps(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    LockstepHealthCoordinator.shared.refreshSteps { result in
      DispatchQueue.main.async {
        switch result {
        case .success:
          resolve(self.currentState())
        case .failure(let error):
          reject("HEALTH_REFRESH_FAILED", error.localizedDescription, error)
        }
      }
    }
  }

  @objc(setGoal:resolver:rejecter:)
  func setGoal(
    _ goal: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter _: @escaping RCTPromiseRejectBlock
  ) {
    LockstepSharedState.goal = goal.intValue
    notifyStateChanged()
    resolve(currentState())
  }

  @objc(setBlockingEnabled:resolver:rejecter:)
  func setBlockingEnabled(
    _ enabled: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter _: @escaping RCTPromiseRejectBlock
  ) {
    LockstepSharedState.blockingEnabled = enabled
    notifyStateChanged()
    resolve(currentState())
  }

  @objc(clearSelection:rejecter:)
  func clearSelection(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter _: @escaping RCTPromiseRejectBlock
  ) {
    LockstepSharedState.selection = FamilyActivitySelection()
    LockstepSharedState.applyShield()
    notifyStateChanged()
    resolve(currentState())
  }

  @objc(presentActivityPicker:rejecter:)
  func presentActivityPicker(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard AuthorizationCenter.shared.authorizationStatus == .approved else {
        reject(
          "FAMILY_CONTROLS_NOT_AUTHORIZED",
          "Allow Screen Time access before choosing apps.",
          nil
        )
        return
      }

      guard let presenter = Self.topViewController() else {
        reject("PICKER_PRESENTATION_FAILED", "Unable to present the app picker.", nil)
        return
      }

      var hostingController: UIHostingController<LockstepActivityPickerView>?
      let picker = LockstepActivityPickerView(
        selection: LockstepSharedState.selection,
        onCancel: {
          hostingController?.dismiss(animated: true)
          resolve(self.currentState())
        },
        onDone: { selection in
          LockstepSharedState.selection = selection
          LockstepSharedState.applyShield()
          self.notifyStateChanged()
          hostingController?.dismiss(animated: true)
          resolve(self.currentState())
        }
      )

      hostingController = UIHostingController(rootView: picker)
      hostingController?.modalPresentationStyle = .pageSheet
      guard let hostingController else { return }
      presenter.present(hostingController, animated: true)
    }
  }

  @objc
  private func handleStateChange() {
    notifyStateChanged()
  }

  private func notifyStateChanged() {
    guard hasListeners else { return }
    sendEvent(withName: "lockstepStateChanged", body: currentState())
  }

  private func currentState() -> [String: Any] {
    LockstepSharedState.stateDictionary(
      authorizationStatus: Self.authorizationStatusString()
    )
  }

  private static func authorizationStatusString() -> String {
    switch AuthorizationCenter.shared.authorizationStatus {
    case .approved:
      return "approved"
    case .denied:
      return "denied"
    case .notDetermined:
      return "notDetermined"
    @unknown default:
      return "unknown"
    }
  }

  private static func topViewController(
    from base: UIViewController? = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first(where: \.isKeyWindow)?
      .rootViewController
  ) -> UIViewController? {
    if let navigationController = base as? UINavigationController {
      return topViewController(from: navigationController.visibleViewController)
    }
    if let tabBarController = base as? UITabBarController {
      return topViewController(from: tabBarController.selectedViewController)
    }
    if let presented = base?.presentedViewController {
      return topViewController(from: presented)
    }
    return base
  }
}
