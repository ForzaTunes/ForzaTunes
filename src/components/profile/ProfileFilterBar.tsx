import Dropdown, {
  type DropdownOption,
} from "../islands/Dropdown";
import ViewToggle from "../common/ViewToggle";

export interface ProfileFilterGame {
  slug: string;
  name: string;
}

interface ProfileFilterBarProps {
  games: ProfileFilterGame[];
  currentGameSlug: string | null;
  currentSort: string;
}

const SORT_OPTIONS: DropdownOption[] = [
  { value: "newest", label: "Newest" },
  { value: "most_starred", label: "Most Starred" },
  { value: "pi_asc", label: "PI (Low \u2192 High)" },
  { value: "pi_desc", label: "PI (High \u2192 Low)" },
];

const ALL_GAMES_VALUE = "all";

const segmentButton =
  "inline-flex items-center gap-2 px-3 py-2 text-sm font-heading uppercase tracking-wider text-white hover:bg-white/5 focus:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400 transition-colors whitespace-nowrap";
const firstSegmentButton = segmentButton;
const dividedSegmentButton = `${segmentButton} border-l border-gray-700`;

function applyParams(mutate: (params: URLSearchParams) => void) {
  const params = new URLSearchParams(window.location.search);
  mutate(params);
  params.delete("page");
  window.location.search = params.toString();
}

function GameIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 11h.01M17 11h.01M12 14h.01M9 8h6a4 4 0 014 4v1a4 4 0 01-4 4h-1.172a2 2 0 01-1.414-.586l-1.414-1.414a2 2 0 00-1.414-.586H9a4 4 0 01-4-4v-1a4 4 0 014-4z"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h18M6 12h12M10 18h4"
      />
    </svg>
  );
}

export default function ProfileFilterBar({
  games,
  currentGameSlug,
  currentSort,
}: ProfileFilterBarProps) {
  const gameOptions: DropdownOption[] = [
    { value: ALL_GAMES_VALUE, label: "All Games" },
    ...games.map((g) => ({ value: g.slug, label: g.name })),
  ];

  const activeGameValue = currentGameSlug ?? ALL_GAMES_VALUE;

  function handleGameChange(value: string) {
    applyParams((params) => {
      if (value === ALL_GAMES_VALUE) {
        params.delete("game");
      } else {
        params.set("game", value);
      }
    });
  }

  function handleSortChange(value: string) {
    applyParams((params) => {
      if (value === "newest") {
        params.delete("sort");
      } else {
        params.set("sort", value);
      }
    });
  }

  return (
    <div className="mb-6 inline-flex items-stretch max-w-full border border-gray-700 bg-gray-900">
      <Dropdown
        value={activeGameValue}
        options={gameOptions}
        onChange={handleGameChange}
        ariaLabel="Filter by game"
        leadingIcon={<GameIcon />}
        buttonClassName={firstSegmentButton}
      />
      <Dropdown
        value={currentSort}
        options={SORT_OPTIONS}
        onChange={handleSortChange}
        ariaLabel="Sort tunes"
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
  );
}
