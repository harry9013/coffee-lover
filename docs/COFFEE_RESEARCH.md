# Coffee Experiment Lab: research and guidance specification

Research checked: **26 October 2026**. Supplied by the parent research task. This document preserves its scientific model, proposed data requirements, conditional coaching rules, acceptance cases and sources. These are hypotheses for a private journal, not an automatic diagnosis or a substitute for tasting. Implementation coverage is listed at the end.

## 1. Core scientific model

### Strength is not extraction

Strength describes concentration of dissolved material; extraction describes how much of the dry coffee was dissolved. A short espresso can be strong yet insufficiently extracted. A long drink can be weak yet well extracted. The SCA research program cautions against one rectangular “ideal” zone representing everyone's preferred flavor. Roast and consumer preference matter. Collect perceived strength separately from sourness, bitterness, dryness, sweetness, body and enjoyment. Do not label preferred acidity a defect. [S1]

### Espresso: dose, beverage mass, flow and time

Record dry dose and final beverage mass in grams. Optional volume is separate: crema makes volume a poor comparison metric. Never silently treat 36 ml as 36 g. [S2]

At fixed dose, increasing beverage yield typically increases extraction and reduces concentration. This can help a sour, overly intense shot but can make an already thin shot thinner. [S3]

Duration is context, not a universal quality score. Preserve whether timing starts at pump activation, first water contact or first drop. Grind, basket, pressure and preinfusion change the relationship between time and yield. A tasty shot outside a familiar time range is not automatically wrong. [S4]

Dose should fit the basket and allow adequate headspace. Keep it stable in initial comparisons. A wet spent puck alone does not demonstrate bad extraction. [S5]

Finer grinding often increases surface and slows flow, but not indefinitely. Controlled experiments found very fine settings could reduce extraction and reproducibility through inhomogeneous flow. “Sour → always finer” is not a universal rule. The cited study does not prescribe its low-dose/coarse recipe for all espresso. [S6]

### Pour-over: a coupled process

Grind, additional water, temperature, pour rate, bed depth and agitation interact. A changed pour plan may affect contact, slurry temperature and water height together. Total brew time is an outcome and does not identify a fault by itself.

Fines can accumulate near filter pores, contributing to clogging, uneven flow and long drawdown. Exact migration mechanisms remain experimental; elapsed time or a photograph alone does not diagnose channeling. [S7]

Agitation can improve wetting but excessive or inconsistent disturbance can worsen clogging. Bloom experiments differ by method and batch size. Log bloom and agitation rather than promising a universally superior stir or swirl. [S8]

Blooming prewets grounds and releases gas. Two to three times the coffee dose in water is a common starting approach, not a requirement or universal optimum. Preserve bloom mass and duration separately, within total brew water. [S9]

### Temperature, water, roast and freshness

Temperature changes extraction kinetics. A drip study that held strength and extraction constant found smaller sensory differences than “hotter = bitter” advice implies. This does not mean temperature never matters or automatically generalize to espresso. Distinguish kettle setpoint from measured slurry temperature. [S10]

Water alkalinity buffers acidity; it differs from hardness and pH. TDS alone does not identify composition. Machine manufacturer water requirements take precedence. Suggest comparison with a known suitable source, not arbitrary salts or acids in a machine. [S11]

Roast and identity are confounders: darker coffee can remain bitter despite reasonable technique; fruit acidity can be intrinsic. Store roast/opening dates without universal expiry or mandatory rest claims. Degassing changes crema, reinforcing the case for beverage mass. [S1, S2]

### Sensory ambiguity

Sour is a taste; astringency is a drying tactile sensation; bitter is neither synonym. Distinguish sharp/tart from dry/puckering. Sour plus bitter can suggest uneven extraction but does not prove it. Tasting notes are observations, not measured extraction yield. [S12]

## 2. Proposed data model and units

Stable IDs; method-specific details; explicit unknowns, not invented recorded facts.

