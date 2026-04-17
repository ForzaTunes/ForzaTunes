import { useEffect, useRef, useState } from "react";
import Dropdown, { type DropdownOption } from "./Dropdown";
import MultiDropdown, { type MultiDropdownOption } from "./MultiDropdown";
import PerformanceDropdown, { type ClassRange } from "./PerformanceDropdown";
import DrivetrainDropdown from "./DrivetrainDropdown";
import ViewToggle from "../common/ViewToggle";

type Drivetrain = "FWD" | "RWD" | "AWD";

interface TuneTypeOption {
  value: string;
  label: string;
}

interface CurrentFilters {
  tuneTypes: string[];
  carClasses: string[];
  makes: string[];
  drivetrains: Drivetrain[];
  piMin: string;
  piMax: string;
}

interface TunesToolbarProps {
  currentQuery: string;
  tuneTypes: TuneTypeOption[];
  makes: string[];
  currentFilters: CurrentFilters;
  classRanges: ClassRange[];
  currentSort: string;
  totalCount: number;
}

const SORT_OPTIONS: DropdownOption[] = [
  { value: "newest", label: "Newest" },
  { value: "most_starred", label: "Most Starred" },
  { value: "pi_asc", label: "PI (Low → High)" },
  { value: "pi_desc", label: "PI (High → Low)" },
];

const segmentButton =
  "inline-flex items-center gap-2 px-3 py-2.5 text-sm font-heading uppercase tracking-wider text-white hover:bg-white/5 focus:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400 transition-colors whitespace-nowrap";
const firstSegmentButton = segmentButton;
const dividedSegmentButton = `${segmentButton} border-l border-gray-700`;
const drivetrainSegmentButton = `${dividedSegmentButton} border-r border-gray-700`;

function SortIcon() {
  return (
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
        strokeWidth={2}
        d="M3 6h18M6 12h12M10 18h4"
      />
    </svg>
  );
}

function setParam(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

function applyParams(mutate: (params: URLSearchParams) => void) {
  const params = new URLSearchParams(window.location.search);
  mutate(params);
  params.delete("page");
  window.location.search = params.toString();
}

export default function TunesToolbar({
  currentQuery,
  tuneTypes,
  makes,
  currentFilters,
  classRanges,
  currentSort,
  totalCount,
}: TunesToolbarProps) {
  const [query, setQuery] = useState(currentQuery);
  const [loading, setLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  function navigateWithQuery(newValue: string) {
    setLoading(true);
    applyParams((params) => {
      setParam(params, "q", newValue);
    });
  }

  function handleSearchChange(newValue: string) {
    setQuery(newValue);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => navigateWithQuery(newValue), 300);
  }

  function handleSearchClear() {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setQuery("");
    navigateWithQuery("");
  }

  function applyListParam(key: string, values: string[]) {
    applyParams((params) => setParam(params, key, values.join(",")));
  }

  function applySingleParam(key: string, value: string) {
    applyParams((params) => setParam(params, key, value));
  }

  function applyPerformance(next: {
    carClasses: string[];
    piMin: string;
    piMax: string;
  }) {
    applyParams((params) => {
      setParam(params, "class", next.carClasses.join(","));
      setParam(params, "piMin", next.piMin);
      setParam(params, "piMax", next.piMax);
    });
  }

  const tuneTypeOptions: MultiDropdownOption[] = tuneTypes.map((t) => ({
    value: t.value,
    label: t.label,
  }));
  const makeOptions: MultiDropdownOption[] = makes.map((m) => ({
    value: m,
    label: m,
  }));

  const showClear = query.length > 0 && !loading;
  const countLabel = `${totalCount} ${totalCount === 1 ? "tune" : "tunes"} found`;

  return (
    <div
      className="border border-gray-700 bg-gray-900 overflow-visible"
      aria-busy={loading}
    >
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
              navigateWithQuery(query);
            }
          }}
          placeholder="Search title, creator, make, or model..."
          aria-label="Search tunes"
          className="w-full bg-transparent border-0 pl-10 pr-10 py-3 text-white placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400 transition-colors"
        />
        {loading && (
          <span
            aria-hidden="true"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-600 border-t-accent-400 rounded-full animate-spin"
          />
        )}
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
        <MultiDropdown
          ariaLabel="Filter by tune type"
          allLabel="All Types"
          values={currentFilters.tuneTypes}
          options={tuneTypeOptions}
          onApply={(v) => applyListParam("type", v)}
          buttonClassName={firstSegmentButton}
        />

        <PerformanceDropdown
          classRanges={classRanges}
          carClasses={currentFilters.carClasses}
          piMin={currentFilters.piMin}
          piMax={currentFilters.piMax}
          onApply={applyPerformance}
          buttonClassName={dividedSegmentButton}
        />

        <MultiDropdown
          ariaLabel="Filter by make"
          allLabel="All Makes"
          values={currentFilters.makes}
          options={makeOptions}
          onApply={(v) => applyListParam("make", v)}
          buttonClassName={dividedSegmentButton}
          searchable
          searchPlaceholder="Search makes..."
        />

        <DrivetrainDropdown
          selected={currentFilters.drivetrains}
          onApply={(next) => applyListParam("drivetrain", next)}
          buttonClassName={drivetrainSegmentButton}
        />

        <div className="ml-auto flex items-center px-4 py-2.5 border-l border-gray-700 text-sm text-gray-400 whitespace-nowrap">
          {countLabel}
        </div>

        <Dropdown
          ariaLabel="Sort tunes"
          value={currentSort}
          options={SORT_OPTIONS}
          onChange={(v) => applySingleParam("sort", v)}
          leadingIcon={<SortIcon />}
          buttonClassName={dividedSegmentButton}
          panelAlign="right"
        />

        <ViewToggle
          storageKey="tunes-view"
          targetSelector="[data-tunes-view]"
          defaultView="grid"
          wrapperClassName="inline-flex items-stretch border-l border-gray-700"
        />
      </div>
    </div>
  );
}
