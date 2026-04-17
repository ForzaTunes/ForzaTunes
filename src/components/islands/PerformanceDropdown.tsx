import { useEffect, useRef, useState } from "react";

export interface ClassRange {
  class: string;
  min: number;
  max: number;
}

interface PerformanceDropdownProps {
  classRanges: ClassRange[];
  carClasses: string[];
  piMin: string;
  piMax: string;
  onApply: (next: {
    carClasses: string[];
    piMin: string;
    piMax: string;
  }) => void;
  buttonClassName: string;
  panelAlign?: "left" | "right";
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="5 8 10 13 15 8" />
    </svg>
  );
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sorted1 = [...a].sort();
  const sorted2 = [...b].sort();
  return sorted1.every((v, i) => v === sorted2[i]);
}

function buildButtonLabel(
  carClasses: string[],
  piMin: string,
  piMax: string,
): string {
  if (carClasses.length > 0) {
    if (carClasses.length === 1) return `${carClasses[0]} Class`;
    return `${carClasses[0]} +${carClasses.length - 1}`;
  }
  if (!piMin && !piMax) return "All Classes";
  if (piMin && piMax) return `PI ${piMin}–${piMax}`;
  if (piMin) return `PI ${piMin}+`;
  return `PI ≤ ${piMax}`;
}

export default function PerformanceDropdown({
  classRanges,
  carClasses,
  piMin,
  piMax,
  onApply,
  buttonClassName,
  panelAlign = "left",
}: PerformanceDropdownProps) {
  const [open, setOpen] = useState(false);
  const [draftClasses, setDraftClasses] = useState<string[]>(carClasses);
  const [draftMin, setDraftMin] = useState(piMin);
  const [draftMax, setDraftMax] = useState(piMax);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftClasses(carClasses);
  }, [carClasses]);

  useEffect(() => {
    setDraftMin(piMin);
    setDraftMax(piMax);
  }, [piMin, piMax]);

  function commitIfChanged() {
    const classesChanged = !arraysEqual(draftClasses, carClasses);
    const rangeChanged = draftMin !== piMin || draftMax !== piMax;
    if (classesChanged || rangeChanged) {
      onApply({
        carClasses: draftClasses,
        piMin: draftMin,
        piMax: draftMax,
      });
    }
  }

  function closeAndCommit() {
    commitIfChanged();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeAndCommit();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDraftClasses(carClasses);
        setDraftMin(piMin);
        setDraftMax(piMax);
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draftClasses, draftMin, draftMax, carClasses, piMin, piMax]);

  const buttonLabel = buildButtonLabel(carClasses, piMin, piMax);
  const isActive = carClasses.length > 0 || piMin !== "" || piMax !== "";

  function toggleClass(cls: string) {
    setDraftClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls],
    );
  }

  function clearAll() {
    setDraftClasses([]);
    setDraftMin("");
    setDraftMax("");
  }

  const draftIsActive =
    draftClasses.length > 0 || draftMin !== "" || draftMax !== "";

  return (
    <div className="relative flex" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          if (open) closeAndCommit();
          else setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Filter by performance class or PI range"
        className={buttonClassName}
      >
        <span
          className={`truncate ${isActive ? "text-white" : "text-gray-300"}`}
        >
          {buttonLabel}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div
          className={`absolute top-full z-20 mt-1 min-w-80 w-max bg-gray-900 border border-gray-700 shadow-xl p-3 ${
            panelAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="text-xs font-heading font-bold uppercase tracking-widest text-gray-400 mb-2">
            Class
          </div>
          <div className="flex flex-nowrap gap-1.5 mb-4">
            {classRanges.map((range) => {
              const explicitlySelected = draftClasses.includes(range.class);
              const allMode = draftClasses.length === 0;
              const showActive = allMode || explicitlySelected;
              return (
                <button
                  key={range.class}
                  type="button"
                  onClick={() => toggleClass(range.class)}
                  aria-pressed={explicitlySelected}
                  title={`${range.class}: ${range.min}–${range.max}`}
                  className={`font-heading font-bold uppercase tabular-nums text-sm px-2.5 py-1 border transition-colors ${
                    showActive
                      ? "border-transparent text-white"
                      : "border-gray-700 bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300"
                  }`}
                  style={
                    showActive
                      ? {
                          backgroundColor: `var(--fz-class-${range.class})`,
                          color: `var(--fz-class-${range.class}-fg, #ffffff)`,
                          opacity: allMode ? 0.85 : 1,
                        }
                      : undefined
                  }
                >
                  {range.class}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-heading font-bold uppercase tracking-widest text-gray-400 mb-2">
            Custom PI Range
          </div>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              value={draftMin}
              onChange={(e) => setDraftMin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") closeAndCommit();
              }}
              placeholder="Min"
              aria-label="Minimum PI"
              inputMode="numeric"
              className="w-full bg-gray-950 border border-gray-700 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-400"
            />
            <span className="text-gray-500 text-sm" aria-hidden="true">
              –
            </span>
            <input
              type="number"
              value={draftMax}
              onChange={(e) => setDraftMax(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") closeAndCommit();
              }}
              placeholder="Max"
              aria-label="Maximum PI"
              inputMode="numeric"
              className="w-full bg-gray-950 border border-gray-700 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-400"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={clearAll}
              disabled={!draftIsActive}
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-accent-300 disabled:opacity-40 disabled:hover:text-gray-400 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={closeAndCommit}
              className="px-3 py-1.5 text-xs uppercase tracking-widest font-heading font-bold bg-accent-600 hover:bg-accent-500 text-white transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
