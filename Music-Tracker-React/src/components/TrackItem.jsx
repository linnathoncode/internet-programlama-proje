import React from "react";
import Spinner from "./Spinner"; // Assuming Spinner is in the same components directory

const TrackItem = ({
  track, // The track object including UI state (isOpen, isLoadingSimilar, etc.)
  index, // The index is needed for the parent's update functions
  onToggleOpen, // Callback from parent to toggle open state for this track
  onSimilarLimitChange, // Callback from parent to change similar limit for this track
  onFetchSimilar, // Callback from parent to fetch similar tracks for this track
}) => {
  // Destructure UI state from the track object
  const {
    title,
    artist,
    album,
    isOpen,
    isLoadingSimilar,
    similarTracks,
    similarTracksLimit,
    similarTracksError,
    mbid, // Pass mbid for similar tracks fetch
  } = track;

  // Handle click on the main track item
  const handleItemClick = () => {
    onToggleOpen(index); // Notify parent to toggle state
  };

  // Handle similar limit change
  const handleLimitChange = (e) => {
    onSimilarLimitChange(index, Number(e.target.value)); // Notify parent
  };

  // Handle fetching similar tracks
  const handleGenerateSimilarClick = () => {
    // Pass necessary track info and the index back to the parent handler
    onFetchSimilar(index, {
      artistName: artist?.name || artist?.title,
      trackName: title,
      mbid: mbid,
    });
  };

  const artistName = artist?.name || artist?.title; // Get artist name consistently

  return (
    <div key={index} className={`rounded-xl overflow-hidden`}>
      <li
        onClick={handleItemClick}
        className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 shadow-sm cursor-pointer transition-colors duration-200 hover:bg-white/10"
      >
        <div className="w-16 h-16 bg-gray-300/10 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
          {album?.coverImages?.length > 0 &&
          (album.coverImages[1]?.url || album.coverImages[0]?.url) ? (
            <img
              src={album.coverImages[1]?.url || album.coverImages[0]?.url}
              alt={album.title || "Album Cover"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/64x64.png?text=No+Cover";
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-400/30 flex items-center justify-center">
              <span className="text-gray-700 text-sm">No Cover</span>
            </div>
          )}
        </div>

        <div className="flex-grow">
          <p className="font-semibold text-lg">{title}</p>
          <p className="text-sm text-gray-300">{artistName}</p>
          {album?.title && (
            <p className="text-xs text-gray-400 mt-1">on {album.title}</p>
          )}
        </div>

        <div className="flex-shrink-0 ml-auto flex items-center">
          {isLoadingSimilar ? (
            <Spinner size="w-5 h-5" color="currentColor" /> // Use default color or primary
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
          isOpen ? "max-h-screen opacity-100 pt-4" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white/5 border border-white/10 rounded-b-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label
            htmlFor={`similar-limit-${index}`}
            className="text-sm font-medium text-gray-300"
          >
            Similar track limit:
          </label>
          <select
            id={`similar-limit-${index}`}
            value={similarTracksLimit}
            onChange={handleLimitChange}
            className="bg-primary border border-primary/20 rounded-lg px-3 py-1 text-white text-sm backdrop-blur-md shadow-smtransition-colors duration-300"
            disabled={isLoadingSimilar}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateSimilarClick}
            disabled={isLoadingSimilar}
            className={`px-4 py-1 bg-accent hover:bg-accent-dark text-black rounded-full shadow-lg transition duration-300 text-sm ${
              isLoadingSimilar ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoadingSimilar ? "Generating..." : "Generate Similar Tracks"}
          </button>
        </div>

        {/* Similar Tracks List / Loading / Error */}
        <div className="mt-4 space-y-2 px-4 pb-4">
          {similarTracksError && (
            <p className="text-center text-red-400 text-sm">
              {similarTracksError}
            </p>
          )}

          {similarTracks.length > 0 &&
            !isLoadingSimilar &&
            !similarTracksError && (
              <div>
                <h4 className="text-md font-semibold mb-2 text-gray-300">
                  Similar Tracks:
                </h4>
                <ul className="space-y-2">
                  {similarTracks.map((similarTrack, similarIndex) => (
                    <li
                      key={similarIndex}
                      className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3 text-sm"
                    >
                      {/* You can uncomment and adapt album art here if needed */}
                      {/* <div className="w-12 h-12 bg-gray-300/10 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                      {similarTrack.album?.coverImages?.length > 0 &&
                      (similarTrack.album.coverImages[1]?.url ||
                        similarTrack.album.coverImages[0]?.url) ? (
                        <img
                          src={
                            similarTrack.album.coverImages[1]?.url ||
                            similarTrack.album.coverImages[0]?.url
                          }
                          alt={similarTrack.album?.title || "Album Cover"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/48x48.png?text=No+Cover";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-400/30 flex items-center justify-center">
                          <span className="text-gray-700 text-xs text-center px-1">
                            No Cover
                          </span>
                        </div>
                      )}
                    </div>
                    */}
                      <div>
                        <p className="font-medium">{similarTrack.title}</p>
                        <p className="text-xs text-gray-400">
                          {similarTrack.artist?.name ||
                            similarTrack.artist?.title}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TrackItem;
