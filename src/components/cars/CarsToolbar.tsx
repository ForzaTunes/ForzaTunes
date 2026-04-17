import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import Dropdown, { type DropdownOption } from "../islands/Dropdown";
import ViewToggle from "../common/ViewToggle";

export interface CarSearchEntry {
  id: number;
  make: string;
  model: string;
  year: number;
}

interface CarsToolbarProps {
  makes: string[];
  currentMake: string;
  totalCount: number;
  searchIndex: CarSearchEntry[];
}

const FILTER_ROWS_SELECTOR = ".car-card, .car-row";

function applyMakeParam(value: string) {
  const params = new URLSearchParams(window.location.search);
  if (value) params.set("make", value);
  else params.delete("make");
  params.delete("page");
  window.location.search = params.toString();
}

function updateVisibleCount(visible: number, total: number, query: string) {
  const counter = document.getElementById("car-count");
  if (!counter) return;
  counter.textContent = query ? `${visible} of ${total}` : String(total);
}

function setAllVisible(totalCount: number) {
  const rows = document.querySelectorAll<HTMLElement>(FILTER_ROWS_SELECTOR);
  rows.forEach((row) => {
    row.style.display = "";
  });
  updateVisibleCount(totalCount, totalCount, "");
}

function applyVisibility(matchedIds: Set<number>, totalCount: number, query: string) {
  const rows = document.querySelectorAll<HTMLElement>(FILTER_ROWS_SELECTOR);
  rows.forEach((row) => {
    const idAttr = row.dataset.carId;
    const id = idAttr ? Number(idAttr) : NaN;
    const match = Number.isFinite(id) && matchedIds.has(id);
    row.style.display = match ? "" : "none";
  });
  updateVisibleCount(matchedIds.size, totalCount, query);
}

export default function CarsToolbar({
  makes,
  currentMake,
  totalCount,
  searchIndex,
}: CarsToolbarProps) {
  const [query, setQuery] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(searchIndex, {
        keys: [
          { name: "make", weight: 0.5 },
          { name: "model", weight: 0.4 },
          { name: "year", weight: 0.1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        includeScore: false,
        minMatchCharLength: 2,
        getFn: (obj, path) => {
          const value = obj[path as keyof CarSearchEntry];
          return value == null ? "" : String(value);
        },
      }),
    [searchIndex],
  );

  function runSearch(newQuery: string) {
    const trimmed = newQuery.trim();
    if (trimmed.length === 0) {
      setAllVisible(totalCount);
      return;
    }
    const results = fuse.search(trimmed);
    const matchedIds = new Set(results.map((r) => r.item.id));
    applyVisibility(matchedIds, totalCount, trimmed);
  }

  function handleSearchChange(newValue: string) {
    setQuery(newValue);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => runSearch(newValue), 120);
  }

  function handleSearchClear() {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setQuery("");
    runSearch("");
  }

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const makeOptions: DropdownOption[] = [
    { value: "", label: "All Makes" },
    ...makes.map((m) => ({ value: m, label: m })),
  ];

  const showClear = query.length > 0;

  return (
    <div className="border border-gray-700 bg-gray-900 overflow-visible">
      <div className="relative border-b border-gray-700">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
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
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search cars by make, model, or year..."
          aria-label="Search cars"
          className="w-full bg-transparent border-0 pl-10 pr-10 py-3 text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400 transition-colors"
        />
        {showClear && (
          <button
            type="button"
            onClick={handleSearchClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-accent-300 focus-visible:text-accent-300 focus-visible:outline-none transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-stretch">
        <Dropdown
          ariaLabel="Filter by make"
          value={currentMake}
          options={makeOptions}
          onChange={applyMakeParam}
          buttonClassName="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-heading uppercase tracking-wider text-white hover:bg-white/5 focus:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400 transition-colors whitespace-nowrap"
          searchable
          searchPlaceholder="Search makes..."
        />

        <div className="ml-auto flex items-center border-l border-gray-700 px-2">
          <ViewToggle
            storageKey="cars-view"
            targetSelector="[data-cars-view]"
            defaultView="grid"
          />
        </div>
      </div>
    </div>
  );
}
