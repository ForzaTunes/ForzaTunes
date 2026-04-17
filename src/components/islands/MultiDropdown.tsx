import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface MultiDropdownOption {
  value: string;
  label: string;
}

interface MultiDropdownProps {
  values: string[];
  options: MultiDropdownOption[];
  onApply: (values: string[]) => void;
  ariaLabel: string;
  allLabel: string;
  leadingIcon?: ReactNode;
  buttonClassName?: string;
  panelAlign?: "left" | "right";
  searchable?: boolean;
  searchPlaceholder?: string;
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

function SearchIcon() {
  return (
    <svg
      className="w-4 h-4 text-gray-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function CheckIcon({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 border shrink-0 ${
        active
          ? "border-accent-500 bg-accent-600 text-white"
          : "border-gray-600 bg-gray-950"
      }`}
      aria-hidden="true"
    >
      {active && (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </span>
  );
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sorted1 = [...a].sort();
  const sorted2 = [...b].sort();
  return sorted1.every((v, i) => v === sorted2[i]);
}

function buildButtonLabel(
  values: string[],
  options: MultiDropdownOption[],
  allLabel: string,
): string {
  if (values.length === 0) return allLabel;
  if (values.length === 1) {
    return options.find((o) => o.value === values[0])?.label ?? values[0];
  }
  const first = options.find((o) => o.value === values[0])?.label ?? values[0];
  return `${first} +${values.length - 1}`;
}

export default function MultiDropdown({
  values,
  options,
  onApply,
  ariaLabel,
  allLabel,
  leadingIcon,
  buttonClassName,
  panelAlign = "left",
  searchable = false,
  searchPlaceholder = "Search...",
}: MultiDropdownProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(values);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(values);
  }, [values]);

  const filteredOptions = useMemo(() => {
    if (!searchable || query.trim() === "") return options;
    const needle = query.trim().toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(needle));
  }, [options, query, searchable]);

  function commitIfChanged() {
    if (!arraysEqual(draft, values)) onApply(draft);
  }

  function closeAndCommit() {
    commitIfChanged();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    if (searchable) {
      queueMicrotask(() => searchInputRef.current?.focus());
    }

    function handleMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeAndCommit();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDraft(values);
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
  }, [open, draft, values, searchable]);

  function toggleValue(v: string) {
    setDraft((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }

  function clearAll() {
    setDraft([]);
  }

  const buttonLabel = buildButtonLabel(values, options, allLabel);
  const isActive = values.length > 0;

  return (
    <div className="relative flex" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          if (open) closeAndCommit();
          else setOpen(true);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={
          buttonClassName ??
          "inline-flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-white/5 focus:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400 transition-colors whitespace-nowrap"
        }
      >
        {leadingIcon && (
          <span className="flex items-center text-gray-400 shrink-0">
            {leadingIcon}
          </span>
        )}
        <span
          className={`truncate ${isActive ? "text-white" : "text-gray-300"}`}
        >
          {buttonLabel}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div
          className={`absolute top-full z-20 mt-1 min-w-full bg-gray-900 border border-gray-700 shadow-xl ${
            panelAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          {searchable && (
            <div className="relative border-b border-gray-700">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={`Filter ${ariaLabel}`}
                className="w-full bg-transparent border-0 pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          )}
          <ul
            role="listbox"
            aria-label={ariaLabel}
            aria-multiselectable="true"
            className="max-h-72 overflow-y-auto w-max min-w-full"
          >
            {filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 italic">
                No matches
              </li>
            )}
            {filteredOptions.map((opt) => {
              const active = draft.includes(opt.value);
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={active}
                  onClick={() => toggleValue(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-heading uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                    active
                      ? "bg-accent-900/40 text-accent-300"
                      : "text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  <CheckIcon active={active} />
                  <span>{opt.label}</span>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-700">
            <button
              type="button"
              onClick={clearAll}
              disabled={draft.length === 0}
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-accent-300 disabled:opacity-40 disabled:hover:text-gray-400 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={closeAndCommit}
              className="px-3 py-1 text-xs uppercase tracking-widest font-heading font-bold bg-accent-600 hover:bg-accent-500 text-white transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
