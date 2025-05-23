import React from "react";
import Spinner from "./Spinner";

const TrackItem = ({ track, index }) => {
  const {
    title,
    artist,
    album,
    spotifyId,
    mbid,
    genres,
    isOpen,
    isLoadingSimilar = false,
  } = track;

  const artistName = artist?.name || artist?.title || "Unknown Artist";

  return (
    <div key={index} className={`rounded-x1 overflow-hidden`}>
      {/* Main track item (li is clickable to toggle panel) */}
      <li
        className="bg-white/5 border border-secondary/50 rounded-xl p-4 flex items-center gap-4 shadow-sm cursor-pointer transition-colors duration-200 hover:bg-white/10"
        key={spotifyId || mbid || index} // Key should ideally be on the list item
      >
        {/* ... Track Info JSX ... */}
        <div className="flex-grow">
          <p className="font-semibold text-lg">{title || "Unknown Title"}</p>
          <p className="text-sm text-gray-300">{artistName}</p>
          {album?.title && (
            <p className="text-xs text-gray-400 mt-1">on {album?.title}</p>
          )}
          <p className="text-xs text-accent mt-1">
            {genres.slice(0, 3).join(", ")}
          </p>
        </div>
      </li>
    </div>
  );
};

export default TrackItem;
