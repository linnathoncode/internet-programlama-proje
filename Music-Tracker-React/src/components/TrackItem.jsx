// src/components/TrackItem.jsx
import React from "react";
import Spinner from "./Spinner";
import { FaPlus } from "react-icons/fa";

const TrackItem = ({
  track,
  index,
  onToggleOpen,
  onSimilarLimitChange,
  onFetchSimilar,
  onAddTrackToPlaylist,
}) => {
  const {
    title,
    artist,
    album,
    spotifyId,
    mbid,
    genres,
    timestamp,
    isOpen,
    isLoadingSimilar,
    similarTracks,
    similarTracksLimit,
    similarTracksError,
    similarFetchAttempted,
  } = track;

  // DEBUGGING
  // console.log(`TrackItem ${index} (${title}):`, {
  //   isOpen,
  //   isLoadingSimilar,
  //   similarFetchAttempted, // Log the new flag
  //   similarTracks: similarTracks
  //     ? `${similarTracks.length} tracks`
  //     : similarTracks,
  //   similarTracksError,
  //   similarTracksLimit,
  //   spotifyId,
  //   mbid,
  //   artist: artist?.name || artist?.title,
  // });
  // if (
  //   isOpen &&
  //   !isLoadingSimilar &&
  //   similarTracks &&
  //   similarTracks.length > 0
  // ) {
  //   console.log(`TrackItem ${index} Similar Tracks Data:`, similarTracks);
  // }
  // END OF DEBUGGING

  const handleItemClick = () => {
    onToggleOpen(index);
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    if (!isNaN(newLimit) && newLimit > 0) {
      onSimilarLimitChange(index, newLimit);
    } else {
      console.warn("Invalid limit value:", e.target.value);
    }
  };

  const handleGenerateSimilarClick = () => {
    onFetchSimilar(index, {
      artistName: artist?.name || artist?.title,
      trackName: title,
      mbid: mbid,
    });
  };

  const handleAddSimilarTrack = (similarTrack) => {
    if (
      !similarTrack ||
      (!similarTrack.spotifyId && !similarTrack.spotifyUri)
    ) {
      console.warn(
        "Cannot add similar track: Missing Spotify ID or URI",
        similarTrack
      );
      alert("Cannot add track: Missing Spotify info.");
      return;
    }

    const trackToAdd = {
      ...similarTrack,
      spotifyId:
        similarTrack.spotifyId ||
        (similarTrack.spotifyUri
          ? similarTrack.spotifyUri.split(":").pop()
          : undefined),
      artist:
        similarTrack.artist?.name ||
        similarTrack.artist?.title ||
        similarTrack.artist ||
        "Unknown Artist",
      album: similarTrack.album?.title || similarTrack.album || "Unknown Album",
    };
    console.log("Attempting to add track to playlist:", trackToAdd);
    onAddTrackToPlaylist(trackToAdd);
  };

  const artistName = artist?.name || artist?.title || "Unknown Artist";

  const albumCoverUrl =
    album?.coverImages?.length > 0
      ? album.coverImages[1]?.url || album.coverImages[0]?.url
      : null;

  return (
    <div key={index} className={`rounded-x1 overflow-hidden`}>
      {/* Main track item (li is clickable to toggle panel) */}
      <li
        onClick={handleItemClick} // <-- Handles toggling the panel
        className="bg-white/5 border border-secondary/50 rounded-xl p-4 flex items-center gap-4 shadow-sm cursor-pointer transition-colors duration-200 hover:bg-white/10"
        key={spotifyId || mbid || index} // Key should ideally be on the list item
      >
        {/* ... Album Cover JSX ... */}
        <div className="w-18 h-18 bg-gray-300/10 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
          {albumCoverUrl ? (
            <img
              src={albumCoverUrl}
              alt={album?.title || "Album Cover"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-400/30 flex items-center justify-center">
              <span className="text-gray-700 text-xs text-center">
                No Cover
              </span>
            </div>
          )}
        </div>

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

        {/* Spinner or dropdown arrow on the right */}
        <div className="flex-shrink-0 ml-auto flex items-center">
          {isLoadingSimilar ? (
            <Spinner size="w-5 h-5" color="currentColor" />
          ) : (
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${
                isOpen ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          )}
        </div>
      </li>

      {/* Expandable Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[2000px] opacity-100 pt-4" : "max-h-0 opacity-0" // <-- Increased max-height
        }`}
      >
        <div className="bg-white/5 border border-white/10 rounded-b-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* ... Similar track limit select ... */}
          <label
            htmlFor={`similar-limit-${index}`}
            className="text-sm font-medium text-gray-300 flex-shrink-0"
          >
            Similar track limit:
          </label>
          <select
            id={`similar-limit-${index}`}
            value={similarTracksLimit}
            onChange={handleLimitChange}
            className="bg-primary border border-primary/20 rounded-lg px-3 py-1 text-white text-sm backdrop-blur-md shadow-sm transition-colors duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoadingSimilar}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>

          {/* Button to generate similar tracks */}
          <button
            onClick={handleGenerateSimilarClick} // <-- Calls the handler with stopPropagation
            disabled={isLoadingSimilar}
            className={`px-4 py-1 bg-accent hover:bg-accent-dark text-black rounded-full shadow-lg transition duration-300 text-sm flex items-center justify-center gap-2 ${
              isLoadingSimilar ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoadingSimilar && (
              <Spinner size="w-4 h-4" color="currentColor" />
            )}
            {isLoadingSimilar ? "Generating..." : "Generate Similar Tracks"}
          </button>
        </div>

        {/* Similar Tracks List / Error / No Results Message */}
        <div className="mt-4 space-y-2 px-4 pb-4">
          {similarTracksError && (
            <p className="text-center text-red-400 text-sm">
              {similarTracksError}
            </p>
          )}

          {!isLoadingSimilar &&
            !similarTracksError &&
            similarFetchAttempted && // Use the flag from parent state
            similarTracks &&
            similarTracks.length === 0 &&
            isOpen && (
              <p className="text-center text-gray-400 text-sm">
                No similar tracks found.
              </p>
            )}

          {/* Displays the list of similar tracks */}
          {!isLoadingSimilar &&
            !similarTracksError &&
            similarTracks &&
            similarTracks.length > 0 && (
              <div>
                <h4 className="text-md font-semibold mb-2 text-gray-300">
                  Similar Tracks:
                </h4>
                <ul className="space-y-2">
                  {similarTracks.map(
                    (similarTrack, similarIndex) =>
                      similarTrack &&
                      similarTrack.title && (
                        <li
                          key={
                            similarTrack.spotifyId ||
                            similarTrack.mbid ||
                            `${similarTrack.title}-${
                              similarTrack.artist?.name ||
                              similarTrack.artist?.title
                            }-${similarIndex}`
                          }
                          // Click on the list item adds to playlist
                          onClick={() => handleAddSimilarTrack(similarTrack)}
                          className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3 text-sm cursor-pointer hover:bg-white/10 transition-colors duration-200"
                        >
                          <div className="flex-shrink-0">
                            <FaPlus size={16} className="text-accent" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {similarTrack?.title || "Unknown Title"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {similarTrack?.artist?.name ||
                                similarTrack?.artist?.title ||
                                similarTrack?.artist ||
                                "Unknown Artist"}
                            </p>
                          </div>
                        </li>
                      )
                  )}
                </ul>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TrackItem;
