# Independent adversarial review

Reviewed in the cloud on 26 October 2026 by a separate read-only reviewer, followed by fixes and regression tests by the implementation agent. No publication or remote push.

## Verified findings and resolutions

| Finding                                                                  | Resolution                                                                                                            | Regression evidence                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| A 10,001-character note saved but failed schema validation after reload  | Shared fields enforce text bounds; `LocalRepository.save` validates the same schema as import before touching storage | Long text UI save/reload and invalid-write unit test                                                 |
| Clicking the selected method cleared actual duration and pressure points | Same-method selection is a no-op                                                                                      | 29-second sample retains all five points after repeated Espresso selection                           |
| Skip-to-content used a hash that changed Lab to Shelf                    | Prevent hash navigation, explicitly focus and scroll main                                                             | Keyboard activation preserves module and focuses main                                                |
| Data & privacy unavailable at tablet widths                              | Topbar settings visible through the sidebar-collapse breakpoint                                                       | 768 px export access checked                                                                         |
| Planned pressure points constrained actual shot duration                 | Only recorded points are bounded by actual duration; target horizon is independent, capped at 7200 s                  | 18-second actual with 29-second target accepted; recorded equivalent rejected; chart spans full plan |
| Cyclic trial ancestry accepted on import                                 | Iterative lineage-cycle validation                                                                                    | A/B cycle rejected, valid ancestry accepted                                                          |
| Espresso sour/thin with merely even flow suggested finer grinding        | Finer espresso branch requires fast flow relative to baseline; even flow gets an observational fallback               | Separate even/fast guidance assertions                                                               |

## Positive review findings

- Mixed sour/dry or stalled/erratic flow is prioritized before automatic finer or yield advice.
- Strength and body are separate. Unknown sensory entries remain unknown. Different grinders trigger comparison caveats.
- UTC+8 midnight transitions preserve recorded local dates; no UTC conversion is used for grouping.
- Experiment create/edit/delete keeps exactly one consistent calendar drink, with appropriate cascading deletion.
- Cumulative pours count bloom once and validate monotonic times/water and final total.
- React escapes user/imported text; imported color values are restricted hex.
- Timer resets on module navigation as disclosed. Timestamp-based elapsed recovery does not claim background alarms.
- Recipe scaling is not implemented; documentation defers it and makes no claim that time scales linearly.

## Review scope limits

Automated Chromium coverage, desktop/mobile viewport simulation and selected axe scans are not physical-device or screen-reader certification. No native app, production authentication, sync, telemetry or server security review is represented as complete.

The source archive and offline preview exclude internal browser screenshots. The offline preview is the functioning app with bundled assets, not a static mock. Its verification checks variant switching, module navigation, saved drink persistence, no external requests and no runtime errors.
