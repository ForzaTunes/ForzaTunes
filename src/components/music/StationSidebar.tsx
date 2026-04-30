import type { SoundtrackData } from "../../lib/models";

interface GameOption {
  slug: string;
  name: string;
}

interface StationSidebarProps {
  soundtracks: Record<string, SoundtrackData>;
  selectedGame: string;
  selectedStationSlug: string;
  onGameChange: (slug: string) => void;
  onStationChange: (slug: string) => void;
}

const GAMES: GameOption[] = [
  { slug: "fh6", name: "FH6" },
  { slug: "fh5", name: "FH5" },
  { slug: "fh4", name: "FH4" },
];

export default function StationSidebar({
  soundtracks,
  selectedGame,
  selectedStationSlug,
  onGameChange,
  onStationChange,
}: StationSidebarProps) {
  const gameData = soundtracks[selectedGame];
  if (!gameData) return null;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[280px] shrink-0 bg-gray-900/80 backdrop-blur-sm border-r border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 space-y-3">
          <p className="text-[10px] font-heading font-semibold italic uppercase tracking-[0.3em] text-accent-400">
            ForzaTunesTunes
          </p>
          <div className="flex gap-1">
            {GAMES.map((game) => (
              <button
                key={game.slug}
                type="button"
                onClick={() => onGameChange(game.slug)}
                className={`px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-widest border transition-colors ${
                  game.slug === selectedGame
                    ? "border-accent-500 bg-accent-600 text-white"
                    : "border-gray-700 bg-gray-900 text-gray-400 hover:border-accent-500 hover:text-accent-300"
                }`}
              >
                {game.name}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2" aria-label="Radio stations">
          {gameData.stations.map((station) => {
            const isActive = station.slug === selectedStationSlug;
            return (
              <button
                key={station.slug}
                type="button"
                onClick={() => onStationChange(station.slug)}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  isActive
                    ? "bg-accent-600/15 border-l-2 border-accent-500 text-white"
                    : "border-l-2 border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <span className="block text-sm font-medium truncate">
                  {station.name}
                </span>
                <span className="block text-[11px] text-gray-600 mt-0.5">
                  {station.genre} &middot; {station.tracks.length} tracks
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top strip */}
      <div className="md:hidden border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none">
          {GAMES.map((game) => (
            <button
              key={game.slug}
              type="button"
              onClick={() => onGameChange(game.slug)}
              className={`shrink-0 px-2.5 py-1 text-[10px] font-heading font-bold uppercase tracking-widest border transition-colors ${
                game.slug === selectedGame
                  ? "border-accent-500 bg-accent-600 text-white"
                  : "border-gray-700 bg-gray-900 text-gray-400"
              }`}
            >
              {game.name}
            </button>
          ))}

          <div className="w-px h-5 bg-gray-700 shrink-0" />

          {gameData.stations.map((station) => {
            const isActive = station.slug === selectedStationSlug;
            return (
              <button
                key={station.slug}
                type="button"
                onClick={() => onStationChange(station.slug)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-accent-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {station.name}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
