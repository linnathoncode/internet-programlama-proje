import React from "react";
import Spinner from "./Spinner";
import { useAppContext } from "../context/AppContext";
const PlaylistBar = () => {
  const {
    playlistTracks,
    playlistName,
    playlistDescription,
    creatingPlaylist,
    setPlaylistName,
    setPlaylistDescription,
    removeTrackFromPlaylist,
    createPlaylist,
  } = useAppContext();

  return (
    // Fixed width, bg, border, etc. Adjust width (w-80) as needed.
    // Add min-w-0 to prevent shrinking below content size if needed, though w-80 implies fixed size.
    <aside className="w-80 p-6 border-l border-white/10 bg-black/30 backdrop-blur-md hidden md:block shadow-xl shadow-secondary/40 rounded-lg overflow-y-auto">
      {/* Add overflow-y-auto to make it scrollable */}

      <h3 className="text-xl font-bold mb-6 text-white">Your Playlist</h3>

      {/* Playlist Name Input */}
      <div className="mb-4">
        <label
          htmlFor="playlist-name"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Playlist Name
        </label>
        <input
          id="playlist-name"
          type="text"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          className="w-full px-3 py-2 bg-primary border border-primary/20 rounded-md text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-accent focus:border-accent"
          placeholder="e.g., My Awesome Mix"
          disabled={creatingPlaylist}
        />
      </div>

      {/* Playlist Description Input */}
      <div className="mb-6">
        <label
          htmlFor="playlist-description"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="playlist-description"
          value={playlistDescription}
          onChange={(e) => setPlaylistDescription(e.target.value)}
          className="w-full px-3 py-2 bg-primary border border-primary/20 rounded-md text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-accent focus:border-accent h-24 resize-none"
          placeholder="Optional description"
          disabled={creatingPlaylist}
        />
      </div>

      {/* Create Playlist Button */}
      <button
        onClick={createPlaylist}
        disabled={playlistTracks.length === 0 || creatingPlaylist}
        className={`w-full px-6 py-2 bg-accent hover:bg-accent-dark text-black rounded-full shadow-lg transition duration-300 font-semibold flex items-center justify-center ${
          playlistTracks.length === 0 || creatingPlaylist
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        {creatingPlaylist ? (
          <>
            <Spinner size="w-5 h-5 mr-2" color="currentColor" /> Creating...
          </>
        ) : (
          "Create Playlist"
        )}
      </button>

      <div className="mt-8">
        <h4 className="text-lg font-semibold mb-4 text-gray-300">
          Tracks ({playlistTracks.length})
        </h4>
        {playlistTracks.length === 0 ? (
          <p className="text-center text-gray-400 text-sm">
            Add similar tracks here!
          </p>
        ) : (
          <ul className="space-y-3">
            {/* You could potentially add drag-and-drop here later */}
            {playlistTracks.map((track, index) => (
              // Optional: Extract this into a separate PlaylistTrackItem component
              <li
                key={track.spotifyId || index} // Use spotifyId as key
                className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between gap-3 text-sm"
              >
                <div>
                  <p className="font-medium">{track.title}</p>
                  <p className="text-xs text-gray-400">{track.artist}</p>
                </div>
                <button
                  onClick={() => removeTrackFromPlaylist(track.spotifyId)}
                  className="flex-shrink-0 p-1 text-red-400 hover:text-red-300 transition"
                  disabled={creatingPlaylist}
                  title="Remove track"
                >
                  {/* Simple X icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default PlaylistBar;
