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

  func testToastMaterialLifecycle() {
    for scheme in ["light", "dark"] {
      let app = scene("toast-lifecycle", scheme: scheme)
      let trigger = app.buttons.matching(identifier: "显示提示").firstMatch
      trigger.tap()
      XCTAssertTrue(app.staticTexts["材质提示 1"].waitForExistence(timeout: 2))
      capture("toast-lifecycle-\(scheme)-first")
      trigger.tap()
      XCTAssertTrue(app.staticTexts["材质提示 2"].waitForExistence(timeout: 2))
      XCTAssertFalse(app.staticTexts["材质提示 1"].exists)
      capture("toast-lifecycle-\(scheme)-replacement")
      let dismissed = NSPredicate(format: "exists == false")
      expectation(for: dismissed, evaluatedWith: app.staticTexts["材质提示 2"])
      waitForExpectations(timeout: 5)
      capture("toast-lifecycle-\(scheme)-dismissed")
      trigger.tap()
      XCTAssertTrue(app.staticTexts["材质提示 3"].waitForExistence(timeout: 2))
      capture("toast-lifecycle-\(scheme)-remounted")
      app.terminate()
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

  func testCompleteControls() {
    checkCompleteControls(includeNavigation: true)
  }

  func testRefinedMaterials() {
    checkCompleteControls(includeNavigation: false)
    for scheme in ["light", "dark"] {
      for name in ["text", "confirm"] {
        let app = scene(name, scheme: scheme)
        if name == "confirm" {
          XCTAssertTrue(app.staticTexts["删除附件？"].waitForExistence(timeout: 10))
        }
        capture("refined-\(scheme)-\(name)")
        app.buttons.matching(identifier: "取消").firstMatch.tap()
        waitForLabel(app.staticTexts["glass-result"], containing: name == "confirm" ? "已取消" : "编辑已取消")
        app.terminate()
      }
    }
  }

  private func checkCompleteControls(includeNavigation: Bool) {
    for scheme in ["light", "dark"] {
      var app = scene("controls", scheme: scheme)
      let busyChip = app.buttons.matching(identifier: "忙碌标签").firstMatch
      let disabledChip = app.buttons.matching(identifier: "禁用标签").firstMatch
      let disabledButton = app.buttons.matching(identifier: "禁用次要操作").firstMatch
      let slotChip = app.buttons.matching(identifier: "带操作标签").firstMatch
      XCTAssertFalse(busyChip.isEnabled)
      XCTAssertFalse(disabledChip.isEnabled)
      XCTAssertFalse(disabledButton.isEnabled)
      XCTAssertFalse(slotChip.isEnabled)
      capture("complete-\(scheme)-controls")
      app.buttons.matching(identifier: "筛选客户").firstMatch.tap()
      app.buttons.matching(identifier: "数量，增加").firstMatch.tap()
      app.descendants(matching: .any).matching(identifier: "glass-switch").firstMatch.tap()
      app.buttons.matching(identifier: "次要操作").firstMatch.tap()
      busyChip.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
      disabledChip.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
      disabledButton.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
      slotChip.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
      slotChip.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.5)).tap()
      waitForLabel(app.staticTexts["glass-result"], containing: "点击:1")
      waitForLabel(app.staticTexts["glass-result"], containing: "筛选:true · 数量:1 · 通知:true")
      capture("complete-\(scheme)-controls-selected")
      app.buttons.matching(identifier: "清除搜索内容").firstMatch.tap()
      let search = app.descendants(matching: .any).matching(identifier: "glass-search-input").firstMatch
      search.tap()
      search.typeText("store\n")
      waitForLabel(app.staticTexts["glass-result"], containing: "搜索：store")
      capture("complete-\(scheme)-search-submitted")
      app.terminate()

      if includeNavigation {
        app = scene("navigation", scheme: scheme)
        capture("complete-\(scheme)-navigation")
        app.buttons.matching(identifier: "返回项目").firstMatch.tap()
        app.descendants(matching: .any).matching(identifier: "glass-entry").firstMatch.tap()
        app.descendants(matching: .any).matching(identifier: "glass-page-tabs-history").firstMatch.tap()
        waitForLabel(app.staticTexts["glass-result"], containing: "点击:2")
        waitForLabel(app.staticTexts["glass-result"], containing: "导航:history")
        app.descendants(matching: .any).matching(identifier: "glass-carousel").firstMatch.swipeLeft()
        app.descendants(matching: .any).matching(identifier: "glass-carousel-item-1").firstMatch.tap()
        waitForLabel(app.staticTexts["glass-result"], containing: "轮播：2")
        capture("complete-\(scheme)-navigation-selected")
        app.terminate()
      }

      app = scene("sheet", scheme: scheme)
      app.buttons.matching(identifier: "保留选择").firstMatch.tap()
      waitForLabel(app.staticTexts["glass-result"], containing: "点击:1")
      capture("complete-\(scheme)-sheet")
      app.terminate()
    }
  }

  func testCompleteReducedMaterials() {
    captureReduced(["controls", "navigation", "sheet"], prefix: "complete-reduced")
  }

  func testRefinedReducedMaterials() {
    captureReduced(["controls", "sheet", "text", "confirm"], prefix: "refined-reduced")
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
        if name == "text" || name == "confirm" {
          app.buttons.matching(identifier: "取消").firstMatch.tap()
          waitForLabel(app.staticTexts["glass-result"], containing: name == "confirm" ? "已取消" : "编辑已取消")
        }
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
