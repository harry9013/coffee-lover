import { describe, it, expect } from "vitest";
import {
  ratio,
  stageIncrements,
  validateStages,
  localDate,
  validDate,
  monthDays,
  guidance,
  parseImport,
  validateExperiment,
  changes,
} from "../src/domain";
import { sample } from "../src/sample";
import { LocalRepository, STORAGE_KEY } from "../src/persistence";
const espresso = () => structuredClone(sample.experiments[1]);
describe("mass ratios", () => {
  it("uses beverage grams, not optional volume", () => {
    const e = { ...espresso(), output: 36, volume: 60 };
    expect(ratio(e.dose, e.output)).toBe(2);
    expect(ratio(0, 36)).toBeNull();
    expect(ratio(18, NaN)).toBeNull();
  });
  it("does not accept missing yield", () => {
    expect(validateExperiment({ ...espresso(), output: NaN })).not.toEqual([]);
  });
});
describe("cumulative pour plan", () => {
  it("includes bloom once", () => {
    const s = [
      { seconds: 0, water: 45 },
      { seconds: 40, water: 145 },
      { seconds: 90, water: 250 },
    ];
    expect(stageIncrements(s).map((x) => x.increment)).toEqual([45, 100, 105]);
    expect(stageIncrements(s).reduce((n, x) => n + x.increment, 0)).toBe(250);
    expect(validateStages(s, 250)).toEqual([]);
  });
  it("rejects decreasing water, duplicate time, and total mismatch", () => {
    expect(
      validateStages(
        [
          { seconds: 0, water: 45 },
          { seconds: 0, water: 40 },
        ],
        250,
      ).length,
    ).toBe(3);
  });
  it("requires observed finish after final pour", () => {
    expect(
      validateExperiment({ ...sample.experiments[0], duration: 60 }),
    ).toContain("Brew duration cannot precede the final pour.");
  });
});
describe("local dates", () => {
  it("uses local components without UTC conversion", () => {
    const d = new Date(2026, 9, 27, 0, 5);
    expect(localDate(d)).toBe("2026-10-27");
  });
  it("handles leap days and month boundaries", () => {
    expect(validDate("2024-02-29")).toBe(true);
    expect(validDate("2026-02-29")).toBe(false);
    expect(validDate("2026-13-01")).toBe(false);
    expect(monthDays("2024-02")).toHaveLength(29);
    expect(monthDays("2026-12").at(-1)).toBe("2026-12-31");
  });
});
describe("conditional coaching", () => {
  it("separates sour strong from sour thin fast", () => {
    const a = espresso();
    a.sensory.sourness = 5;
    a.sensory.strength = 5;
    expect(guidance(a).test).toContain("yield");
    a.sensory.strength = 1;
    a.flow = "fast";
    expect(guidance(a).test).toContain("finer");
  });
  it("body alone does not indicate strength", () => {
    const a = espresso();
    a.sensory.sourness = 5;
    a.sensory.body = 5;
    a.sensory.strength = 1;
    expect(guidance(a).test).not.toContain("yield");
  });
  it("prioritizes repeatability for sour dry and stalled", () => {
    const a = espresso();
    a.sensory.sourness = 5;
    a.sensory.dryness = 5;
    a.flow = "stalled";
    expect(guidance(a).test).toContain("Distribute");
    expect(guidance(a).test).not.toMatch(/finer|Increase/);
  });
  it("does not correct a good 18 second shot", () => {
    const a = espresso();
    a.duration = 18;
    a.sensory.preference = 5;
    a.profile = [];
    expect(guidance(a).title).toContain("baseline");
  });
  it("does not prescribe grind without flow evidence", () => {
    const a = espresso();
    a.sensory.sourness = 5;
    a.sensory.strength = 1;
    a.flow = "unknown";
    expect(guidance(a).title).toBe("Observe the flow first");
  });
});
describe("versioned import trust boundary", () => {
  it("roundtrips sample and empty data", () => {
    expect(parseImport(JSON.stringify(sample))).toEqual(sample);
    expect(
      parseImport(
        JSON.stringify({
          version: 1,
          beans: [],
          experiments: [],
          drinks: [],
          places: [],
        }),
      ).beans,
    ).toEqual([]);
  });
  it.each(["not json", "{}", "null", '{"version":2}'])(
    "rejects malformed data: %s",
    (s) => expect(() => parseImport(s)).toThrow(),
  );
  it("rejects bad dates, nonnumeric units, duplicate IDs, invalid coordinates and broken references", () => {
    const mutations = [
      (d: any) => (d.beans[0].roastDate = "2026-02-30"),
      (d: any) => (d.experiments[0].dose = "15"),
      (d: any) => (d.beans[1].id = d.beans[0].id),
      (d: any) => (d.places[0].latitude = 91),
      (d: any) => (d.experiments[0].beanId = "missing"),
      (d: any) => (d.experiments[0].sensory.strength = 9),
      (d: any) => (d.beans[0].color = "url(https://example.com)"),
      (d: any) => (d.experiments[0].stages = [null]),
      (d: any) => (d.experiments[0].profileKind = "live"),
    ];
    for (const mutate of mutations) {
      const d = structuredClone(sample);
      mutate(d);
      expect(() => parseImport(JSON.stringify(d))).toThrow();
    }
  });
  it("requires exactly one consistent drink per experiment", () => {
    const d = structuredClone(sample);
    d.drinks.push({ ...d.drinks[0], id: "another-drink" });
    expect(() => parseImport(JSON.stringify(d))).toThrow();
    d.drinks.pop();
    d.drinks[0].date = "2026-10-20";
    expect(() => parseImport(JSON.stringify(d))).toThrow();
    d.drinks.shift();
    expect(() => parseImport(JSON.stringify(d))).toThrow();
  });
  it("keeps missing values distinct from zero in comparisons", () => {
    const a = espresso();
    const b = { ...a, temperature: undefined };
    expect(
      changes(a, b).find((c) => c.field === "temperature")?.after,
    ).toBeUndefined();
  });
  it("does not swallow storage errors", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error("Quota exceeded");
        },
      },
    });
    expect(new LocalRepository().load()).toBeNull();
    expect(() => new LocalRepository().save(sample)).toThrow("Quota");
    expect(STORAGE_KEY).toBe("coffee-lover.v1");
  });
});

