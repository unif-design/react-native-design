import XCTest

final class LiquidGlassScreenshots: XCTestCase {
  private let nativeBundle = "unif.design.glassvalidation"

  override func setUpWithError() throws {
    continueAfterFailure = false
  }

  private func capture(_ name: String) {
    let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
    attachment.name = name
    attachment.lifetime = .keepAlways
    add(attachment)
  }

  private func waitForLabel(_ element: XCUIElement, containing text: String) {
    XCTAssertTrue(element.waitForExistence(timeout: 15))
    let predicate = NSPredicate(format: "label CONTAINS %@", text)
    expectation(for: predicate, evaluatedWith: element)
    waitForExpectations(timeout: 15)
  }

  private func scene(_ name: String, scheme: String, reduced: Bool = false) -> XCUIApplication {
    let app = XCUIApplication(bundleIdentifier: nativeBundle)
    app.launchArguments = ["-glassScene", name, "-glassScheme", scheme]
    app.launch()
    waitForLabel(app.staticTexts["glass-status"], containing: "支持:true")
    waitForLabel(app.staticTexts["glass-status"], containing: "减少透明度:\(reduced)")
    return app
  }

  func testNativeMaterials() {
    let mode = "native"
    for scheme in ["light", "dark"] {
      for name in ["overview", "menu-top", "menu-bottom", "text", "toast", "confirm", "image"] {
        let app = scene(name, scheme: scheme)
        if name == "toast" {
          XCTAssertTrue(app.staticTexts["已保存本次修改"].waitForExistence(timeout: 10))
        } else if name == "confirm" {
          XCTAssertTrue(app.staticTexts["删除附件？"].waitForExistence(timeout: 10))
        } else if name == "image" {
          XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "第1张，共2张")).firstMatch.waitForExistence(timeout: 10))
        }
        capture("\(mode)-\(scheme)-\(name)")

