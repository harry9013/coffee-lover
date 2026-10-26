export type Method = "espresso" | "pour-over";
export type Bean = {
  id: string;
  name: string;
  roaster: string;
  origin: string;
  process: string;
  roastDate: string;
  notes: string;
  status: "active" | "finished" | "archived";
  color: string;
};
export type Stage = { seconds: number; water: number };
export type ProfilePoint = { seconds: number; bars: number };
export type Sensory = {
  sourness: number | null;
  bitterness: number | null;
  dryness: number | null;
  sweetness: number | null;
  strength: number | null;
  body: number | null;
  preference: number | null;
};
export type Experiment = {
  id: string;
  name: string;
  beanId: string;
  method: Method;
  date: string;
  dose: number;
  output: number;
  volume?: number;
  duration: number;
  timing: string;
  grinder: string;
  grind: string;
  temperature?: number;
  stages: Stage[];
  profile: ProfilePoint[];
  profileKind: "target" | "recorded";
  sensory: Sensory;
  notes: string;
  version: number;
  flow: "unknown" | "even" | "fast" | "stalled" | "erratic";
  parentId?: string;
};
export type Drink = {
  id: string;
  date: string;
  name: string;
  method: Method;
  beanId: string;
  notes: string;
  experimentId?: string;
  placeId?: string;
};
export type Place = {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  notes: string;
  visits: string[];
};
export type Data = {
  version: 1;
  beans: Bean[];
  experiments: Experiment[];
  drinks: Drink[];
  places: Place[];
};
export const sensoryDefault: Sensory = {
  sourness: null,
  bitterness: null,
  dryness: null,
  sweetness: null,
  strength: null,
  body: null,
  preference: null,
};
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}
export const ratio = (dose: number, water: number): number | null =>
  Number.isFinite(dose) && Number.isFinite(water) && dose > 0 && water > 0
    ? water / dose
    : null;