describe("unknown sensory and strength-specific advice", () => {
  it("does not silently turn unknown taste into a low score", () => {
    const e = espresso();
    e.sensory.sourness = null;
    expect(guidance(e).title).toBe("Taste before adjusting");
    const d = structuredClone(sample);
    d.experiments[1].sensory.sourness = null;
    expect(
      parseImport(JSON.stringify(d)).experiments[1].sensory.sourness,
    ).toBeNull();
  });
  it("prioritizes invalid quantities over sensory advice", () => {
    const e = espresso();
    e.output = 0;
    e.sensory.sourness = 5;
    e.sensory.strength = 5;
    expect(guidance(e).title).toBe("Record the missing measurements");
  });
  it("suggests dilution for bitter strong without changing shot yield", () => {
    const e = espresso();
    e.sensory.bitterness = 5;
    e.sensory.strength = 5;
    expect(guidance(e).title).toBe("Test the strength separately");
    expect(guidance(e).test).toContain("Do not overwrite");
    expect(e.output).toBe(38);
  });
  it("suggests shorter beverage for bitter weak long output", () => {
    const e = espresso();
    e.sensory.bitterness = 5;
    e.sensory.strength = 1;
    e.output = 60;
    expect(guidance(e).title).toBe("Try a shorter beverage");
  });
  it("retains preferred acidity instead of treating it as a defect", () => {
    const e = espresso();
    e.sensory.sourness = 5;
    e.sensory.preference = 5;
    expect(guidance(e).title).toBe("Keep your preferred baseline");
  });
});
