// src/components/TrackItem.jsx
import React from "react";
import Spinner from "./Spinner"; // Assuming Spinner is in the same components directory

// Import Add icon
import { FaPlus } from "react-icons/fa"; // Example plus icon

const TrackItem = ({
  track, // The track object including UI state (isOpen, isLoadingSimilar, etc.) - now flattened
  index, // The index is needed for the parent's update functions
  onToggleOpen, // Callback from parent to toggle open state for this track
  onSimilarLimitChange, // Callback from parent to change similar limit for this track
  onFetchSimilar, // Callback from parent to fetch similar tracks for this track
  onAddTrackToPlaylist, // NEW: Callback from parent to add a track to the playlist
}) => {
  // Destructure UI state and track properties directly from the track prop
  // as the parent component is flattening the data structure.
  const {
    title, // Now directly on the 'track' prop
    artist, // Now directly on the 'track' prop
    album, // Now directly on the 'track' prop
    spotifyId, // Now directly on the 'track' prop
    mbid, // Now directly on the 'track' prop
    timestamp, // Also directly on the 'track' prop
    isOpen,
    isLoadingSimilar,
    similarTracks,
    similarTracksLimit,
    similarTracksError,
  } = track; // 'track' is the prop object

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
    // Uses title, artist name (with fallback), and mbid from the destructured track
    onFetchSimilar(index, {
      artistName: artist?.name || artist?.title,
      trackName: title,
      mbid: mbid,
    });
  };

  // NEW: Handle adding a similar track to the playlist
  const handleAddSimilarTrack = (similarTrack) => {
    // Call the parent handler, passing the similar track data
    // Ensure similarTrack object has necessary info (at least spotifyId/Uri)
    if (!similarTrack?.spotifyId && !similarTrack?.spotifyUri) {
      // Added optional chaining here too for safety
      console.warn(
        "Cannot add similar track: Missing Spotify ID or URI",
        similarTrack
      );
      alert("Cannot add track: Missing Spotify info.");
      return;
    }
    // Prefer spotifyId if available, otherwise use spotifyUri if that's how your backend works
    const trackToAdd = {
      ...similarTrack, // Pass all info initially
      spotifyId:
        similarTrack.spotifyId ||
        (similarTrack.spotifyUri
          ? similarTrack.spotifyUri.split(":").pop()
          : undefined), // Extract ID if only URI is available
    };
    onAddTrackToPlaylist(trackToAdd);
  };

  // Get artist name consistently, handles both 'name' and 'title'
  // This logic remains correct as 'artist' is now directly available
  const artistName = artist?.name || artist?.title;

  return (
    <div key={index} className={`rounded-xl overflow-hidden`}>
      {/* Main track item */}
      <li
        onClick={handleItemClick}
        className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 shadow-sm cursor-pointer transition-colors duration-200 hover:bg-white/10"
      >
        {/* Album Cover */}
        <div className="w-16 h-16 bg-gray-300/10 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
          {/* Accesses album cover images using optional chaining and fallback */}
          {/* Optional chaining album?.title remains correct and necessary */}
          {album?.coverImages?.length > 0 &&
          (album.coverImages[1]?.url || album.coverImages[0]?.url) ? (
            <img
              src={album.coverImages[1]?.url || album.coverImages[0]?.url}
              alt={album?.title || "Album Cover"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-400/30 flex items-center justify-center">
              <span className="text-gray-700 text-sm">No Cover</span>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-grow">
          {/* Displays track title - now directly available */}
          <p className="font-semibold text-lg">{title}</p>
          {/* Displays artist name - now directly available */}
          <p className="text-sm text-gray-300">{artistName}</p>
          {/* Displays album title if available - optional chaining album?.title remains correct */}
          {album?.title && (
            <p className="text-xs text-gray-400 mt-1">on {album?.title}</p>
          )}
        </div>

        {/* Spinner or dropdown arrow */}
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
        {/* Controls for similar tracks */}
        <div className="bg-white/5 border border-white/10 rounded-b-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label
            htmlFor={`similar-limit-${index}`}
            className="text-sm font-medium text-gray-300"
          >
            Similar track limit:
          </label>
          {/* Selects the limit for similar tracks */}
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

          {/* Button to generate similar tracks */}
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
          {/* Displays error message if fetching similar tracks failed */}
          {similarTracksError && (
            <p className="text-center text-red-400 text-sm">
              {similarTracksError}
            </p>
          )}

          {/* Displays the list of similar tracks */}
          {similarTracks.length > 0 &&
            !isLoadingSimilar &&
            !similarTracksError && (
              <div>
                <h4 className="text-md font-semibold mb-2 text-gray-300">
                  Similar Tracks:
                </h4>
                <ul className="space-y-2">
                  {/* Maps through similar tracks and displays them */}
                  {similarTracks.map(
                    (similarTrack, similarIndex) =>
                      // Added check if similarTrack is valid before rendering
                      similarTrack && (
                        // Make similar track items clickable to add to playlist
                        <li
                          key={similarIndex} // Use index as key for this list
                          onClick={() => handleAddSimilarTrack(similarTrack)} // Add click handler
                          className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3 text-sm cursor-pointer hover:bg-white/10 transition-colors duration-200" // Add cursor and hover effect
                        >
                          {/* Icon or placeholder could go here */}
                          {/* <div className="w-6 h-6 bg-gray-300/10 rounded-sm flex items-center justify-center text-gray-400"><FaPlus size={12} /></div> */}
                          <div>
                            {/* Displays similar track title - optional chaining added previously handles this */}
                            <p className="font-medium">{similarTrack?.title}</p>
                            {/* Displays similar track artist name - optional chaining added previously handles this */}
                            <p className="text-xs text-gray-400">
                              {similarTrack?.artist?.name ||
                                similarTrack?.artist?.title}
                            </p>
                          </div>
                          {/* Optional: Add explicit + button */}
                          <div className="ml-auto flex-shrink-0">
                            <button
                              className="p-1 rounded-full text-accent hover:text-accent-dark"
                              title="Add to playlist"
                            >
                              <FaPlus size={16} />
                            </button>
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
