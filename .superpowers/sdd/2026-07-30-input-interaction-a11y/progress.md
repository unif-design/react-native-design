# SDD ledger — plan: docs/superpowers/plans/2026-07-30-input-interaction-a11y.md
Task 1: complete (commits 3d34e8..8f486ba, review clean; public barrel export explicitly deferred to Task 2; retrospective RED evidence unavailable)
Task 2: partial RED fixtures present as untracked files; implementation not started
Tasks 2+3: combined atomic migration in progress from BASE 43385d7 — strict Input immediately breaks the only two existing consumers (Search/PasswordInput), while Task 2 requires a green full typecheck and forbids compatibility casts/no-op escape hatches
Final-review carryover: harden `assertRuntimeScreenSafeArea` with injectable-source mutation tests for actual SafeAreaProvider JSX presence/nesting while these tasks update the same runtime screen
Tasks 2+3: fix round 1/5 in progress after review of commit 12e3fa8 — open: preserve `value !== undefined` for invalid runtime values; validate action handler/name at runtime; remove stale Input compatibility comment
Tasks 2+3: controller runtime checks added to the same round — move harness `useColors` under its ThemeProvider; ensure Search 44pt interactive children are not descendants of a 36pt hit-test parent
Tasks 2+3: fix round 1/5 (5 addressed, 1 open — Input/Textarea do not isolate internal `searchLayout`; controller confirmed the same spread order also lets untyped `multiline` override the wrapper mode; commit 0d97baf)
Tasks 2+3: fix round 2/5 (1 addressed, 0 open — public wrappers now isolate `searchLayout` and `multiline`; commit e30f1d0)
Tasks 2+3: complete (commits 43385d7..e30f1d0, review clean)
Task 4: fix round 1/5 in progress after review of b6d8e62 — open: harden NavBar icon/plain-object/ReactNode boundaries; add manual runtime cases and pure/type coverage; record each Design Skill impact
Task 4: controller check added to round 1 — Confirm buttons remain nested under `actionSlot`, so their `flex: 1` does not act on the action row main axis; make them direct row children and remove lint-warning layout
Task 4: fix round 1/5 (4 addressed, 2 open; commit dcb8485) — React 19 current element marker can still be forged, and classifier narrows public ReactNode by rejecting bigint, Iterable, portal, Promise and nested empty nodes
Task 4: fix round 2/5 complete (commit d5cfc82) — preserved approved ReactNode contract; hardened React 19 malformed element/portal shapes; added broad-node characterization and updated current-marker manual seam
Task 4: fix round 2/5 (3 addressed, 1 new Important; commit d5cfc82) — shallow Iterable acceptance lets malformed arrays, Sets and invalid iterator factories escape into React reconciliation
Task 4: fix round 3/5 complete (commit cf6d2e7) — recursively validate and normalize Array/Iterable output; preserve object-only ReactNode precedence, thenable fallback, iterator close semantics and ToBoolean done handling
Task 4: fix round 3/5 (1 addressed, 0 open; commit cf6d2e7) — Iterable validation, normalization, cycle handling, IteratorClose and React 19 precedence approved
Task 4: complete (commits e30f1d0..cf6d2e7, review clean)
Task 5: implementation in progress from BASE cf6d2e7 — accessible-name type fixtures added and expected `yarn typecheck` RED captured
Task 5: core + consumer migration green — root/Website typecheck and implementation-time Website build pass; final full verification and commit pending
Task 5: implementation complete at 4633ee0 — all required local gates pass; controller review pending
Task 5: post-review Minor polish round 1/5 in progress from 4633ee0 — clarify fixed outer vs scaled visual Switch measurements and report completion tense
Task 5: task review approved at 4633ee0 with 0 Critical / 0 Important / 2 Minor — polish measurement wording for scaled native visual frame and normalize report completion tense
Task 5: minor polish round 1/5 in progress
Task 5: minor polish round 1/5 (2 addressed, 0 open; commit cf95106)
Task 5: complete (commits cf6d2e7..cf95106, review clean; Radio.Group native announcement remains a verification-matrix manual gate)
Task 5: Minor polish round 1/5 complete at cf95106 — fixed scaled visual measurement wording and report completion tense; required gates pass
Task 6: implementation complete from BASE cf95106 — Cell explicit actionable/control/static union, pure content helper, public exports, tracked consumers, Website/llms and manual cases complete; required local gates pass, commit pending
Task 6: implementation complete at 0569b8e — required local gates and hooks pass; controller review pending
Task 6: fix round 1/5 in progress from 0569b8e — restrict static display to decorative content (`accessibilityText?: never`), preserve actionable display semantics, sync approved contract/docs/manual evidence, and remove aggregate-doc formatting noise
Task 6: fix round 1/5 complete at 54f6e73 — 1 Important + 2 Minor addressed; RED/GREEN type fixture, focused/full tests, typechecks, prepare, lint, final llms/Website builds and hooks pass; native/Web a11y inspection remains manual
Task 6: complete (commits cf95106..54f6e73, review clean; RN 0.86.2 harness, Website Inspector/screen reader and sibling Design Skill sync remain final-plan gates)
Task 7: implementation complete from BASE 54f6e73 at 6688c0a — pure normalizer + required contextual name + three real 44pt frames, consumers/Website/llms/manual updated; RED/GREEN, focused/full Jest, root/Website typechecks, prepare, target lint, llms/Website builds, d.ts and diff gates pass; controller review pending; RN 0.86.2/Web Inspector + screen reader and sibling Design Skill sync remain final-plan gates
Task 7: original review of 54f6e73..6688c0a returned 5 Important + 1 Minor — missing Web slider ARIA/keyboard; impossible iOS standard-direction filtering claim; fixed-44 vs unbounded visual conflict; fixed-sm docs; missing default/layout pure gates; Web side mislabeled RNGH
Task 7: supplemental design approved at 9969d06 — normalized state single source + native/Web accessibility drivers + platform Pressable seam + dynamic at-least-44pt outer; invalid native standard directions are capability-guarded no-ops
Task 7: original review closed by d8aa35b + 08e3d72 — focused 4/26 and full 20/280 Jest, root/Website typechecks, prepare, target lint, llms/Website builds, declaration isolation and actual enabled/disabled SSR assertions pass; RN 0.86.2 Inspector/VoiceOver/TalkBack, browser screen reader and sibling Design Skill sync remain final-plan gates
Task 7: 最终 reviewer 结论 for 6688c0a..08e3d72 — original 5 Important + 1 Minor all ADDRESSED; no new Critical / Important / Minor; RN 0.86.2 Inspector/VoiceOver/TalkBack, browser screen reader and sibling Design Skill gates remain open
Task 8: implementation in progress from BASE 08e3d72 — strict Carousel display/action union, reduced-motion autoplay and pagination frame/a11y behavior
Task 8: review approved at 163c135 with 0 Critical / 0 Important / 2 Minor; polish round 1 in progress — add negative helper branches and correct stale overlay comment
Task 8: polish round 1 complete at 0bc8a11 — 2 Minor addressed, no new breakage
Task 8: complete (commits 08e3d72..0bc8a11, review clean; runtime hierarchy, screen reader, reduced-motion autoplay and single-page measurement remain final manual gates)
Task 9: implementation in progress from BASE 0bc8a11 — explicit Logo/Grid display names, decorative Drawer avatar, and visible structured VersionPill status
Task 9: implementation complete from BASE 0bc8a11 — RED/GREEN pure and type fixtures, source/barrels, Website/llms and manual harness complete; required local gates pass, commit pending
