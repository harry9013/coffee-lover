import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  type Bean,
  type Data,
  type Drink,
  type Experiment,
  type Place,
  localDate,
  id,
  sensoryDefault,
  validateExperiment,
  ratio,
  stageIncrements,
} from "./domain";
import { Field } from "./components";
export function BeanForm({
  bean,
  onSave,
  onClose,
}: {
  bean?: Bean;
  onSave: (b: Bean) => void;
  onClose: () => void;
}) {
  const [b, set] = useState<Bean>(
    bean ?? {
      id: id(),
      name: "",
      roaster: "",
      origin: "",
      process: "",
      roastDate: localDate(),
      notes: "",
      status: "active",
      color: "#d6dbb7",
    },
  );
  const change = (key: keyof Bean, value: string) =>
    set({ ...b, [key]: value });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(b);
      }}
    >
      <div className="form-grid">
        {(["name", "roaster", "origin", "process"] as const).map((k) => (
          <Field key={k} label={k === "name" ? "Coffee name" : k}>
            <input
              required={k === "name"}
              pattern={k === "name" ? ".*\\S.*" : undefined}
              maxLength={200}
              value={b[k]}
              onChange={(e) => change(k, e.target.value)}
            />
          </Field>
        ))}
        <Field label="Roast date">
          <input
            type="date"
            required
            value={b.roastDate}
            onChange={(e) => change("roastDate", e.target.value)}
          />
        </Field>
        <Field label="Bag status">
          <select
            value={b.status}
            onChange={(e) => change("status", e.target.value)}
          >
            <option value="active">On the shelf</option>
            <option value="finished">Finished</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <Field label="Label color">
          <input
            type="color"
            value={b.color}
            onChange={(e) => change("color", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Tasting notes">
        <textarea
          value={b.notes}
          onChange={(e) => change("notes", e.target.value)}
        />
      </Field>
      <p className="muted">
        One shelf entry represents one bag or batch. Roast date is context, not
        an expiry date.
      </p>
      <div className="form-actions">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button className="primary">Save bean</button>
      </div>
    </form>
  );
}
export function DrinkForm({
  drink,
  data,
  onSave,
  onClose,
  date,
}: {
  drink?: Drink;
  data: Data;
  onSave: (d: Drink) => void;
  onClose: () => void;
  date?: string;
}) {
  const [d, set] = useState<Drink>(
    drink ?? {
      id: id(),
      date: date ?? localDate(),
      name: "",
      method: "espresso",
      beanId: "",
      notes: "",
    },
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(d);
      }}
    >
      <p className="muted">
        A simple coffee memory. Use the Lab for a measured brew.
      </p>
      <Field label="What did you drink?">
        <input
          required
          pattern=".*\S.*"
          maxLength={200}
          placeholder="A flat white at the corner café"
          value={d.name}
          onChange={(e) => set({ ...d, name: e.target.value })}
        />
      </Field>
      <div className="form-grid">
        <Field label="Local date">
          <input
            type="date"
            required
            value={d.date}
            onChange={(e) => set({ ...d, date: e.target.value })}
          />
        </Field>
        <Field label="Method">
          <select
            value={d.method}
            onChange={(e) =>
              set({ ...d, method: e.target.value as Drink["method"] })
            }
          >
            <option value="espresso">Espresso / espresso-based</option>
            <option value="pour-over">Pour-over / filter</option>
          </select>
        </Field>
        <Field label="Coffee">
          <select
            value={d.beanId}
            onChange={(e) => set({ ...d, beanId: e.target.value })}
          >
            <option value="">Unknown / café coffee</option>
            {data.beans.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Place (optional)">
          <select
            value={d.placeId ?? ""}
            onChange={(e) =>
              set({ ...d, placeId: e.target.value || undefined })
            }
          >
            <option value="">At home / unspecified</option>
            {data.places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="A note to remember">
        <textarea
          value={d.notes}
          onChange={(e) => set({ ...d, notes: e.target.value })}
        />
      </Field>
      <div className="form-actions">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button className="primary">Save drink</button>
      </div>
    </form>
  );
}
export function PlaceForm({
  place,
  coords,
  onSave,
  onClose,
}: {
  place?: Place;
  coords?: [number, number];
  onSave: (p: Place) => void;
  onClose: () => void;
}) {
  const [p, set] = useState<Place>(
    place ?? {
      id: id(),
      name: "",
      city: "",
      latitude: coords?.[0] ?? 0,
      longitude: coords?.[1] ?? 0,
      notes: "",
      visits: [localDate()],
    },
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(p);
      }}
    >
      <div className="form-grid">
        <Field label="Place name">
          <input
            required
            pattern=".*\S.*"
            maxLength={200}
            value={p.name}
            onChange={(e) => set({ ...p, name: e.target.value })}
          />
        </Field>
        <Field label="City / country">
          <input
            value={p.city}
            onChange={(e) => set({ ...p, city: e.target.value })}
          />
        </Field>
        <Field label="Latitude (−90 to 90)">
          <input
            type="number"
            required
            min={-90}
            max={90}
            step="any"
            value={p.latitude}
            onChange={(e) => set({ ...p, latitude: e.target.valueAsNumber })}
          />
        </Field>
        <Field label="Longitude (−180 to 180)">
          <input
            type="number"
            required
            min={-180}
            max={180}
            step="any"
            value={p.longitude}
            onChange={(e) => set({ ...p, longitude: e.target.valueAsNumber })}
          />
        </Field>
      </div>
      <p className="muted">
        Enter coordinates manually or select an approximate position on the map.
        Nothing is sent to a geocoding service.
      </p>
      <h3>Visits</h3>
      {p.visits.map((v, i) => (
        <div className="stage-row" key={i}>
          <Field label={`Visit ${i + 1}`}>
            <input
              type="date"
              required
              value={v}
              onChange={(e) =>
                set({
                  ...p,
                  visits: p.visits.map((x, j) =>
                    j === i ? e.target.value : x,
                  ),
                })
              }
            />
          </Field>
          <button
            type="button"
            aria-label={`Remove visit ${i + 1}`}
            onClick={() =>
              set({ ...p, visits: p.visits.filter((_, j) => j !== i) })
            }
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => set({ ...p, visits: [...p.visits, localDate()] })}
      >
        <Plus size={16} /> Add visit
      </button>
      <Field label="Place notes">
        <textarea
          value={p.notes}
          onChange={(e) => set({ ...p, notes: e.target.value })}
        />
      </Field>
      <div className="form-actions">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button className="primary">Save place</button>
      </div>
    </form>
  );
}
export function ExperimentForm({
  experiment,
  beans,
  onSave,
  onClose,
  beanId,
}: {
  experiment?: Experiment;
  beans: Bean[];
  onSave: (e: Experiment) => void;
  onClose: () => void;
  beanId?: string;
}) {
  const [e, set] = useState<Experiment>(
    experiment ?? {
      id: id(),
      name: "",
      beanId: beanId ?? beans[0]?.id ?? "",
      method: "espresso",
      date: localDate(),
      dose: 18,
      output: 36,
      duration: NaN,
      timing: "Pump on to pump off",
      grinder: "",
      grind: "",
      stages: [],
      profile: [],
      profileKind: "target",
      sensory: { ...sensoryDefault },
      notes: "",
      version: 1,
      flow: "unknown",
    },
  );
  const [errors, setErrors] = useState<string[]>([]);
  const change = (key: keyof Experiment, v: unknown) => set({ ...e, [key]: v });
  const number = (
    key: "dose" | "output" | "duration" | "temperature" | "volume",
    label: string,
    optional = false,
  ) => (
    <Field label={label}>
      <input
        type="number"
        step="any"
        required={!optional}
        value={e[key] === undefined ? "" : Number.isNaN(e[key]) ? "" : e[key]}
        onChange={(ev) =>
          change(
            key,
            optional && ev.target.value === ""
              ? undefined
              : ev.target.valueAsNumber,
          )
        }
      />
    </Field>
  );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problems = validateExperiment(e);
    if (!e.beanId) problems.push("Add a bean before recording an experiment.");
    setErrors(problems);
    if (!problems.length) onSave(e);
  };
  return (
    <form onSubmit={submit} noValidate>
      <p className="muted">
        Manual brew record · v{e.version}. Defaults are starting recipe
        suggestions; replace them with your observations. Trials copy recipe
        settings, but require a new duration and fresh tasting observations.
      </p>
      <div className="method-toggle" aria-label="Brew method">
        {(["espresso", "pour-over"] as const).map((m) => (
          <button
            type="button"
            key={m}
            aria-pressed={e.method === m}
            className={e.method === m ? "selected" : ""}
            onClick={() =>
              e.method !== m &&
              set({
                ...e,
                method: m,
                dose: m === "espresso" ? 18 : 15,
                output: m === "espresso" ? 36 : 250,
                duration: NaN,
                timing:
                  m === "espresso"
                    ? "Pump on to pump off"
                    : "First water to drawdown",
                stages:
                  m === "pour-over"
                    ? [
                        { seconds: 0, water: 45 },
                        { seconds: 45, water: 150 },
                        { seconds: 90, water: 250 },
                      ]
                    : [],
                profile: [],
              })
            }
          >
            {m === "espresso" ? "Espresso" : "Pour-over"}
          </button>
        ))}
      </div>
      <div className="form-grid">
        <Field label="Experiment name">
          <input
            value={e.name}
            onChange={(ev) => change("name", ev.target.value)}
          />
        </Field>
        <Field label="Coffee">
          <select
            value={e.beanId}
            onChange={(ev) => change("beanId", ev.target.value)}
          >
            {!beans.length && <option value="">Add a bean first</option>}
            {beans.map((b) => (
              <option value={b.id} key={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Brew date (local)">
          <input
            type="date"
            value={e.date}
            onChange={(ev) => change("date", ev.target.value)}
          />
        </Field>
        <Field label="Timing convention">
          <select
            value={e.timing}
            onChange={(ev) => change("timing", ev.target.value)}
          >
            {[
              "Pump on to pump off",
              "First drop to finish",
              "First water to drawdown",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        {number("dose", "Coffee dose (g)")}
        {number(
          "output",
          e.method === "espresso"
            ? "Beverage yield (g)"
            : "Total brew water (g)",
        )}
        {number("duration", "Observed duration (s)")}
        {number("temperature", "Temperature setpoint (°C), optional", true)}
        {e.method === "espresso" &&
          number("volume", "Optional beverage volume (ml)", true)}
        <Field label="Grinder model">
          <input
            placeholder="e.g. Comandante C40"
            value={e.grinder}
            onChange={(ev) => change("grinder", ev.target.value)}
          />
        </Field>
        <Field
          label="Grind setting"
          hint="Specific to this equipment and calibration."
        >
          <input
            placeholder="e.g. 24 clicks from zero"
            value={e.grind}
            onChange={(ev) => change("grind", ev.target.value)}
          />
        </Field>
        <Field label="Observed flow">
          <select
            value={e.flow}
            onChange={(ev) => change("flow", ev.target.value)}
          >
            <option value="unknown">Not observed</option>
            <option value="even">Even / repeatable</option>
            <option value="fast">Unusually fast vs my baseline</option>
            <option value="stalled">Stalled / very slow</option>
            <option value="erratic">Erratic / uneven</option>
          </select>
        </Field>
      </div>
      <div className="ratio-readout">
        <strong>1 : {ratio(e.dose, e.output)?.toFixed(2) ?? "—"}</strong>
        <span>
          {e.method === "espresso"
            ? "coffee : beverage mass"
            : "coffee : brew water"}{" "}
          ·{" "}
          {e.method === "espresso"
            ? "ml never substitutes for grams"
            : "includes bloom water"}
        </span>
      </div>
      {e.method === "pour-over" ? (
        <section className="form-section">
          <h3>Pour plan</h3>
          <p className="muted">
            Cumulative water targets in grams. Each row is the total on the
            scale, including the bloom. Time is seconds from first water;
            duration above is the observed finish.
          </p>
          {stageIncrements(e.stages).map((s, i) => (
            <div className="stage-row" key={i}>
              <span className="stage-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Field label={i === 0 ? "Bloom starts (s)" : "Start (s)"}>
                <input
                  type="number"
                  value={Number.isNaN(s.seconds) ? "" : s.seconds}
                  onChange={(ev) =>
                    change(
                      "stages",
                      e.stages.map((v, j) =>
                        j === i
                          ? { ...v, seconds: ev.target.valueAsNumber }
                          : v,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Cumulative (g)">
                <input
                  type="number"
                  value={Number.isNaN(s.water) ? "" : s.water}
                  onChange={(ev) =>
                    change(
                      "stages",
                      e.stages.map((v, j) =>
                        j === i ? { ...v, water: ev.target.valueAsNumber } : v,
                      ),
                    )
                  }
                />
              </Field>
              <small>+{s.increment} g</small>
              <button
                type="button"
                aria-label={`Remove stage ${i + 1}`}
                onClick={() =>
                  change(
                    "stages",
                    e.stages.filter((_, j) => j !== i),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              change("stages", [
                ...e.stages,
                {
                  seconds: (e.stages.at(-1)?.seconds ?? 0) + 30,
                  water: (e.stages.at(-1)?.water ?? 0) + 50,
                },
              ])
            }
          >
            <Plus size={16} /> Add pour stage
          </button>
        </section>
      ) : (
        <section className="form-section">
          <h3>
            Pressure profile <span className="muted">optional</span>
          </h3>
          <Field label="Profile provenance">
            <select
              value={e.profileKind}
              onChange={(ev) => change("profileKind", ev.target.value)}
            >
              <option value="target">Planned target · not measured</option>
              <option value="recorded">
                Recorded · manually entered measurements
              </option>
            </select>
          </Field>
          {e.profile.map((p, i) => (
            <div className="stage-row" key={i}>
              <Field label="Time (s)">
                <input
                  type="number"
                  value={Number.isNaN(p.seconds) ? "" : p.seconds}
                  onChange={(ev) =>
                    change(
                      "profile",
                      e.profile.map((v, j) =>
                        j === i
                          ? { ...v, seconds: ev.target.valueAsNumber }
                          : v,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Pressure (bar)">
                <input
                  type="number"
                  step=".1"
                  value={Number.isNaN(p.bars) ? "" : p.bars}
                  onChange={(ev) =>
                    change(
                      "profile",
                      e.profile.map((v, j) =>
                        j === i ? { ...v, bars: ev.target.valueAsNumber } : v,
                      ),
                    )
                  }
                />
              </Field>
              <button
                type="button"
                aria-label={`Remove profile point ${i + 1}`}
                onClick={() =>
                  change(
                    "profile",
                    e.profile.filter((_, j) => j !== i),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              change("profile", [
                ...e.profile,
                {
                  seconds: e.profile.length ? e.profile.at(-1)!.seconds + 5 : 0,
                  bars: 0,
                },
              ])
            }
          >
            <Plus size={16} /> Add profile point
          </button>
          <p className="muted">
            No machine connection or live telemetry. Record only what you know.
          </p>
        </section>
      )}
      <section className="form-section">
        <h3>What did you taste?</h3>
        <p className="muted">
          1 = low, 5 = high. Strength is perceived concentration; body is
          texture. These are not extraction measurements.
        </p>
        <div className="sensory-grid">
          {Object.keys(sensoryDefault).map((k) => (
            <Field key={k} label={k === "preference" ? "Enjoyment" : k}>
              <select
                value={e.sensory[k as keyof typeof sensoryDefault] ?? ""}
                onChange={(ev) =>
                  change("sensory", {
                    ...e.sensory,
                    [k]:
                      ev.target.value === "" ? null : Number(ev.target.value),
                  })
                }
              >
                <option value="">Not tasted / unknown</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} · {n === 1 ? "Low" : n === 5 ? "High" : "Moderate"}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
        <Field label="Notes / preparation / water / observations">
          <textarea
            placeholder="What changed? What would you repeat?"
            value={e.notes}
            onChange={(ev) => change("notes", ev.target.value)}
          />
        </Field>
      </section>
      {errors.length > 0 && (
        <div className="error" role="alert">
          <strong>Check this brew</strong>
          <ul>
            {errors.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="form-actions">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button className="primary">Save experiment</button>
      </div>
    </form>
  );
}
