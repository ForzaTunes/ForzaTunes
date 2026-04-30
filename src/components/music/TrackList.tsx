import { useState } from "react";
import type { SoundtrackTrack } from "../../lib/models";

interface TrackListProps {
  tracks: SoundtrackTrack[];
}

export default function TrackList({ tracks }: TrackListProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full rounded-xl bg-gray-900/30 ring-1 ring-white/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-sm font-medium text-gray-300">
          Track List ({tracks.length})
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-800">
          <div className="grid grid-cols-[2rem_1fr_1fr] sm:grid-cols-[2.5rem_1fr_1fr] gap-x-3 px-3 sm:px-4 py-2 border-b border-gray-800 text-[10px] sm:text-xs font-heading uppercase tracking-widest text-gray-500">
            <span>#</span>
            <span>Title</span>
            <span>Artist</span>
          </div>

          <div className="divide-y divide-gray-800/40">
            {tracks.map((track, i) => (
              <div
                key={`${track.artist}-${track.title}-${i}`}
                className="group grid grid-cols-[2rem_1fr_1fr] sm:grid-cols-[2.5rem_1fr_1fr] gap-x-3 px-3 sm:px-4 py-2.5 hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-gray-600 tabular-nums text-sm group-hover:text-gray-400 transition-colors">
                  {i + 1}
                </span>
                <span className="text-gray-100 text-sm truncate">{track.title}</span>
                <span className="text-gray-500 text-sm truncate group-hover:text-gray-400 transition-colors">
                  {track.artist}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
