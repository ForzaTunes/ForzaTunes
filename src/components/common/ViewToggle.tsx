import { useEffect, useRef, useState } from "react";

export type ViewMode = "grid" | "table";

interface ViewToggleProps {
  storageKey: string;
  targetSelector: string;
  defaultView?: ViewMode;
  wrapperClassName?: string;
}

const DEFAULT_WRAPPER_CLASSES =
  "inline-flex items-stretch border border-gray-700 bg-gray-900 overflow-hidden";

function readStoredView(storageKey: string, fallback: ViewMode): ViewMode {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === "grid" || raw === "table") return raw;
  } catch {
    // ignore storage errors (private mode, disabled, etc.)
  }
  return fallback;
}

function resolveTarget(
  fromElement: HTMLElement | null,
  selector: string,
): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const scoped = fromElement?.closest(selector);
  if (scoped instanceof HTMLElement) return scoped;
  const fallback = document.querySelector(selector);
  return fallback instanceof HTMLElement ? fallback : null;
}

export default function ViewToggle({
  storageKey,
  targetSelector,
  defaultView = "grid",
  wrapperClassName,
}: ViewToggleProps) {
  const [view, setView] = useState<ViewMode>(defaultView);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = readStoredView(storageKey, defaultView);
    setView(stored);
    const target = resolveTarget(rootRef.current, targetSelector);
    if (target) target.dataset.view = stored;
  }, [storageKey, targetSelector, defaultView]);

  function handleSelect(next: ViewMode) {
    if (next === view) return;
    setView(next);
    const target = resolveTarget(rootRef.current, targetSelector);
    if (target) target.dataset.view = next;
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // ignore storage errors
    }
  }

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="View mode"
      className={wrapperClassName ?? DEFAULT_WRAPPER_CLASSES}
    >
      <ToggleButton
        active={view === "grid"}
        onClick={() => handleSelect("grid")}
        label="Grid view"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      </ToggleButton>
      <ToggleButton
        active={view === "table"}
        onClick={() => handleSelect("table")}
        label="Table view"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </ToggleButton>
    </div>
  );
}

interface ToggleButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

function ToggleButton({ active, label, onClick, children }: ToggleButtonProps) {
  const base =
    "flex items-center justify-center px-2.5 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400";
  const activeCls = "bg-accent-600 text-white";
  const idleCls = "text-gray-400 hover:text-white hover:bg-gray-800";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={`${base} ${active ? activeCls : idleCls}`}
    >
      {children}
    </button>
  );
}