- Common brew: bag ID, recipe version, equipment, local date/time/timezone, method, servings; dose g; brew water g; optional beverage mass; separate added water/milk; grinder model/burr/setting/calibration; water source; temperature with measurement location; sensory intensities and enjoyment; preparation/flow observations, notes, provenance and edit history.
- Grinder settings are equipment-specific free text. The same number on different grinders is not equivalent; adjustment direction may differ.
- Espresso: target and actual beverage mass; duration and timing origin; first drop/preinfusion; machine/basket; pressure or flow target phases (alternative control modes, not necessarily jointly achievable); separate measured series. Do not fabricate smooth machine telemetry. Ratio is coffee : beverage mass.
- Pour-over: brewer/filter/material, preheat/rinse and percolation vs hybrid immersion; steps with start, action, incremental/cumulative water and optional end/rate; bloom is part of total water; actual finish separate from plan; optional actual step timestamps; bypass separate; valve states for hybrid brewers. Ratio is coffee : brew water, not final drink mass.
- Optional advanced measurement: refractometer TDS %, protocol, dilution and instrument. For the supported percolation calculation, approximate beverage extraction yield % = beverage mass g × TDS % / dose g. **No numeric extraction yield without measured TDS.** Sample preparation, temperature and suspended matter affect measurement. [S13]

## 3. Deterministic coaching rules (proposed product behavior)

These rules have not been experimentally validated as a coaching system. Output one prioritized experiment, why it may help, what remains fixed, expected trade-off and what would reject the hypothesis. Use “try,” “may,” and “compare”; no confidence percentages.

Priority: validate quantities/units → mixed sour/dry/bitter or inconsistent flow → strength vs balance complaint → one controllable variable within equipment limits → compare same bean/version, allowing preference for the original.

| Condition                                               | First experiment                                 | Constants / caveat                                                                           |
| ------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Espresso sour + strong, otherwise even                  | Slightly increase beverage mass                  | Fixed dose/grind; may dilute body. Time may naturally change.                                |
| Espresso sour + thin, unusually fast vs baseline        | One small finer step                             | Fixed dose/yield; no choking or uneven-flow warning. Equipment-specific.                     |
| Espresso sour + stalled/erratic/dry                     | Consistent distribution and suitable basket fill | Do not automatically grind finer or extend. If finer worsened flow, separately test coarser. |
| Espresso bitter + weak + long output, consistent        | Slightly reduce beverage mass                    | Fixed dose/grind; may strengthen/restore acidity. Dark-roast character may remain.           |
| Espresso bitter + overly strong, not dry                | Dilute a separate tasting portion                | Strength test, not extraction correction. Keep added water separate from yield.              |
| Good espresso at unconventional duration                | Save as preferred baseline                       | Do not correct it to 25–30 seconds.                                                          |
| Pour-over sour + weak, easy drawdown/consistent wetting | One small finer step                             | Same ratio/temp/plan; stop for erratic drawdown or rising dryness.                           |
| Pour-over sour + known cool/poor preheat                | Improve preheat OR modestly raise temperature    | One change only, equipment limits. Not default for stalled/dry brew.                         |
| Pour-over dry + stalled after vigorous swirling         | Reduce one agitation event                       | Same grind/water/temp. Separately try coarser or paper fit if needed.                        |
| Pour-over balanced + too strong                         | Small measured bypass in tasting portion         | No re-extraction; do not change original ratio.                                              |
| Pour-over balanced + too weak                           | Trial a stronger coffee-to-water ratio           | Bed depth/ratio can change extraction; re-dial may be needed.                                |
| Repeated sharp/flat cups across recipes                 | Review water source, roast and preference        | Never infer composition from pH/TDS or prescribe machine chemistry.                          |

Rule basis: espresso branches S3/S4/S6/S12; pour-over S7–S10; water S11. Demo values such as +10% yield are adjustable starting experiments, not guarantees. No hardware changes are performed.

## 4. Experiment workflow

Baseline → duplicate trial → select one independent variable → record actual outcomes → taste at comparable temperature → choose a preferred version. A changed yield naturally changes time; time is an outcome rather than a second deliberate intervention. Record confounders such as bean age, water or equipment. Repeat promising results before declaring a causal win. Blind A/B and side-by-side notes are optional future features. Say “associated with a higher rating,” not “proved better.” Preserve unsuccessful trials. Do not rank all beans by one extraction target.

## 5. Trust requirements

Explain source/date and conditions; version rules. No perfect-coffee guarantees, caffeine inference, medical claims or machine control. Respect equipment limits and manuals. Never recommend opening pressurized parts, bypassing protections or chemical boiler experiments. Timers allow large controls/pause and do not demand unsafe handling. Never label illustrative records as measured user history. No copied branded compass art.

## 6. Acceptance cases

