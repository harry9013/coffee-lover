import {
  useEffect,
  useRef,
  useState,
  useId,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { X, Pause, Play, RotateCcw } from "lucide-react";
import type { Bean, Place } from "./domain";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const returnFocus = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      queueMicrotask(() => {
        if (!dialog.open && returnFocus.current?.isConnected)
          returnFocus.current.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button
          aria-label="Close dialog"
          className="icon-button"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const fieldId = useId();
  return (
    <div className="field">
      <label htmlFor={fieldId}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </label>
      {isValidElement(children)
        ? cloneElement(
            children as ReactElement<{
              id?: string;
              "aria-describedby"?: string;
            }>,
            {
              id: fieldId,
              "aria-describedby": hint ? `${fieldId}-hint` : undefined,
            },
          )
        : children}
      {hint && <small id={`${fieldId}-hint`}>{hint}</small>}
    </div>
  );
}
export function Bag({ bean, large = false }: { bean: Bean; large?: boolean }) {
  return (
    <div className={`bag-scene ${large ? "large" : ""}`} aria-hidden="true">
      <div
        className="coffee-bag"
        style={{ "--bag": bean.color } as React.CSSProperties}
      >
        <div className="bag-seam" />
        <div className="bag-brand">{bean.roaster}</div>
        <div className="bag-label">
          <span>{bean.origin}</span>
          <strong>{bean.name}</strong>
          <div className="bag-art">◒</div>
          <small>
            {bean.process.split(" · ")[0]}
            <br />
            250 g · whole bean
          </small>
        </div>
        <div className="bag-bottom" />
      </div>
      <div className="bag-shadow" />
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="eyebrow">A fresh page</span>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function Timer() {
  const [elapsed, setElapsed] = useState(0);
  const [start, setStart] = useState<number | null>(null);
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    if (start === null) return;
    const t = setInterval(() => setTick(Date.now()), 250);
    return () => clearInterval(t);
  }, [start]);
  const ms = elapsed + (start === null ? 0 : Math.max(0, tick - start));
  return (
    <div className="timer">
      <div>
        <span className="eyebrow">Brewing timer</span>
        <strong role="timer">
          {String(Math.floor(ms / 60000)).padStart(2, "0")}:
          {String(Math.floor(ms / 1000) % 60).padStart(2, "0")}
        </strong>
      </div>
      <button
        type="button"
        onClick={() => {
          if (start === null) {
            setTick(Date.now());
            setStart(Date.now());
          } else {
            setElapsed(elapsed + Date.now() - start);
            setStart(null);
          }
        }}
      >
        {start === null ? <Play size={16} /> : <Pause size={16} />}{" "}
        {start === null ? "Start" : "Pause"}
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label="Reset timer"
        onClick={() => {
          setElapsed(0);
          setStart(null);
        }}
      >
        <RotateCcw size={17} />
      </button>
      <small>
        Elapsed time recovers from the clock after tab suspension. Background
        alarms are not supported. Timer resets when you leave the Lab.
      </small>
    </div>
  );
}
export function WorldMap({
  places,
  onSelect,
  onPlace,
  compact = false,
}: {
  places: Place[];
  onSelect: (p: Place) => void;
  onPlace?: (lat: number, lng: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={`map ${compact ? "compact" : ""}`}>
      <svg
        viewBox="0 0 900 430"
        role="img"
        aria-label="Schematic world map. All places also appear in the accessible list below."
        onClick={(e) => {
          if (!onPlace) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const scale = Math.min(rect.width / 900, rect.height / 430);
          const x =
            (e.clientX - rect.left - (rect.width - 900 * scale) / 2) / scale;
          const y =
            (e.clientY - rect.top - (rect.height - 430 * scale) / 2) / scale;
          onPlace(
            Math.max(-90, Math.min(90, 90 - (y / 430) * 180)),
            Math.max(-180, Math.min(180, (x / 900) * 360 - 180)),
          );
        }}
      >
        <defs>
          <pattern
            id="grid"
            width="75"
            height="71.67"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 75 0 L 0 0 0 71.67"
              fill="none"
              stroke="currentColor"
              strokeWidth=".5"
              opacity=".13"
            />
          </pattern>
        </defs>
        <rect width="900" height="430" fill="url(#grid)" />
        <g className="land">
          <path d="M48 86L82 65 144 55 167 41 211 51 243 76 227 100 207 114 191 144 167 153 161 180 138 188 132 164 100 149 93 125 65 116Z M165 179L181 188 198 212 225 220 230 234 206 231 186 213Z M237 25L289 23 307 52 283 80 249 78 229 52Z" />
          <path d="M222 229L250 217 277 227 300 249 306 277 284 309 268 347 251 374 239 358 241 328 220 289 207 259Z" />
          <path d="M414 90L444 75 470 78 491 68 518 72 514 99 488 119 459 121 453 145 433 139 417 118Z M438 149L469 137 507 151 532 187 527 221 501 255 481 280 462 265 455 232 434 209 415 180Z M535 248L544 229 550 248 543 273 534 274Z" />
          <path d="M498 75L544 53 584 62 630 48 685 53 722 62 766 57 803 88 781 109 742 111 731 137 702 153 688 190 664 183 649 160 631 159 610 183 593 208 578 180 564 158 535 151 516 118Z M695 200L710 211 717 236 737 246 756 240 764 256 741 267 712 254 696 234Z M779 145L784 161 775 182 768 175Z" />
          <path d="M728 286L766 270 794 278 812 310 800 336 770 343 743 331 721 310Z M838 333L847 344 834 366 824 371 827 355Z" />
        </g>
        {places.map((p) => (
          <g
            key={p.id}
            transform={`translate(${((p.longitude + 180) / 360) * 900},${((90 - p.latitude) / 180) * 430})`}
            className="map-pin"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(p);
            }}
          >
            <circle r="13" opacity=".16" />
            <circle r="5" />
            <title>{p.name}</title>
          </g>
        ))}
      </svg>
      <span className="map-caption">
        Schematic · approximate geography · no external location requests
      </span>
    </div>
  );
}
