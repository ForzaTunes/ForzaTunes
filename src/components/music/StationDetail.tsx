import type { RadioStation } from "../../lib/models";
import TrackList from "./TrackList";

interface StationDetailProps {
  station: RadioStation;
}

const GENRE_GRADIENTS: Record<string, string> = {
  "Pop": "from-pink-950/30",
  "Electronic / EDM": "from-blue-950/30",
  "Hip-Hop": "from-amber-950/30",
  "Rock / Alternative": "from-red-950/30",
  "Drum & Bass": "from-cyan-950/30",
  "Classical": "from-purple-950/30",
  "Punk Rock": "from-orange-950/30",
  "Synthwave": "from-violet-950/30",
  "Throwback": "from-emerald-950/30",
  "Indie / Alternative": "from-teal-950/30",
  "J-Pop / City Pop": "from-fuchsia-950/30",
  "Neo-Classical": "from-indigo-950/30",
};

function getSpotifyEmbedUrl(spotifyUrl: string): string {
  return spotifyUrl.replace("/playlist/", "/embed/playlist/") + "?theme=0";
}

export default function StationDetail({ station }: StationDetailProps) {
  const gradient = GENRE_GRADIENTS[station.genre] ?? "from-gray-950/30";

  return (
    <div className={`min-h-full bg-gradient-to-b ${gradient} to-transparent`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        <header>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold italic uppercase tracking-wider text-white">
              {station.name}
            </h2>
            <span className="bg-white/10 text-gray-300 text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
              {station.genre}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {station.tracks.length} tracks
          </p>
        </header>

        {station.spotifyUrl && (
          <div className="rounded-xl overflow-hidden bg-gray-900/50 ring-1 ring-white/5">
            <iframe
              title={`${station.name} Spotify Playlist`}
              src={getSpotifyEmbedUrl(station.spotifyUrl)}
              width="100%"
              height="500"
              allow="encrypted-media"
              loading="lazy"
              className="border-0 block md:h-[500px] h-[352px]"
            />
          </div>
        )}

        <TrackList tracks={station.tracks} />
      </div>
    </div>
  );
}