1. Missing espresso yield: ask for it before ratio advice.
2. 18 g / 36 g = 1:2; 36 ml is not substituted for grams.
3. Sour/thin/fast selects grind hypothesis; sour/strong selects yield hypothesis.
4. Sour/dry/stalled suppresses automatic finer/hotter/longer advice.
5. Positive rating + 18-second shot is not a duration failure.
6. 45 g bloom + 100 g + 105 g = 250 g, not 295 g.
7. Cumulative 45/145/250 normalizes to 45/100/105 increments.
8. Bypass changes dilution metadata, not extracted-water history.
9. Plan timestamps cannot go backward; actual timings may differ.
10. No TDS means no numeric extraction yield; distinguish measurements and estimates.
11. Same setting on different grinders is not equivalent.
12. Unknown or contradictory symptoms produce a measured fallback.

## Sources

- **S1** SCA / UC Davis, [Towards a New Brewing Chart](https://sca.coffee/sca-news/25/issue-13/towards-a-new-brewing-chart-xpj8t).
- **S2** Barista Hustle, [Espresso Recipes: Measuring Yield](https://www.baristahustle.com/espresso-recipes-measuring-yield/).
- **S3** Barista Hustle, [Espresso Recipes: Understanding Yield](https://www.baristahustle.com/espresso-recipes-understanding-yield/).
- **S4** Barista Hustle, [Espresso Recipes: Time](https://www.baristahustle.com/espresso-recipes-time/).
- **S5** Barista Hustle, [Espresso Recipes: Analyzing Dose](https://www.baristahustle.com/espresso-recipes-analyzing-dose/).
- **S6** Cameron et al., _Systematically Improving Espresso: Insights from Mathematical Modeling and Experiment_, Matter 2 (2020), 631–648. [Primary study](https://doi.org/10.1016/j.matt.2019.12.019).
- **S7** Jonathan Gagné, [The Physics of Fines Migration](https://coffeeadastra.com/2020/02/01/the-physics-of-fines-migration/), expert interpretation with stated uncertainties.
- **S8** Barista Hustle, [Stirring Strikes Back](https://www.baristahustle.com/stirring-strikes-back/), follow-up experiments qualifying earlier findings.
- **S9** Barista Hustle, [Blooming and Clogging](https://www.baristahustle.com/blooming-and-clogging/), a small experiment, not a universal recipe.
- **S10** SCA / UC Davis, [How Hot is Hot Enough?](https://sca.coffee/sca-news/25/issue-15/how-hot-is-hot-enough-brew-temperature-sensory-profile-and-consumer-acceptance-of-brewed-coffee-5dj5b). [Associated primary paper](https://www.nature.com/articles/s41598-020-73341-4.pdf). Parent research reported HTML retrieval blocked; conclusion checked against SCA summary, not represented as full paper review.
- **S11** Marco Wellinger / SCA, [Water and Coffee Acidity](https://sca.coffee/sca-news/25/issue-9/english/water-and-coffee-acidity-how-to-adapt-your-water-for-different-extraction-methods-25-magazine-issue-9-pxjby).
- **S12** Barista Hustle, [The Espresso Compass](https://www.baristahustle.com/the-espresso-compass/) and [explanatory PDF](https://www.baristahustle.com/wp-content/uploads/2021/09/Espresso-Compass.pdf).
- **S13** Barista Hustle, [Coffee Algebra Cheatsheet](https://www.baristahustle.com/wp-content/uploads/2018/09/Coffee-Algebra-Cheatsheet-A5.pdf); Gagné, [measurement procedure](https://coffeeadastra.com/2019/09/21/measuring-coffee-concentration-with-a-0-01-precision/).
- Additional expert check: Gagné, [Why Can't We Grind Coffee Finer for Pour-Over?](https://coffeeadastra.com/2020/04/02/why-cant-we-grind-coffee-finer-for-pour-over/).

## First-version coverage and deferred work

Implemented: independent nullable sensory intensities; unknown flow; mass-based ratios; separate optional ml; timing convention and actual duration; cumulative timed pour targets and computed additions; target/recorded pressure provenance with exact table; trial lineage; changed-variable comparison; conditional single-variable suggestions with evidence/constants/uncertainty/source; one linked calendar drink; no inferred extraction percentage; no machine control.

Simplifications: one shelf entry per bag/batch; recipe plan lives inside an experiment snapshot; trials increment lineage version but editing is not an immutable revision archive. Temperature is labeled setpoint only. Water, machine/basket, bloom duration, agitation, confounders and separate dilution quantities can be recorded in free notes; no structured preheat, water-chemistry or bypass fields yet. No TDS computation, automatic recipe scaling, actual per-stage timestamp capture, photos or telemetry. Corresponding advanced coaching branches are intentionally not automated without their required evidence. Dates are local calendar dates, not full time/timezone event histories. Future schema migrations must preserve unknown values and these provenance distinctions.