export function stageIncrements(stages: Stage[]) {
  return stages.map((s, i) => ({
    ...s,
    increment: s.water - (stages[i - 1]?.water ?? 0),
  }));
}
export function validateStages(stages: Stage[], output?: number): string[] {
  const errors: string[] = [];
  if (!stages.length) errors.push("Add at least one water stage.");
  stages.forEach((s, i) => {
    if (
      !Number.isFinite(s.seconds) ||
      s.seconds < 0 ||
      (i > 0 && s.seconds <= stages[i - 1].seconds)
    )
      errors.push(`Stage ${i + 1}: times must increase and be nonnegative.`);
    if (
      !Number.isFinite(s.water) ||
      s.water <= 0 ||
      (i > 0 && s.water <= stages[i - 1].water)
    )
      errors.push(`Stage ${i + 1}: cumulative water must increase.`);
  });
  if (
    output !== undefined &&
    stages.length &&
    Math.abs(stages.at(-1)!.water - output) > 0.01
  )
    errors.push("Final cumulative water must equal total water.");
  return errors;
}
export function validateExperiment(e: Experiment): string[] {
  const errors: string[] = [];
  if (!e.name.trim()) errors.push("Name is required.");
  if (
    ![
      "Pump on to pump off",
      "First drop to finish",
      "First water to drawdown",
    ].includes(e.timing)
  )
    errors.push("Choose a supported timing convention.");
  if (!validDate(e.date)) errors.push("Use a valid local date.");
  for (const [label, value, max] of [
    ["Dose", e.dose, 1000],
    ["Output / water", e.output, 10000],
    ["Duration", e.duration, 7200],
  ] as const)
    if (!Number.isFinite(value) || value <= 0 || value > max)
      errors.push(`${label} must be greater than 0 and at most ${max}.`);
  if (!e.grinder.trim() || !e.grind.trim())
    errors.push("Enter grinder and its setting.");
  if (
    e.volume !== undefined &&
    (!Number.isFinite(e.volume) || e.volume <= 0 || e.volume > 10000)
  )
    errors.push("Optional volume must be positive (ml).");
  if (
    e.temperature !== undefined &&
    (!Number.isFinite(e.temperature) ||
      e.temperature < 0 ||
      e.temperature > 100)
  )
    errors.push("Temperature must be 0–100 °C.");
  if (e.method === "pour-over") {
    errors.push(...validateStages(e.stages, e.output));
    if (e.stages.at(-1) && e.duration < e.stages.at(-1)!.seconds)
      errors.push("Brew duration cannot precede the final pour.");
  }
  if (e.method === "espresso") {
    e.profile.forEach((p, i) => {
      if (
        !Number.isFinite(p.seconds) ||
        p.seconds < 0 ||
        p.seconds > 7200 ||
        (e.profileKind === "recorded" && p.seconds > e.duration) ||
        (i > 0 && p.seconds <= e.profile[i - 1].seconds) ||
        !Number.isFinite(p.bars) ||
        p.bars < 0 ||
        p.bars > 16
      )
        errors.push(
          `Profile point ${i + 1}: increasing time up to 7200 s and pressure 0–16 bar required; recorded points must be within actual duration.`,
        );
    });
  }
  return errors;
}
export function guidance(e: Experiment) {
  // Unknown scores stay null in storage. -1 is an internal non-intensity sentinel.
  const s = Object.fromEntries(
    Object.entries(e.sensory).map(([k, v]) => [k, v ?? -1]),
  ) as Record<keyof Sensory, number>;
  const common = {
    constants:
      "Keep the bean, dose, water source and equipment unchanged. Change only the variable suggested below.",
    uncertainty:
      "Taste is not an extraction measurement. Roast, water and uneven flow can change the result.",
    source: "https://www.baristahustle.com/the-espresso-compass/",
  };
  if (validateExperiment(e).length)
    return {
      ...common,
      title: "Record the missing measurements",
      evidence: "This record has missing or invalid brew values.",
      hypothesis: "A reliable comparison needs known units and quantities.",
      test: "Correct the highlighted dose, yield, time or plan values before using ratio-based advice.",
    };
  if (
    (s.sourness >= 4 && (s.bitterness >= 4 || s.dryness >= 4)) ||
    e.flow === "stalled" ||
    e.flow === "erratic"
  )
    return {
      ...common,
      title: "Check repeatability first",
      evidence:
        e.flow === "stalled" || e.flow === "erratic"
          ? "Stalled or erratic flow was recorded."
          : "High sourness with bitterness or dryness.",
      hypothesis:
        "Uneven extraction may be masking sweetness; this is not proof of channeling.",
      test:
        e.method === "espresso"
          ? "Keep grind and ratio fixed. Distribute the grounds more evenly before tamping. Follow the basket fill guidance for your equipment."
          : "Keep grind, water and temperature fixed. Reduce one agitation event, then compare drawdown and dryness.",
      source:
        e.method === "espresso"
          ? "https://doi.org/10.1016/j.matt.2019.12.019"
          : "https://coffeeadastra.com/2020/02/01/the-physics-of-fines-migration/",
    };
  if (
    ["sourness", "bitterness", "dryness", "strength"].some(
      (k) => e.sensory[k as keyof Sensory] === null,
    )
  )
    return {
      ...common,
      title: "Taste before adjusting",
      evidence: "Some flavor or strength observations are still unknown.",
      hypothesis:
        "A useful recommendation needs your own tasting observations.",
      test: "Taste at a comfortable temperature and record sourness, bitterness, dryness and strength. Unknown is different from low intensity.",
    };
  if (s.preference >= 4)
    return {
      ...common,
      title: "Keep your preferred baseline",
      evidence: "You rated this brew highly.",
      hypothesis:
        "Bright acidity or an unusual shot time can be part of a coffee you enjoy.",
      test: "Repeat your preferred recipe without chasing a universal time target. See whether enjoyment stays consistent.",
    };
  if (s.sourness >= 4 && e.flow === "unknown")
    return {
      ...common,
      title: "Observe the flow first",
      evidence: "Sourness recorded; flow is unknown.",
      hypothesis: "Several causes remain possible.",
      test: "Repeat the recipe and note whether flow is even, unusually fast, stalled or erratic before changing grind.",
    };
  if (
    e.method === "espresso" &&
    s.sourness >= 4 &&
    s.strength < 4 &&
    e.flow === "even"
  )
    return {
      ...common,
      title: "Compare with your own baseline",
      evidence:
        "Sour, lower-strength espresso with even flow; unusually fast flow was not reported.",
      hypothesis:
        "The current observations do not identify a grind or yield correction.",
      test: "Repeat the recipe and compare flow and sweetness with your own baseline. Check the recorded yield and water source before choosing a grind change.",
    };
  if (s.sourness >= 4 && s.strength >= 4)
    return {
      ...common,
      title: "Concentrated, but sour",
      evidence:
        "High sourness and high perceived strength, without a mixed dry signal.",
      hypothesis: "Strength may be high while extraction remains limited.",
      test:
        e.method === "espresso"
          ? "Keep dose and grind fixed. Increase beverage yield by about 10% as a starting experiment. Time may change naturally; expect a less concentrated drink."
          : "Keep dose and grind fixed. Increase total brew water by about 5% as a starting experiment, adjusting the final cumulative target. Expect a lighter concentration.",
      source:
        "https://www.baristahustle.com/espresso-recipes-understanding-yield/",
    };
  if (s.sourness >= 4 && (e.flow === "fast" || e.flow === "even"))
    return {
      ...common,
      title: "Sour with lower strength",
      evidence:
        "High sourness, lower perceived strength and even or fast flow.",
      hypothesis:
        "Limited extraction is one possibility; low strength is another.",
      test: "Keep the ratio, temperature and pour plan fixed. Try one small finer grind step on your own grinder. Stop if flow becomes erratic or dryness rises; compare sweetness.",
      source: "https://doi.org/10.1016/j.matt.2019.12.019",
    };
  if (s.bitterness >= 4 && s.strength >= 4 && s.dryness < 4)
    return {
      ...common,
      title: "Test the strength separately",
      evidence: "Bitter and concentrated, without strong dryness.",
      hypothesis: "Concentration may be making bitterness more intense.",
      test: "Add a measured small amount of water to a separate tasting portion. Record it in notes. Do not overwrite the original beverage yield or brew water: this is dilution, not re-extraction.",
    };
  if (
    e.method === "espresso" &&
    s.bitterness >= 4 &&
    s.strength <= 2 &&
    (ratio(e.dose, e.output) ?? 0) >= 3
  )
    return {
      ...common,
      title: "Try a shorter beverage",
      evidence:
        "Bitter, weak espresso with a coffee-to-beverage ratio of at least 1:3.",
      hypothesis:
        "A long output may contribute to low strength and a bitter finish.",
      test: "Keep dose and grind fixed. Reduce target beverage mass by about 10% as a starting experiment. Expect more strength and possibly more acidity; dark-roast bitterness may remain.",
      source:
        "https://www.baristahustle.com/espresso-recipes-understanding-yield/",
    };
  if (s.bitterness >= 4 || s.dryness >= 4)
    return {
      ...common,
      title: "Look for a cleaner finish",
      evidence:
        "Elevated bitterness or drying sensation, without a recorded flow warning.",
      hypothesis:
        "Roast character or uneven/excessive extraction may contribute.",
      test: "Keep the ratio fixed. Try one small coarser grind step and compare the finish. Return to the baseline if sweetness falls.",
    };
  if (e.method === "pour-over" && s.strength >= 4)
    return {
      ...common,
      title: "Try a little dilution",
      evidence:
        "High perceived strength without a strong sour, bitter or dry signal.",
      hypothesis: "The balance may suit you at a lower concentration.",
      test: "Add a measured small amount of bypass water to a tasting portion and note it separately. Keep the original brew-water history unchanged: dilution does not re-extract the grounds.",
    };
  if (e.method === "pour-over" && s.strength <= 2)
    return {
      ...common,
      title: "Try a stronger ratio",
      evidence:
        "Low perceived strength without a strong sour, bitter or dry signal.",
      hypothesis: "The flavor balance may suit you at a higher concentration.",
      test: "On the next brew, use slightly less total brew water with the same dose. Adjust the final cumulative target. The changed ratio can also affect extraction; compare rather than assume.",
    };
  return {
    ...common,
    title: "Keep a good baseline",
    evidence: "No strong sour, bitter or dry signal recorded.",
    hypothesis: "Your current recipe is a useful reference.",
    test: "Repeat the same recipe once before changing a variable. Record whether sweetness and body stay consistent.",
  };
}
export function changes(a: Experiment, b: Experiment) {
  const keys = [
    "method",
    "beanId",
    "dose",
    "output",
    "volume",
    "duration",
    "timing",
    "grinder",
    "grind",
    "temperature",
    "stages",
    "profile",
    "profileKind",
    "flow",
    "sensory",
    "notes",
  ] as const;
  return keys
    .filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    .map((k) => ({ field: k, before: a[k], after: b[k] }));
}
export function monthDays(month: string) {
  const [y, m] = month.split("-").map(Number);
  return Array.from(
    { length: new Date(y, m, 0).getDate() },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
  );
}
export function id() {
  return crypto.randomUUID();
}
// Import is a trust boundary: validate full shape, numeric bounds, unique IDs and relations.
export function parseImport(raw: string): Data {
  if (raw.length > 5_000_000) throw new Error("File exceeds the 5 MB limit.");
  let d: any;
  try {
    d = JSON.parse(raw);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  const fail = () => {
    throw new Error(
      "Invalid version 1 Coffee Lover file. Check fields, values, dates and linked records.",
    );
  };
  const str = (v: any) => typeof v === "string" && v.length <= 10000;
  const num = (v: any) => typeof v === "number" && Number.isFinite(v);
  const ids = new Set<string>();
  const record = (v: any) => {
    if (!v || typeof v !== "object" || !str(v.id) || !v.id || ids.has(v.id))
      fail();
    ids.add(v.id);
  };
  if (
    !d ||
    d.version !== 1 ||
    !["beans", "experiments", "drinks", "places"].every(
      (k) => Array.isArray(d[k]) && d[k].length <= 10000,
    )
  )
    fail();
  for (const b of d.beans) {
    record(b);
    if (
      !["name", "roaster", "origin", "process", "notes", "color"].every((k) =>
        str(b[k]),
      ) ||
      !b.name.trim() ||
      !validDate(b.roastDate) ||
      !["active", "finished", "archived"].includes(b.status) ||
      !/^#[0-9a-fA-F]{6}$/.test(b.color)
    )
      fail();
  }
  const beanIds = new Set(d.beans.map((b: any) => b.id));
  for (const p of d.places) {
    record(p);
    if (
      !["name", "city", "notes"].every((k) => str(p[k])) ||
      !p.name.trim() ||
      !num(p.latitude) ||
      Math.abs(p.latitude) > 90 ||
      !num(p.longitude) ||
      Math.abs(p.longitude) > 180 ||
      !Array.isArray(p.visits) ||
      !p.visits.every(validDate)
    )
      fail();
  }
  for (const e of d.experiments) {
    record(e);
    if (!["unknown", "even", "fast", "stalled", "erratic"].includes(e.flow))
      fail();
    if (
      !["name", "beanId", "grinder", "grind", "timing", "notes"].every((k) =>
        str(e[k]),
      ) ||
      !beanIds.has(e.beanId) ||
      !["espresso", "pour-over"].includes(e.method) ||
      !["target", "recorded"].includes(e.profileKind) ||
      !Number.isInteger(e.version) ||
      e.version < 1 ||
      !Array.isArray(e.stages) ||
      !Array.isArray(e.profile) ||
      !e.stages.every((s: any) => s && num(s.seconds) && num(s.water)) ||
      !e.profile.every((p: any) => p && num(p.seconds) && num(p.bars)) ||
      !e.sensory ||
      !Object.keys(sensoryDefault).every(
        (k) =>
          e.sensory[k] === null ||
          (num(e.sensory[k]) &&
            Number.isInteger(e.sensory[k]) &&
            e.sensory[k] >= 1 &&
            e.sensory[k] <= 5),
      )
    )
      fail();
    if (validateExperiment(e).length) fail();
  }
  const experimentIds = new Set(d.experiments.map((e: any) => e.id));
  const placeIds = new Set(d.places.map((p: any) => p.id));
  const linked = new Set();
  for (const e of d.experiments)
    if (
      e.parentId !== undefined &&
      (!str(e.parentId) ||
        !experimentIds.has(e.parentId) ||
        e.parentId === e.id)
    )
      fail();
  const byExperiment = new Map<string, Experiment>(
    d.experiments.map((e: Experiment) => [e.id, e]),
  );
  const resolved = new Set<string>();
  for (const e of d.experiments as Experiment[]) {
    const path = new Set<string>();
    let current: Experiment | undefined = e;
    while (current && !resolved.has(current.id)) {
      if (path.has(current.id)) fail();
      path.add(current.id);
      current = current.parentId
        ? byExperiment.get(current.parentId)
        : undefined;
    }
    for (const key of path) resolved.add(key);
  }
  for (const r of d.drinks) {
    record(r);
    if (
      !["name", "beanId", "notes"].every((k) => str(r[k])) ||
      !r.name.trim() ||
      !validDate(r.date) ||
      !["espresso", "pour-over"].includes(r.method) ||
      (r.beanId && !beanIds.has(r.beanId)) ||
      (r.placeId !== undefined && (!str(r.placeId) || !placeIds.has(r.placeId)))
    )
      fail();
    if (r.experimentId !== undefined) {
      const e = d.experiments.find((e: any) => e.id === r.experimentId);
      if (
        !e ||
        linked.has(r.experimentId) ||
        r.date !== e.date ||
        r.beanId !== e.beanId ||
        r.method !== e.method
      )
        fail();
      linked.add(r.experimentId);
    }
  }
  if (linked.size !== experimentIds.size) fail();
  return d as Data;
}