        if name == "menu-top" || name == "menu-bottom" {
          app.buttons["删除聊天"].tap()
          XCTAssertTrue(app.staticTexts["此操作无法撤销。"].waitForExistence(timeout: 5))
          XCTAssertEqual(app.buttons.matching(identifier: "删除").count, 1)
          XCTAssertEqual(app.buttons.matching(identifier: "取消").count, 0)
          capture("\(mode)-\(scheme)-\(name)-delete-confirmation")
          app.buttons["删除"].tap()
          waitForLabel(app.staticTexts["glass-result"], containing: "动作：删除")
        } else if name == "overview" {
          app.buttons.matching(identifier: "玻璃按钮").firstMatch.tap()
          app.buttons.matching(identifier: "玻璃图标按钮").firstMatch.tap()
          app.descendants(matching: .any).matching(identifier: "glass-segments-done").firstMatch.tap()
          app.descendants(matching: .any).matching(identifier: "glass-tabs-history").firstMatch.tap()
          waitForLabel(app.staticTexts["glass-result"], containing: "点击:2 · 选项:done · 导航:history")
          capture("\(mode)-\(scheme)-overview-selected")
        } else if name == "confirm" {
          app.buttons.matching(identifier: "取消").firstMatch.tap()
          waitForLabel(app.staticTexts["glass-result"], containing: "已取消")
        } else if name == "text" {
          app.buttons.matching(identifier: "取消").firstMatch.tap()
          waitForLabel(app.staticTexts["glass-result"], containing: "编辑已取消")
        }
        app.terminate()
      }
    }
  }

  func testMenuThemeOverride() {
    XCTAssertEqual(XCUIDevice.shared.appearance, .light)
    for scheme in ["light", "dark"] {
      for name in ["menu-top", "menu-bottom"] {
        let app = scene(name, scheme: scheme)
        capture("group-fixed-\(scheme)-\(name)")
        app.buttons["删除聊天"].tap()
        XCTAssertTrue(app.staticTexts["此操作无法撤销。"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.buttons.matching(identifier: "删除").count, 1)
        XCTAssertEqual(app.buttons.matching(identifier: "取消").count, 0)
        capture("group-fixed-\(scheme)-\(name)-delete-confirmation")
        app.buttons["删除"].tap()
        waitForLabel(app.staticTexts["glass-result"], containing: "动作：删除")
        app.terminate()
      }
    }
  }

  func testToastMaterial() {
    for scheme in ["light", "dark"] {
      let app = scene("toast", scheme: scheme)
      XCTAssertTrue(app.staticTexts["已保存本次修改"].waitForExistence(timeout: 10))
      capture("toast-fixed-\(scheme)")
      app.terminate()
    }
  }

  func testGlassSegmentedCapsule() {
    for scheme in ["light", "dark"] {
      let app = scene("overview", scheme: scheme)
      waitForLabel(app.staticTexts["glass-result"], containing: "选项:all")
      capture("native-\(scheme)-overview")
      app.descendants(matching: .any).matching(identifier: "glass-segments-done").firstMatch.tap()
      waitForLabel(app.staticTexts["glass-result"], containing: "选项:done")
      capture("native-\(scheme)-overview-selected")
      app.terminate()
    }
  }

  func testButtonMaterialStates() {
    for scheme in ["light", "dark"] {
      let app = scene("overview", scheme: scheme)
      let disabled = app.buttons.matching(identifier: "禁用玻璃按钮").firstMatch
      let busy = app.buttons.matching(identifier: "忙碌玻璃图标").firstMatch
      XCTAssertFalse(disabled.isEnabled)
      XCTAssertFalse(busy.isEnabled)
      capture("button-fixed-\(scheme)-idle-disabled-busy")
      app.buttons.matching(identifier: "玻璃按钮").firstMatch.tap()
      app.buttons.matching(identifier: "玻璃图标按钮").firstMatch.tap()
      waitForLabel(app.staticTexts["glass-result"], containing: "点击:2")
      disabled.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
      busy.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
      waitForLabel(app.staticTexts["glass-result"], containing: "点击:2")
      capture("button-fixed-\(scheme)-after-press")
      app.terminate()
    }
  }

  private func displaySettings() -> (XCUIApplication, XCUIElement) {
    let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
    settings.launchArguments = ["-AppleLanguages", "(en)"]
    settings.launch()
    let preference = settings.switches["Reduce Transparency"]
    if !preference.waitForExistence(timeout: 2) {
      let titles = settings.staticTexts["Display & Text Size"].exists
        ? ["Display & Text Size"] : ["Accessibility", "Display & Text Size"]
      for title in titles {
        let item = settings.staticTexts.matching(identifier: title).firstMatch
        for _ in 0..<6 where !item.isHittable { settings.swipeUp() }
        XCTAssertTrue(item.waitForExistence(timeout: 10), settings.debugDescription)
        item.tap()
      }
    }
    for _ in 0..<5 where !preference.isHittable { settings.swipeUp() }
    XCTAssertTrue(preference.waitForExistence(timeout: 10), settings.debugDescription)
    return (settings, preference)
  }

  func testSettingsNavigation() {
    let (settings, preference) = displaySettings()
    XCTAssertTrue(preference.isHittable)
    capture("settings-reduce-transparency-before")
    settings.terminate()
  }

  private func setTransparency(_ preference: XCUIElement, enabled: Bool) {
    if (preference.value as? String == "1") != enabled {
      // iOS 27 exposes the entire Settings row as a switch; touch its control.
      preference.coordinate(withNormalizedOffset: CGVector(dx: 0.92, dy: 0.5)).tap()
    }
    expectation(for: NSPredicate(format: "value == %@", enabled ? "1" : "0"), evaluatedWith: preference)
    waitForExpectations(timeout: 10)
  }

  private func captureReduced(_ scenes: [String], prefix: String) {
    let (settings, preference) = displaySettings()
    let wasEnabled = preference.value as? String == "1"
    addTeardownBlock {
      let (settings, preference) = self.displaySettings()
      self.setTransparency(preference, enabled: wasEnabled)
      self.capture("settings-reduce-transparency-restored")
      settings.terminate()
    }
    setTransparency(preference, enabled: true)
    capture("settings-reduce-transparency-enabled")
    settings.terminate()
    for scheme in ["light", "dark"] {
      for name in scenes {
        let app = scene(name, scheme: scheme, reduced: true)
        if name == "toast" {
          XCTAssertTrue(app.staticTexts["已保存本次修改"].waitForExistence(timeout: 10))
        } else if name == "confirm" {
          XCTAssertTrue(app.staticTexts["删除附件？"].waitForExistence(timeout: 10))
        } else if name == "image" {
          XCTAssertTrue(app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "第1张，共2张")).firstMatch.waitForExistence(timeout: 10))
        }
        capture("\(prefix)-\(scheme)-\(name)")
        app.terminate()
      }
    }
  }

  func testReducedTransparency() {
    captureReduced(["overview", "menu-top", "menu-bottom", "text", "toast", "confirm", "image"], prefix: "reduced-transparency")
  }

  func testFocusedReducedMaterials() {
    captureReduced(["menu-top", "menu-bottom", "toast"], prefix: "final-reduced")
  }
}
