import { useState, useCallback } from "react";
import type { SoundtrackData } from "../../lib/models";
import StationSidebar from "./StationSidebar";
import StationDetail from "./StationDetail";
import FallingSakura from "../effects/FallingSakura";

const GAME_THEME_CLASS: Record<string, string> = {
  fh6: "theme-fh6",
  fh5: "theme-fh5",
  fh4: "theme-fh4",
};

const GAME_BG: Record<string, string> = {
  fh6: "bg-gradient-to-b from-pink-950/40 to-gray-950",
  fh5: "bg-gradient-to-b from-orange-950/40 to-gray-950",
  fh4: "bg-gradient-to-b from-sky-950/40 to-gray-950",
};

interface MusicExplorerProps {
  soundtracks: Record<string, SoundtrackData>;
}

export default function MusicExplorer({ soundtracks }: MusicExplorerProps) {
  const [selectedGame, setSelectedGame] = useState("fh6");
  const gameData = soundtracks[selectedGame];
  const firstStationSlug = gameData?.stations[0]?.slug ?? "";

  const [selectedStationSlug, setSelectedStationSlug] = useState(firstStationSlug);

  const selectedStation = gameData?.stations.find(
    (s) => s.slug === selectedStationSlug,
  );

  const handleGameChange = useCallback(
    (slug: string) => {
      setSelectedGame(slug);
      const newGameData = soundtracks[slug];
      const newFirstSlug = newGameData?.stations[0]?.slug ?? "";
      setSelectedStationSlug(newFirstSlug);
    },
    [soundtracks],
  );

  const handleStationChange = useCallback((slug: string) => {
    setSelectedStationSlug(slug);
  }, []);

  if (!gameData) return null;

  const themeClass = GAME_THEME_CLASS[selectedGame] ?? "";
  const bgClass = GAME_BG[selectedGame] ?? "";
  const hasStations = gameData.stations.length > 0;

  return (
    <div className={`${themeClass} flex flex-col md:flex-row h-full`}>
      <StationSidebar
        soundtracks={soundtracks}
        selectedGame={selectedGame}
        selectedStationSlug={selectedStationSlug}
        onGameChange={handleGameChange}
        onStationChange={handleStationChange}
      />

      <main className={`relative flex-1 min-h-0 overflow-y-auto ${bgClass}`}>
        {selectedGame === "fh6" && (
          <FallingSakura petalCount={18} fallSpeed={0.6} opacity={0.5} className="z-0" />
        )}
        <div className="relative z-10">
          {hasStations && selectedStation ? (
            <StationDetail station={selectedStation} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold italic uppercase tracking-wider text-white/80 mb-3">
                Coming Soon
              </h2>
              <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
                The {gameData.game} soundtrack hasn&apos;t been announced yet. Check back once the radio stations are revealed!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
