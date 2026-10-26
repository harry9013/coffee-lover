import { useState, useMemo, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  BookOpen,
  FlaskConical,
  CalendarDays,
  MapPin,
  Coffee,
  Settings2,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Copy,
  Trash2,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import {
  type Bean,
  type Data,
  type Drink,
  type Experiment,
  type Place,
  localDate,
  id,
  ratio,
  guidance,
  changes,
  monthDays,
  parseImport,
  sensoryDefault,
  stageIncrements,
} from "./domain";
import { LocalRepository, exportData } from "./persistence";
import { sample } from "./sample";
import { Bag, Modal, Empty, Field, Timer, WorldMap } from "./components";
import { BeanForm, DrinkForm, ExperimentForm, PlaceForm } from "./forms";
type Page = "shelf" | "lab" | "calendar" | "places";
type Style = "editorial" | "studio" | "atlas";
type Editor =
  | { type: "bean"; value?: Bean }
  | { type: "drink"; value?: Drink; date?: string }
  | { type: "experiment"; value?: Experiment; beanId?: string }
  | { type: "place"; value?: Place; coords?: [number, number] }
  | { type: "settings" }
  | null;
const repository = new LocalRepository();
const initial = () => {
  try {
    return { data: repository.load() ?? structuredClone(sample), error: "" };
  } catch (err) {
    return {
      data: structuredClone(sample),
      error: `Saved data could not be read. It has not been overwritten. ${String(err)}`,
    };
  }
};
const displayDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const methodName = (m: string) => (m === "espresso" ? "Espresso" : "Pour-over");
export default function App() {
  const [boot] = useState(initial);
  const [data, setData] = useState<Data>(boot.data);
  const [storageError, setStorageError] = useState(boot.error);
  const [page, setPage] = useState<Page>("shelf");
  const [style, setStyle] = useState<Style>("editorial");
  const [editor, setEditor] = useState<Editor>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [selected, setSelected] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState<{
    title: string;
    text: string;
    action: () => void;
  } | null>(null);
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [day, setDay] = useState(localDate());
  const [placing, setPlacing] = useState(false);
  const [importError, setImportError] = useState("");
  const update = (next: Data) => {
    if (boot.error && storageError) {
      setNotice(
        "Resolve the unreadable saved data in Data & privacy before saving.",
      );
      return false;
    }
    try {
      repository.save(next);
      setData(next);
      setStorageError("");
      return true;
    } catch (err) {
      setStorageError(
        `Could not save to this browser. Your last saved data is unchanged. Export your current data as a backup. ${String(err)}`,
      );
      return false;
    }
  };
  const save = (
    kind: "beans" | "drinks" | "places",
    value: Bean | Drink | Place,
  ) => {
    const list = data[kind] as (Bean | Drink | Place)[];
    const next = {
      ...data,
      [kind]: list.some((x) => x.id === value.id)
        ? list.map((x) => (x.id === value.id ? value : x))
        : [...list, value],
    };
    if (update(next)) {
      setEditor(null);
      setNotice("Saved on this device.");
    }
  };
  const saveExperiment = (e: Experiment) => {
    const existing = data.drinks.find((d) => d.experimentId === e.id);
    const drink: Drink = {
      id: existing?.id ?? id(),
      date: e.date,
      name: e.name,
      method: e.method,
      beanId: e.beanId,
      notes: existing?.notes ?? "",
      experimentId: e.id,
    };
    const next = {
      ...data,
      experiments: data.experiments.some((x) => x.id === e.id)
        ? data.experiments.map((x) => (x.id === e.id ? e : x))
        : [e, ...data.experiments],
      drinks: existing
        ? data.drinks.map((d) => (d.id === existing.id ? drink : d))
        : [...data.drinks, drink],
    };
    if (update(next)) {
      setEditor(null);
      setSelected(e.id);
      location.hash = "lab";
      setPage("lab");
      setNotice("Experiment saved and linked to one calendar entry.");
    }
  };
  const remove = (
    kind: "beans" | "experiments" | "drinks" | "places",
    key: string,
  ) => {
    if (
      kind === "beans" &&
      (data.experiments.some((e) => e.beanId === key) ||
        data.drinks.some((d) => d.beanId === key))
    ) {
      setNotice(
        "This bean has brew history. Archive it in Edit bean to keep those links intact.",
      );
      return;
    }
    setConfirm({
      title: `Delete ${kind === "beans" ? "bean" : kind === "places" ? "place" : kind === "drinks" ? "drink" : "experiment"}?`,
      text:
        kind === "experiments"
          ? "Its linked calendar drink will also be removed. Other trials will remain."
          : "This removes this record from this device. Export a backup first if you need it.",
      action: () => {
        let next = { ...data, [kind]: data[kind].filter((x) => x.id !== key) };
        if (kind === "experiments")
          next = {
            ...next,
            drinks: next.drinks.filter((d) => d.experimentId !== key),
            experiments: next.experiments.map((e) =>
              e.parentId === key ? { ...e, parentId: undefined } : e,
            ),
          };
        if (kind === "places")
          next = {
            ...next,
            drinks: next.drinks.map((d) =>
              d.placeId === key ? { ...d, placeId: undefined } : d,
            ),
          };
        if (update(next)) {
          setSelected(null);
          setNotice("Record deleted.");
        }
      },
    });
  };
  useEffect(() => {
    const sync = () => {
      const p = location.hash.slice(1);
      if (["shelf", "lab", "calendar", "places"].includes(p))
        setPage(p as Page);
      else setPage("shelf");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const navigate = (p: Page) => {
    location.hash = p;
    setPage(p);
    setNotice("");
  };
  const beanName = (key: string) =>
    data.beans.find((b) => b.id === key)?.name ?? "Café coffee";
  const filtered = data.beans.filter(
    (b) =>
      (status === "all" || b.status === status) &&
      `${b.name} ${b.origin} ${b.roaster} ${b.notes}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const experiment =
    data.experiments.find((e) => e.id === selected) ?? data.experiments[0];
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([exportData(data)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `coffee-lover-${localDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("JSON backup exported.");
  };
  const showDrink = (d: Drink) => {
    if (d.experimentId) {
      setSelected(d.experimentId);
      navigate("lab");
    } else setEditor({ type: "drink", value: d });
  };
  const moveMonth = (amount: number) => {
    const [y, m] = month.split("-").map(Number);
    setMonth(localDate(new Date(y, m - 1 + amount, 1, 12)).slice(0, 7));
  };
  const days = useMemo(() => monthDays(month), [month]);
  return (
    <div className={`app ${page === "shelf" ? style : "editorial"}`}>
      <a
        href="#main"
        className="skip"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main");
          main?.focus();
          main?.scrollIntoView();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("shelf");
          }}
        >
          <span className="brand-mark">
            <Coffee size={24} />
          </span>
          <span>
            Coffee
            <br />
            <b>Lover</b>
            <i>A daily practice.</i>
          </span>
        </a>
        <nav aria-label="Main navigation">
          {(
            [
              { key: "shelf", label: "My shelf", icon: BookOpen },
              { key: "lab", label: "Experiment Lab", icon: FlaskConical },
              { key: "calendar", label: "Coffee calendar", icon: CalendarDays },
              { key: "places", label: "Places & stories", icon: MapPin },
            ] as const
          ).map((n) => (
            <button
              key={n.key}
              className={page === n.key ? "active" : ""}
              aria-current={page === n.key ? "page" : undefined}
              onClick={() => navigate(n.key)}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {page === n.key && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span>
              GOOD COFFEE.
              <br />A LITTLE CURIOSITY.
            </span>
            <p>
              Your rituals, discoveries
              <br />
              and better next cups.
            </p>
          </div>
          <button
            className="data-button"
            onClick={() => setEditor({ type: "settings" })}
          >
            <Settings2 size={18} /> Data & privacy
          </button>
          <span className="local-dot">Private · stored on this device</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            Your coffee, considered <span>/</span>{" "}
            {page === "shelf"
              ? "The collection"
              : page === "lab"
                ? "The notebook"
                : page === "calendar"
                  ? "The daily ritual"
                  : "The world"}
          </span>
          <div className="topbar-actions">
            <button
              className="text-button"
              onClick={() => setEditor({ type: "drink" })}
            >
              <Plus size={16} /> Quick drink log
            </button>
            <button
              className="mobile-settings icon-button"
              aria-label="Data & privacy"
              onClick={() => setEditor({ type: "settings" })}
            >
              <Settings2 size={18} />
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {storageError && (
            <div className="error" role="alert">
              {storageError}
              <button onClick={() => setEditor({ type: "settings" })}>
                Manage data
              </button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              <Check size={16} />
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}
          {page === "shelf" && (
            <>
              <div className="style-strip">
                <span>THREE WAYS TO FEEL AT HOME</span>
                <div role="group" aria-label="Homepage design">
                  {(
                    [
                      { id: "editorial", name: "01 Editorial" },
                      { id: "studio", name: "02 Studio" },
                      { id: "atlas", name: "03 Atlas" },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      aria-pressed={style === s.id}
                      onClick={() => setStyle(s.id)}
                    >
                      {s.name}
                      {style === s.id && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>
              <section className="shelf-hero">
                <div className="hero-copy">
                  <span className="eyebrow">
                    {style === "editorial"
                      ? "THE ART OF THE EVERYDAY"
                      : style === "studio"
                        ? "PERSONAL COFFEE INVENTORY / 001"
                        : "A WORLD OF COFFEE, AT HOME"}
                  </span>
                  <h1>
                    {style === "editorial" ? (
                      <>
                        A little more
                        <br />
                        <em>intentional.</em>
                      </>
                    ) : style === "studio" ? (
                      <>
                        Good coffee.
                        <br />
                        On repeat.
                      </>
                    ) : (
                      <>
                        Every bean,
                        <br />
                        <em>a place to begin.</em>
                      </>
                    )}
                  </h1>
                  <p>
                    {style === "editorial"
                      ? "Beautiful beans. Small experiments. A collection of moments worth brewing again."
                      : style === "studio"
                        ? "Observe. Adjust one variable. Find your next baseline. Your collection is ready for the next experiment."
                        : "From a hillside in Ethiopia to your favorite cup. Keep the coffees and places that stay with you."}
                  </p>
                  <button
                    className="primary"
                    onClick={() => setEditor({ type: "experiment" })}
                  >
                    Start an experiment <ArrowUpRight size={17} />
                  </button>
                  <div className="hero-foot">
                    <span>
                      {String(
                        data.beans.filter((b) => b.status === "active").length,
                      ).padStart(2, "0")}{" "}
                      coffees on the shelf
                    </span>
                    <span>
                      {data.experiments.length} experiments & counting
                    </span>
                  </div>
                </div>
                {style === "editorial" ? (
                  <div className="hero-visual">
                    <span className="vertical-note">
                      A FRESH PERSPECTIVE, EVERY MORNING
                    </span>
                    <div className="hero-orbit" />
                    <div className="coffee-cup">
                      <div className="coffee-surface">
                        <span>✺</span>
                      </div>
                    </div>
                    <div className="hero-bean">
                      {data.beans[0] && <Bag bean={data.beans[0]} large />}
                    </div>
                    <div className="hero-caption">
                      <span>ON THE COUNTER</span>
                      <b>{data.beans[0]?.name ?? "Your next favorite"}</b>
                      <small>
                        {data.beans[0]?.origin ??
                          "An empty shelf, a fresh beginning"}{" "}
                        · slow mornings
                      </small>
                    </div>
                  </div>
                ) : style === "studio" ? (
                  <div className="studio-hero">
                    <span className="eyebrow">LATEST BASELINE</span>
                    <div className="studio-measures">
                      <div>
                        <b>{data.experiments[0]?.dose ?? "—"}</b>
                        <span>DOSE / G</span>
                      </div>
                      <div>
                        <b>{data.experiments[0]?.output ?? "—"}</b>
                        <span>
                          {data.experiments[0]?.method === "pour-over"
                            ? "BREW WATER / G"
                            : "BEVERAGE / G"}
                        </span>
                      </div>
                      <div>
                        <b>{data.experiments[0]?.duration ?? "—"}</b>
                        <span>TIME / S</span>
                      </div>
                    </div>
                    <div
                      className="signal-bars"
                      aria-label="Latest recipe plan"
                    >
                      {data.experiments[0]?.method === "pour-over"
                        ? data.experiments[0].stages.map((stage, i) => (
                            <div
                              key={i}
                              style={{
                                height: `${(stage.water / data.experiments[0].output) * 100}%`,
                              }}
                            >
                              <span>
                                {stage.water} g · {stage.seconds} s
                              </span>
                            </div>
                          ))
                        : data.experiments[0]?.profile.map((point, i) => (
                            <div
                              key={i}
                              style={{
                                height: `${Math.max(5, (point.bars / 16) * 100)}%`,
                              }}
                            >
                              <span>
                                {point.bars} bar · {point.seconds} s
                              </span>
                            </div>
                          ))}
                    </div>
                    <span className="muted">
                      {data.experiments[0]?.method === "pour-over"
                        ? "Cumulative water targets · includes bloom"
                        : data.experiments[0]?.profile.length
                          ? `${data.experiments[0].profileKind} pressure points · manually entered`
                          : "No profile recorded"}
                    </span>
                    <button onClick={() => navigate("lab")}>
                      Open notebook <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="atlas-hero">
                    <WorldMap
                      compact
                      places={data.places}
                      onSelect={() => navigate("places")}
                    />
                    <div className="atlas-stamp">
                      {data.places.length}
                      <small>
                        places
                        <br />
                        remembered
                      </small>
                    </div>
                    <button onClick={() => navigate("places")}>
                      Open your coffee atlas <ArrowUpRight size={16} />
                    </button>
                  </div>
                )}
              </section>
              <section className="collection">
                <div className="section-title">
                  <div>
                    <span className="eyebrow">THE COLLECTION</span>
                    <h2>
                      {style === "studio" ? "Bean inventory" : "On your shelf"}
                      <span className="count">{filtered.length}</span>
                    </h2>
                  </div>
                  <button onClick={() => setEditor({ type: "bean" })}>
                    <Plus size={16} /> Add a bean
                  </button>
                </div>
                <div className="shelf-tools">
                  <div className="tabs" aria-label="Bean status">
                    {[
                      { id: "active", label: "On the shelf" },
                      { id: "finished", label: "Finished" },
                      { id: "all", label: "All beans" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        aria-pressed={status === t.id}
                        className={status === t.id ? "active" : ""}
                        onClick={() => setStatus(t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <label className="search">
                    <Search size={16} />
                    <input
                      aria-label="Search beans"
                      placeholder="Find a coffee…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                </div>
                {!filtered.length ? (
                  <Empty title="Room for a new favorite.">
                    <p>Add a coffee or try another filter.</p>
                    <button onClick={() => setEditor({ type: "bean" })}>
                      Add a bean
                    </button>
                  </Empty>
                ) : (
                  <div className="bean-grid">
                    {filtered.map((b, i) => (
                      <article className="bean-card" key={b.id}>
                        <button
                          className="bean-image"
                          aria-label={`Edit ${b.name}`}
                          onClick={() => setEditor({ type: "bean", value: b })}
                        >
                          <span className="bean-index">0{i + 1}</span>
                          <span className="bean-status">
                            {b.status === "active"
                              ? "ON THE SHELF"
                              : b.status.toUpperCase()}
                          </span>
                          <Bag bean={b} />
                          <span className="image-arrow">
                            <ArrowUpRight size={19} />
                          </span>
                        </button>
                        <div className="bean-info">
                          <span className="eyebrow">
                            {b.roaster} <span> / {b.origin}</span>
                          </span>
                          <h3>
                            <button
                              onClick={() =>
                                setEditor({ type: "bean", value: b })
                              }
                            >
                              {b.name}
                            </button>
                          </h3>
                          <p>{b.notes}</p>
                          <div className="bean-meta">
                            <span>{b.process.split(" · ")[0]}</span>
                            <span>
                              Roasted{" "}
                              {displayDate(b.roastDate).replace(", 2026", "")}
                            </span>
                          </div>
                          <div className="bean-actions">
                            <button
                              className="text-button"
                              onClick={() =>
                                setEditor({ type: "experiment", beanId: b.id })
                              }
                            >
                              Brew this coffee <ArrowRight size={14} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`Delete ${b.name}`}
                              onClick={() => remove("beans", b.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
              <section className="shelf-bottom">
                <div>
                  <span className="eyebrow">A NOTE FROM THE LAB</span>
                  <h3>
                    One small change.
                    <br />A different kind of cup.
                  </h3>
                  <p>Keep what works. Get curious about the rest.</p>
                  <button
                    className="text-button"
                    onClick={() => navigate("lab")}
                  >
                    Explore your experiments <ArrowRight size={16} />
                  </button>
                </div>
                <div>
                  <span className="eyebrow">THE LAST CUP</span>
                  {[...data.drinks]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .at(-1) ? (
                    <>
                      <h3>
                        {
                          [...data.drinks]
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .at(-1)!.name
                        }
                      </h3>
                      <p>
                        {displayDate(
                          [...data.drinks]
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .at(-1)!.date,
                        )}{" "}
                        ·{" "}
                        {methodName(
                          [...data.drinks]
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .at(-1)!.method,
                        )}
                      </p>
                      <button
                        className="text-button"
                        onClick={() => navigate("calendar")}
                      >
                        A calendar of little rituals <ArrowRight size={16} />
                      </button>
                    </>
                  ) : (
                    <p>Your coffee story starts with the next cup.</p>
                  )}
                </div>
              </section>
              <p className="style-note">
                {style === "editorial"
                  ? "Recommended: Editorial — warm, quiet and designed for a daily ritual."
                  : style === "studio"
                    ? "Studio — precise, compact and made for comparison."
                    : "Atlas — airy, curious and led by the stories behind your coffee."}{" "}
                Other modules use Editorial with precise measurement controls.
              </p>
            </>
          )}
          {page === "lab" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">OBSERVE · ADJUST · REPEAT</span>
                  <h1>
                    The Experiment Lab<span>.</span>
                  </h1>
                  <p>A better cup starts with a little curiosity.</p>
                </div>
                <button
                  className="primary"
                  onClick={() => setEditor({ type: "experiment" })}
                >
                  <Plus size={17} /> New experiment
                </button>
              </div>
              <div className="lab-layout">
                <aside className="experiment-list">
                  <div className="section-title">
                    <h3>Your notebook</h3>
                    <span className="count">{data.experiments.length}</span>
                  </div>
                  {data.experiments.map((e) => (
                    <div
                      className={`experiment-item ${experiment?.id === e.id ? "active" : ""}`}
                      key={e.id}
                    >
                      <button onClick={() => setSelected(e.id)}>
                        <span className="eyebrow">
                          {methodName(e.method)} · v{e.version}
                        </span>
                        <strong>{e.name}</strong>
                        <small>
                          {beanName(e.beanId)} · {displayDate(e.date)}
                        </small>
                      </button>
                      <label className="compare-check">
                        <input
                          type="checkbox"
                          checked={compare.includes(e.id)}
                          onChange={(ev) =>
                            setCompare(
                              ev.target.checked
                                ? [...compare.slice(-1), e.id]
                                : compare.filter((x) => x !== e.id),
                            )
                          }
                        />{" "}
                        Compare
                      </label>
                    </div>
                  ))}
                  {!data.experiments.length && (
                    <p className="muted">Your first brew will appear here.</p>
                  )}
                  <Timer />
                </aside>
                <div>
                  {experiment ? (
                    <ExperimentDetail
                      e={experiment}
                      beanName={beanName(experiment.beanId)}
                      onEdit={() =>
                        setEditor({ type: "experiment", value: experiment })
                      }
                      onDuplicate={() =>
                        setEditor({
                          type: "experiment",
                          value: {
                            ...structuredClone(experiment),
                            id: id(),
                            name: `${experiment.name} · trial`,
                            date: localDate(),
                            version: experiment.version + 1,
                            parentId: experiment.id,
                            duration: NaN,
                            sensory: { ...sensoryDefault },
                            flow: "unknown",
                            notes: "",
                            profile:
                              experiment.profileKind === "target"
                                ? structuredClone(experiment.profile)
                                : [],
                            profileKind: "target",
                          },
                        })
                      }
                      onDelete={() => remove("experiments", experiment.id)}
                    />
                  ) : (
                    <Empty title="Find your first baseline.">
                      <p>
                        Espresso or pour-over. Start with what you know, then
                        taste and compare.
                      </p>
                      <button onClick={() => setEditor({ type: "experiment" })}>
                        New experiment
                      </button>
                    </Empty>
                  )}
                  {compare.length === 2 &&
                    data.experiments.filter((e) => compare.includes(e.id))
                      .length === 2 && (
                      <Comparison
                        a={data.experiments.find((e) => e.id === compare[0])!}
                        b={data.experiments.find((e) => e.id === compare[1])!}
                      />
                    )}
                </div>
              </div>
            </>
          )}
          {page === "calendar" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">THE DAILY RITUAL</span>
                  <h1>
                    A month of moments<span>.</span>
                  </h1>
                  <p>Some cups teach you something. Some just make the day.</p>
                </div>
                <button
                  className="primary"
                  onClick={() => setEditor({ type: "drink", date: day })}
                >
                  <Plus size={17} /> Log a coffee
                </button>
              </div>
              <div className="calendar-layout">
                <section className="calendar-panel">
                  <div className="calendar-heading">
                    <h2>
                      {new Date(`${month}-01T12:00:00`).toLocaleDateString(
                        "en",
                        { month: "long", year: "numeric" },
                      )}
                    </h2>
                    <div>
                      <button
                        aria-label="Previous month"
                        onClick={() => moveMonth(-1)}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setMonth(localDate().slice(0, 7));
                          setDay(localDate());
                        }}
                      >
                        Today
                      </button>
                      <button
                        aria-label="Next month"
                        onClick={() => moveMonth(1)}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="calendar-grid">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (d) => (
                        <span className="weekday" key={d}>
                          {d}
                        </span>
                      ),
                    )}
                    {Array.from(
                      {
                        length:
                          (new Date(`${month}-01T12:00:00`).getDay() + 6) % 7,
                      },
                      (_, i) => (
                        <div key={`pad${i}`} className="calendar-pad" />
                      ),
                    )}
                    {days.map((d) => {
                      const drinks = data.drinks.filter((x) => x.date === d);
                      return (
                        <button
                          key={d}
                          className={`calendar-day ${d === day ? "selected" : ""} ${d === localDate() ? "today" : ""}`}
                          aria-label={`${displayDate(d)}, ${drinks.length} coffees`}
                          aria-pressed={d === day}
                          onClick={() => setDay(d)}
                        >
                          <span>{Number(d.slice(-2))}</span>
                          <div className="day-dots">
                            {drinks.slice(0, 3).map((x) => (
                              <i key={x.id} className={x.method} />
                            ))}
                          </div>
                          {drinks.length > 0 && (
                            <small>
                              {drinks.length}{" "}
                              {drinks.length === 1 ? "coffee" : "coffees"}
                            </small>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="calendar-key">
                    <i /> Espresso <i /> Pour-over{" "}
                    <span>
                      Grouped by recorded local date, never UTC conversion.
                    </span>
                  </p>
                </section>
                <section className="day-panel">
                  <span className="eyebrow">{displayDate(day)}</span>
                  <h2>The cups that day</h2>
                  {data.drinks
                    .filter((d) => d.date === day)
                    .map((d) => (
                      <article className="drink-card" key={d.id}>
                        <Coffee size={20} />
                        <span className="eyebrow">{methodName(d.method)}</span>
                        <h3>
                          <button
                            className="title-button"
                            onClick={() => showDrink(d)}
                          >
                            {d.name}
                          </button>
                        </h3>
                        <p>{beanName(d.beanId)}</p>
                        <p>{d.notes}</p>
                        <div className="bean-actions">
                          <button
                            className="text-button"
                            onClick={() => showDrink(d)}
                          >
                            {d.experimentId ? "Open experiment" : "Edit drink"}{" "}
                            <ArrowUpRight size={14} />
                          </button>
                          {!d.experimentId && (
                            <button
                              aria-label={`Delete ${d.name}`}
                              onClick={() => remove("drinks", d.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  {!data.drinks.some((d) => d.date === day) && (
                    <p className="muted">
                      A quiet page. Add a coffee memory for this day.
                    </p>
                  )}
                  <button
                    onClick={() => setEditor({ type: "drink", date: day })}
                  >
                    <Plus size={16} /> Add a coffee
                  </button>
                </section>
              </div>
            </>
          )}
          {page === "places" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">GOOD COFFEE TAKES YOU PLACES</span>
                  <h1>
                    A world worth tasting<span>.</span>
                  </h1>
                  <p>Keep the little places you'd go back to.</p>
                </div>
                <button
                  className="primary"
                  onClick={() => setEditor({ type: "place" })}
                >
                  <Plus size={17} /> Add a place
                </button>
              </div>
              <div className="map-toolbar">
                <span>
                  {data.places.length} places ·{" "}
                  {data.places.reduce((n, p) => n + p.visits.length, 0)} visits
                </span>
                <button
                  aria-pressed={placing}
                  onClick={() => setPlacing(!placing)}
                >
                  <MapPin size={16} />
                  {placing ? "Cancel pin placement" : "Place a pin on map"}
                </button>
              </div>
              {placing && (
                <p role="status" className="notice">
                  Click a position to open editable coordinates. Keyboard users:
                  choose “Add a place” and enter latitude / longitude.
                </p>
              )}
              <WorldMap
                places={data.places}
                onSelect={(p) => setEditor({ type: "place", value: p })}
                onPlace={
                  placing
                    ? (lat, lng) => {
                        setPlacing(false);
                        setEditor({
                          type: "place",
                          coords: [
                            Number(lat.toFixed(4)),
                            Number(lng.toFixed(4)),
                          ],
                        });
                      }
                    : undefined
                }
              />
              <div className="section-title">
                <div>
                  <span className="eyebrow">THE ADDRESS BOOK</span>
                  <h2>Places & stories</h2>
                </div>
                <span className="muted">
                  Accessible list · same places as the map
                </span>
              </div>
              <div className="places-grid">
                {data.places.map((p, i) => (
                  <article className="place-card" key={p.id}>
                    <div className="place-number">
                      {String(i + 1).padStart(2, "0")}
                      <MapPin size={20} />
                    </div>
                    <span className="eyebrow">{p.city}</span>
                    <h3>
                      <button
                        className="title-button"
                        onClick={() => setEditor({ type: "place", value: p })}
                      >
                        {p.name}
                      </button>
                    </h3>
                    <p>{p.notes}</p>
                    <small className="coordinates">
                      {p.latitude.toFixed(4)}°, {p.longitude.toFixed(4)}°
                    </small>
                    <p className="muted">
                      {p.visits.length} visits
                      {p.visits.length > 0
                        ? ` · Last ${displayDate([...p.visits].sort().at(-1)!)}`
                        : ""}
                    </p>
                    <div className="bean-actions">
                      <button
                        className="text-button"
                        onClick={() => setEditor({ type: "place", value: p })}
                      >
                        Edit place / visits <ArrowUpRight size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete ${p.name}`}
                        onClick={() => remove("places", p.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {!data.places.length && (
                <Empty title="Your next favorite is out there.">
                  <p>
                    Add a place with manual coordinates to start your atlas.
                  </p>
                </Empty>
              )}
            </>
          )}
          <footer>
            <span>
              Coffee Lover <i>— a daily practice.</i>
            </span>
            <span>Private prototype · sample records · local storage only</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {(
          [
            { p: "shelf", label: "Shelf", Icon: BookOpen },
            { p: "lab", label: "Lab", Icon: FlaskConical },
            { p: "calendar", label: "Calendar", Icon: CalendarDays },
            { p: "places", label: "Places", Icon: MapPin },
          ] as const
        ).map(({ p, label, Icon }) => (
          <button
            key={p}
            aria-current={page === p ? "page" : undefined}
            onClick={() => navigate(p)}
          >
            <Icon size={21} />
            {label}
          </button>
        ))}
      </nav>
      {editor && (
        <Modal
          title={
            editor.type === "settings"
              ? "Your data, your device"
              : editor.type === "bean"
                ? editor.value
                  ? "Edit bean"
                  : "A new coffee for the shelf"
                : editor.type === "drink"
                  ? editor.value
                    ? "Edit coffee memory"
                    : "A coffee to remember"
                  : editor.type === "place"
                    ? editor.value
                      ? "A place to return to"
                      : "Pin a coffee place"
                    : editor.value
                      ? "Edit / trial experiment"
                      : "Start an experiment"
          }
          onClose={() => setEditor(null)}
        >
          {editor.type === "bean" ? (
            <BeanForm
              bean={editor.value}
              onSave={(b) => save("beans", b)}
              onClose={() => setEditor(null)}
            />
          ) : editor.type === "drink" ? (
            <DrinkForm
              drink={editor.value}
              date={editor.date}
              data={data}
              onSave={(d) => save("drinks", d)}
              onClose={() => setEditor(null)}
            />
          ) : editor.type === "place" ? (
            <PlaceForm
              place={editor.value}
              coords={editor.coords}
              onSave={(p) => save("places", p)}
              onClose={() => setEditor(null)}
            />
          ) : editor.type === "experiment" ? (
            <ExperimentForm
              experiment={editor.value}
              beanId={editor.beanId}
              beans={data.beans}
              onSave={saveExperiment}
              onClose={() => setEditor(null)}
            />
          ) : (
            <div className="settings">
              <p>
                This private prototype stores records in this browser on this
                device. It has no accounts, authentication or cross-device sync.
                Clearing browser data removes your records. Sample coffees and
                visits are illustrative.
              </p>
              <button onClick={download}>
                <Download size={17} /> Export version 1 JSON backup
              </button>
              <Field
                label="Import a Coffee Lover JSON backup"
                hint="Validates before replacing. Maximum 5 MB."
              >
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={async (ev) => {
                    const file = ev.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > 5_000_000)
                        throw new Error("File exceeds the 5 MB limit.");
                      const incoming = parseImport(await file.text());
                      setImportError("");
                      setConfirm({
                        title: "Replace current records?",
                        text: `Import ${incoming.beans.length} beans, ${incoming.experiments.length} experiments, ${incoming.drinks.length} drinks and ${incoming.places.length} places. Export first to keep a backup.`,
                        action: () => {
                          try {
                            repository.save(incoming);
                            setData(incoming);
                            setStorageError("");
                            setEditor(null);
                            setCompare([]);
                            setSelected(null);
                            setNotice("Validated backup imported.");
                          } catch (err) {
                            setImportError(
                              `Import could not be saved: ${String(err)}`,
                            );
                          }
                        },
                      });
                    } catch (err) {
                      setImportError(String(err));
                    }
                    ev.target.value = "";
                  }}
                />
              </Field>
              {importError && (
                <p className="error" role="alert">
                  {importError}
                </p>
              )}
              <hr />
              <h3>Start fresh</h3>
              <p>
                These actions replace all current records, after confirmation.
              </p>
              {[
                { label: "Restore sample collection", next: sample },
                {
                  label: "Clear all records",
                  next: {
                    version: 1,
                    beans: [],
                    experiments: [],
                    drinks: [],
                    places: [],
                  } as Data,
                },
              ].map((a) => (
                <button
                  key={a.label}
                  className="danger"
                  onClick={() =>
                    setConfirm({
                      title: `${a.label}?`,
                      text: "All current records on this device will be replaced. Export a backup before continuing.",
                      action: () => {
                        try {
                          repository.save(a.next);
                          setData(structuredClone(a.next));
                          setStorageError("");
                          setCompare([]);
                          setSelected(null);
                          setNotice("Local collection replaced.");
                          setEditor(null);
                        } catch (err) {
                          setImportError(
                            `Could not replace saved records: ${String(err)}`,
                          );
                        }
                      },
                    })
                  }
                >
                  {a.label}
                </button>
              ))}
              <h3>About the first version</h3>
              <p>
                Recommended visual direction: warm Editorial. Experiment values
                are manually entered. The map is a schematic, not street
                navigation. Sources and technical documentation are in the
                repository.
              </p>
            </div>
          )}
        </Modal>
      )}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p>{confirm.text}</p>
          <div className="form-actions">
            <button onClick={() => setConfirm(null)}>Cancel</button>
            <button
              className="primary"
              onClick={() => {
                confirm.action();
                setConfirm(null);
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function ExperimentDetail({
  e,
  beanName,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  e: Experiment;
  beanName: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const g = guidance(e);
  const profileHorizon = Math.max(
    e.duration,
    ...e.profile.map((point) => point.seconds),
  );
  return (
    <>
      <article className="brew-detail">
        <div className="detail-heading">
          <div>
            <span className="eyebrow">
              {methodName(e.method)} / {displayDate(e.date)} / v{e.version}
            </span>
            <h2>{e.name}</h2>
            <p>
              {beanName} <span>·</span> {e.grinder} at {e.grind}
            </p>
          </div>
          <button onClick={onEdit}>
            <SlidersHorizontal size={16} /> Edit
          </button>
        </div>
        <div className="measure-grid">
          <div>
            <span>COFFEE</span>
            <strong>
              {e.dose}
              <small> g</small>
            </strong>
          </div>
          <div>
            <span>{e.method === "espresso" ? "BEVERAGE" : "BREW WATER"}</span>
            <strong>
              {e.output}
              <small> g</small>
            </strong>
          </div>
          <div>
            <span>RATIO</span>
            <strong>1:{ratio(e.dose, e.output)?.toFixed(1)}</strong>
          </div>
          <div>
            <span>DURATION</span>
            <strong>
              {e.duration}
              <small> s</small>
            </strong>
          </div>
        </div>
        <p className="measure-note">
          {e.method === "espresso"
            ? "Coffee : beverage mass"
            : "Coffee : brew water"}{" "}
          · {e.timing} ·{" "}
          {e.temperature !== undefined
            ? `${e.temperature} °C setpoint`
            : "Temperature not recorded"}{" "}
          · {e.flow} flow
          {e.volume !== undefined
            ? ` · ${e.volume} ml (separate observation)`
            : ""}
        </p>
        {e.method === "espresso" ? (
          <section className="profile">
            <div className="section-title">
              <h3>Pressure profile</h3>
              <span className="pill">
                {e.profileKind === "target"
                  ? "Planned target · not measured"
                  : "Manually recorded"}
              </span>
            </div>
            {e.profile.length ? (
              <>
                <svg
                  viewBox="0 0 600 160"
                  role="img"
                  aria-label={`${e.profileKind} pressure profile. Exact values in table below.`}
                >
                  <line
                    x1="35"
                    y1="130"
                    x2="580"
                    y2="130"
                    stroke="currentColor"
                    opacity=".2"
                  />
                  <line
                    x1="35"
                    y1="30"
                    x2="580"
                    y2="30"
                    stroke="currentColor"
                    opacity=".1"
                  />
                  <text x="0" y="35">
                    16 bar
                  </text>
                  <text x="8" y="130">
                    0
                  </text>
                  <polyline
                    points={e.profile
                      .map(
                        (p) =>
                          `${35 + (p.seconds / profileHorizon) * 545},${130 - (p.bars / 16) * 100}`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeDasharray={
                      e.profileKind === "target" ? "6 4" : undefined
                    }
                  />
                  {e.profile.map((p, i) => (
                    <circle
                      key={i}
                      cx={35 + (p.seconds / profileHorizon) * 545}
                      cy={130 - (p.bars / 16) * 100}
                      r="3"
                      fill="var(--accent)"
                    />
                  ))}
                  <text x="35" y="153">
                    0 s
                  </text>
                  <text x="540" y="153">
                    {profileHorizon} s
                  </text>
                </svg>
                <details>
                  <summary>View exact profile values</summary>
                  <table>
                    <thead>
                      <tr>
                        <th>Time (s)</th>
                        <th>Pressure (bar)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.profile.map((p, i) => (
                        <tr key={i}>
                          <td>{p.seconds}</td>
                          <td>{p.bars}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </>
            ) : (
              <p className="muted">
                No profile recorded. Add target points or manual measurements in
                Edit.
              </p>
            )}
            <small>
              No live machine connection. Lines connect entered points only.
            </small>
          </section>
        ) : (
          <section className="profile">
            <div className="section-title">
              <h3>Pour plan</h3>
              <span className="pill">Cumulative water targets</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Start</th>
                  <th>Add</th>
                  <th>Scale reads</th>
                </tr>
              </thead>
              <tbody>
                {stageIncrements(e.stages).map((s, i) => (
                  <tr key={i}>
                    <td>
                      {i === 0
                        ? "01 · Bloom"
                        : `${String(i + 1).padStart(2, "0")} · Pour`}
                    </td>
                    <td>{s.seconds} s</td>
                    <td>+{s.increment} g</td>
                    <td>{s.water} g</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted">
              Bloom is included in total water. Finish time is recorded
              separately.
            </p>
          </section>
        )}
        <div className="tasting">
          <span className="eyebrow">IN THE CUP</span>
          <p>{e.notes || "No tasting notes yet."}</p>
          <div className="taste-tags">
            {Object.entries(e.sensory).map(([key, value]) => (
              <span key={key}>
                {key} <b>{value === null ? "Unknown" : `${value}/5`}</b>
              </span>
            ))}
          </div>
        </div>
        <div className="detail-actions">
          <button onClick={onDuplicate}>
            <Copy size={16} /> Duplicate into a trial
          </button>
          <button
            className="icon-button danger"
            aria-label="Delete experiment"
            onClick={onDelete}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </article>
      <section className="guidance">
        <span className="eyebrow">A THOUGHT FOR YOUR NEXT BREW · RULES V1</span>
        <h3>{g.title}</h3>
        <p>{g.hypothesis}</p>
        <div className="suggestion">
          <FlaskConical size={22} />
          <strong>{g.test}</strong>
        </div>
        <details>
          <summary>Why this suggestion?</summary>
          <p>
            <b>Observation:</b> {g.evidence}
          </p>
          <p>
            <b>Keep steady:</b> {g.constants}
          </p>
          <p>
            <b>Uncertainty:</b> {g.uncertainty} If sweetness or enjoyment drops,
            return to the baseline. Repeat before concluding.
          </p>
          <p>
            Shot time is a diagnostic observation, not a universal 30-second
            target. No extraction percentage is inferred.
          </p>
          <a href={g.source} target="_blank" rel="noreferrer">
            Research basis: extraction & taste ↗
          </a>
          <p className="muted">
            Reviewed 26 October 2026 · hypothesis-generating guidance, not a
            diagnosis.
          </p>
        </details>
      </section>
    </>
  );
}
function Comparison({ a, b }: { a: Experiment; b: Experiment }) {
  const diff = changes(a, b);
  const show = (v: unknown) =>
    v === undefined
      ? "Not recorded"
      : typeof v === "object"
        ? JSON.stringify(v)
        : String(v);
  return (
    <section className="comparison">
      <span className="eyebrow">BASELINE → TRIAL</span>
      <h2>What changed?</h2>
      <p>
        {a.name} → {b.name}
      </p>
      {a.timing !== b.timing && (
        <p className="error">
          Different timing conventions: durations are not directly comparable.
        </p>
      )}
      {a.grinder !== b.grinder && (
        <p className="notice">
          Different grinders: numeric settings are not equivalent.
        </p>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Variable</th>
              <th>Baseline</th>
              <th>Trial</th>
            </tr>
          </thead>
          <tbody>
            {diff.map((d) => (
              <tr key={d.field}>
                <th>{d.field}</th>
                <td>{show(d.before)}</td>
                <td>{show(d.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!diff.length && (
        <p>No brewing variables changed. This is a repeat of the baseline.</p>
      )}
      <p className="muted">
        Time can change as an outcome of yield or grind. A higher rating is an
        association, not proof of cause. Compare the same bean at similar
        tasting temperatures.
      </p>
    </section>
  );
}
