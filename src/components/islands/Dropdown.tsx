import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
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

export default function Dropdown({
  value,
  options,
  onChange,
  ariaLabel,
  leadingIcon,
  buttonClassName,
  panelAlign = "left",
  searchable = false,
  searchPlaceholder = "Search...",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentLabel =
    options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "";

  const filteredOptions = useMemo(() => {
    if (!searchable || query.trim() === "") return options;
    const needle = query.trim().toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(needle));
  }, [options, query, searchable]);

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
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, searchable]);

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setOpen(false);
  }

  return (
    <div className="relative flex" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
        <span className="truncate">{currentLabel}</span>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredOptions[0]) {
                    e.preventDefault();
                    handleSelect(filteredOptions[0].value);
                  }
                }}
                placeholder={searchPlaceholder}
                aria-label={`Filter ${ariaLabel}`}
                className="w-full bg-transparent border-0 pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          )}
          <ul
            role="listbox"
            aria-label={ariaLabel}
            className="max-h-72 overflow-y-auto w-max min-w-full"
          >
            {filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 italic">
                No matches
              </li>
            )}
            {filteredOptions.map((opt) => {
              const selected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-3 py-2 text-sm font-heading uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                    selected
                      ? "bg-accent-900/40 text-accent-300"
                      : "text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  {opt.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
