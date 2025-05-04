import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Import any necessary CSS file if you put the animation there
// import './HomePage.css'; // If you keep the CSS animation, keep this.
// If you switch to the inline spinner, you might still need CSS for the spinner animation

const Spinner = ({ size = "w-5 h-5", color = "currentColor" }) => (
  <svg
    className={`animate-spin ${size} text-${color}`} // Tailwind classes for size and color, animate-spin for rotation
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // State for initial page load (auth and user info)
  const [userInfo, setUserInfo] = useState(null); // State for user info
  // Modify tracks state to hold per-track UI state
  const [tracks, setTracks] = useState([]);
  const [recentListensLimit, setRecentListensLimit] = useState(10); // Limit for fetching recent listens initially
  const [fetchingRecentListens, setFetchingRecentListens] = useState(false); // State for loading recent listens

  // Explanation: New state structure for each track
  // Each object in the 'tracks' array will now look like this:
  // {
  //   ...originalTrackData, // All properties from your backend LastfmTrack model
  //   isOpen: boolean,          // Is the options/similar tracks section open?
  //   isLoadingSimilar: boolean,// Is fetching similar tracks in progress for this track?
  //   similarTracks: array,     // The list of similar tracks fetched for this track
  //   similarTracksLimit: number, // The selected limit for similar tracks for this track
  //   similarTracksError: string | null // Any error message for similar tracks fetch for this track
  // }

  // --- Fetch Recent Listens ---
  // Explanation: Updated function to initialize per-track state
  const handleFetchRecentListens = async () => {
    setFetchingRecentListens(true); // start loading recent listens
    try {
      // Use the recentListensLimit state for this fetch
      const response = await fetch(
        `/api/spotify/recent?limit=${recentListensLimit}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch recent listens");

      const data = await response.json();

      // Explanation: Map over the fetched data to add initial state properties for each track
      const tracksWithUIState = data.map((track) => ({
        ...track, // Keep all original track data
        isOpen: false, // Initially closed
        isLoadingSimilar: false, // Not loading similar tracks initially
        similarTracks: [], // No similar tracks fetched initially
        similarTracksLimit: 10, // Default limit for similar tracks (can be changed per track)
        similarTracksError: null, // No error initially
      }));

      setTracks(tracksWithUIState); // Update the tracks state with the new structure
    } catch (err) {
      console.error("Error fetching recent listens", err);
      alert("Failed to fetch recent listens.");
      setTracks([]); // Clear tracks or set to empty array on error
    } finally {
      setFetchingRecentListens(false); // stop loading recent listens no matter what
    }
  };

  // --- Handle Logout ---
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/spotify/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Logout failed");

      window.location.href = "/login";
    } catch (err) {
      console.error("Error logging out:", err);
      alert("Logout failed.");
    }
  };

  // --- Handle Authentication and Initial User Info Fetch ---
  useEffect(() => {
    fetch("/api/spotify/auth-status", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then(async (data) => {
        if (!data.loggedIn) {
          navigate("/login");
          return;
        }

        const userInfoResponse = await fetch("/api/spotify/user-info", {
          credentials: "include",
        });
        if (!userInfoResponse.ok) throw new Error("Failed to fetch user info");

        const userData = await userInfoResponse.json();
        setUserInfo(userData);

        setLoading(false);
      })
      .catch((err) => {
        console.error("Auth check or user info fetch failed:", err);
        // If auth fails, redirect to login
        navigate("/login");
      });
  }, [navigate]); // navigate is a dependency

  // --- Handle Track Tile Click (Toggle Options) ---
  // Explanation: Function to toggle the 'isOpen' state for a specific track by its index
  const handleTrackClick = (index) => {
    setTracks((prevTracks) => {
      // Create a shallow copy of the tracks array to maintain immutability
      const newTracks = [...prevTracks];
      // Toggle the 'isOpen' property for the track at the given index
      const wasOpen = newTracks[index].isOpen; // Capture current state
      newTracks[index] = {
        ...newTracks[index], // Copy all existing properties of the track
        isOpen: !wasOpen, // Toggle the isOpen state
        // Clear errors when closing.
        // This prevents stale data from showing if you re-open later
        similarTracksError: wasOpen
          ? null
          : newTracks[index].similarTracksError,
        // Also stop loading if it was somehow still loading when closing
        isLoadingSimilar: wasOpen ? false : newTracks[index].isLoadingSimilar,
      };
      // Return the new array to update state
      return newTracks;
    });
  };

  // --- Handle Similar Tracks Limit Change ---
  // Explanation: Function to update the 'similarTracksLimit' for a specific track by its index
  const handleSimilarLimitChange = (index, newLimit) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      newTracks[index] = {
        ...newTracks[index],
        similarTracksLimit: newLimit, // Update the limit for this track
      };
      return newTracks;
    });
  };

  // --- New: Handle Fetch Similar Tracks ---
  // Explanation: Async function to fetch similar tracks for a specific track by its index
  const handleFetchSimilarTracks = async (index) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      // Set loading state to true and clear previous results/errors for this track
      newTracks[index] = {
        ...newTracks[index],
        isLoadingSimilar: true, // Start loading animation
        similarTracks: [], // Clear previous results
        similarTracksError: null, // Clear previous errors
      };
      return newTracks;
    });

    // We need the latest track data from the updated state, not the potentially stale one
    // from before the setTracks call. Let's get it inside the async function flow.
    // Find the track from the current state array
    const trackToFetch = tracks.find((_, i) => i === index);

    if (!trackToFetch) {
      console.error("Could not find track data for index", index);
      setTracks((prevTracks) => {
        const newTracks = [...prevTracks];
        newTracks[index] = {
          ...newTracks[index],
          isLoadingSimilar: false,
          similarTracksError: "Internal error: Track data not found.",
        };
        return newTracks;
      });
      return;
    }

    const artistName = trackToFetch.artist?.name || trackToFetch.artist?.title; // Get artist name
    const trackName = trackToFetch.title; // Get track title
    const mbid = trackToFetch.mbid; // Get mbid if available

    // Explanation: Check if we have enough information to fetch similar tracks
    // Your backend endpoint requires artist/track name OR mbid. Let's prefer artist/track.

    // Check both artist and track name OR mbid exist
    if ((!artistName || !trackName) && !mbid) {
      setTracks((prevTracks) => {
        const newTracks = [...prevTracks];
        newTracks[index] = {
          ...newTracks[index],
          isLoadingSimilar: false, // Stop loading
          similarTracksError:
            "Missing artist/track name or MBID to fetch similar tracks.", // Set error
        };
        return newTracks;
      });
      return; // Stop execution
    }

    // Explanation: Construct the query parameters for the backend endpoint
    const queryParams = new URLSearchParams();
    // Add artist and track name if available (backend should handle preference for MBID if present)
    if (artistName) queryParams.append("artist", artistName);
    if (trackName) queryParams.append("track", trackName);
    // Add MBID if available
    if (mbid) queryParams.append("mbid", mbid);

    queryParams.append("limit", trackToFetch.similarTracksLimit || 10); // Use the track's specific limit, default to 10

    // --- CORRECTION: Verify the API endpoint path ---
    // Your backend code shows [HttpGet("last-fm-get-similar")]
    // Your previous frontend code used "/api/spotify/last-fm-get-similar"
    // Assuming "/api/spotify" is a prefix for ALL your backend Spotify/Last.fm endpoints
    const url = `/api/spotify/last-fm-get-similar?${queryParams.toString()}`; // Use the correct endpoint path

    try {
      const response = await fetch(url, {
        credentials: "include", // Include cookies if needed for auth (depends on your backend setup)
      });

      if (!response.ok) {
        // Attempt to read error body if available, otherwise use status text
        let errorMsg = `Failed to fetch similar tracks: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody.message)
            errorMsg = `Failed to fetch similar tracks: ${errorBody.message}`;
          else if (errorBody.error)
            errorMsg = `Failed to fetch similar tracks: ${errorBody.error}`;
          else if (typeof errorBody === "string")
            // Sometimes error responses are plain text
            errorMsg = `Failed to fetch similar tracks: ${errorBody}`;
        } catch (jsonErr) {
          // Ignore if body is not JSON
        }
        throw new Error(errorMsg);
      }

      const similarData = await response.json();

      setTracks((prevTracks) => {
        const newTracks = [...prevTracks];
        // Check if the track at this index still exists (e.g., list hasn't been re-fetched/changed)
        if (!newTracks[index]) return prevTracks; // Prevent errors if list changed
        // Update the specific track with the fetched similar tracks
        newTracks[index] = {
          ...newTracks[index],
          similarTracks: similarData, // Store the fetched similar tracks
          // Set specific message if none found, otherwise clear previous error
          similarTracksError:
            similarData.length === 0 ? "No similar tracks found." : null,
        };
        return newTracks;
      });
    } catch (err) {
      console.error(`Error fetching similar tracks for ${trackName}:`, err);
      setTracks((prevTracks) => {
        const newTracks = [...prevTracks];
        if (!newTracks[index]) return prevTracks; // Prevent errors if list changed
        // Update the specific track with the error message
        newTracks[index] = {
          ...newTracks[index],
          similarTracksError: `Error fetching similar tracks: ${err.message}`, // Store the error message
          similarTracks: [], // Clear any partial results on error
        };
        return newTracks;
      });
    } finally {
      setTracks((prevTracks) => {
        const newTracks = [...prevTracks];
        if (!newTracks[index]) return prevTracks; // Prevent errors if list changed
        // Set loading state back to false for this track
        newTracks[index] = {
          ...newTracks[index],
          isLoadingSimilar: false, // Stop loading animation
        };
        return newTracks;
      });
    }
  };

  if (loading)
    return <p className="text-white text-center mt-10">Loading...</p>;

  return (
    // Explanation: Main container removed 'flex'.
    // Height is still min-h-screen, allowing content to push it if needed.
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-black text-white font-inter selection:bg-accent selection:text-white relative">
      {/* Noise Overlay */}
      <div className="bg-[url('../assets/broken-noise.png')] bg-repeat mix-blend-screen absolute inset-0 opacity-100 z-0" />

      {/* Sidebar */}
      {/* Explanation: Position is still fixed. z-index and width unchanged */}
      {/* Tailwind w-64 is equivalent to 16rem or 256px */}
      <aside className="fixed top-0 left-0 h-full z-20 w-64 p-6 border-r border-white/10 bg-black/30 backdrop-blur-md hidden md:block shadow-xl shadow-primary/40 rounded-lg">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white">Your Profile</h2>
          <p className="text-sm text-gray-300">
            {userInfo?.display_name || "Your Profile"}
          </p>
        </div>
        <nav className="space-y-4">
          <button className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/25 rounded-lg transition">
            Dashboard
          </button>
          <button className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/25 rounded-lg transition">
            Listen History
          </button>
          <button className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/25 rounded-lg transition">
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 bg-white/10 hover:bg-white/25 rounded-lg transition"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      {/* Explanation: Removed flex-1 and min-w-0 */}
      {/* Added conditional margin-left (md:ml-64) to push content right by sidebar width */}
      {/* Adjusted padding to md:p-10 (was md:p-10 md:pl-[270px]), now uniform padding */}
      <main className="relative z-10 p-6 md:p-10 md:ml-64 min-w-0">
        {" "}
        {/* min-w-0 might still be useful in case content inside overflows */}
        <h1 className="text-3xl md:text-4xl font-bold mb-8 drop-shadow-lg">
          Welcome
          {userInfo?.display_name
            ? `, ${userInfo.display_name.split(" ")[0]}!`
            : "!"}
        </h1>
        {/* Retrieve Recent Listens Options */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label htmlFor="recent-limit" className="text-lg font-medium">
            How many recent listens?
          </label>
          <select
            id="recent-limit" // Added id for accessibility
            value={recentListensLimit} // Use recentListensLimit state
            onChange={(e) => setRecentListensLimit(Number(e.target.value))} // Update recentListensLimit state
            // Adjusted padding/colors to use theme colors with a darker primary background
            className="bg-primary border border-primary/20 rounded-lg px-3 py-1 text-white text-sm backdrop-blur-md shadow-smtransition-colors duration-300"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>

          <button
            onClick={handleFetchRecentListens} // Call the updated fetch function
            disabled={fetchingRecentListens} // Disable button while fetching recent listens
            className={`px-6 py-2 bg-primary text-white rounded-full shadow-lg transition duration-300 ${
              fetchingRecentListens
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-secondary"
            }`}
          >
            {fetchingRecentListens ? "Loading..." : "Get Recent Listens"}{" "}
            {/* Button text reflects loading state */}
          </button>
        </div>
        {/* List of Tracks */}
        {fetchingRecentListens ? (
          <p className="text-center text-white mt-10">
            Loading recent listens...
          </p>
        ) : (
          <ul className="space-y-4">
            {tracks.map((track, index) => (
              // Explanation: Wrapper div no longer needs the loading-animation class
              <div key={index} className={`rounded-xl overflow-hidden`}>
                <li
                  onClick={() => handleTrackClick(index)} // Call the handler to toggle open state
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 shadow-sm cursor-pointer transition-colors duration-200 hover:bg-white/10"
                >
                  <div className="w-16 h-16 bg-gray-300/10 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                    {track.album?.coverImages?.length > 0 &&
                    (track.album.coverImages[1]?.url ||
                      track.album.coverImages[0]?.url) ? (
                      <img
                        src={
                          track.album.coverImages[1]?.url ||
                          track.album.coverImages[0]?.url
                        }
                        alt={track.album.title || "Album Cover"}
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
                    <p className="font-semibold text-lg">{track.title}</p>
                    <p className="text-sm text-gray-300">
                      {track.artist?.name || track.artist?.title}
                    </p>
                    {track.album?.title && (
                      <p className="text-xs text-gray-400 mt-1">
                        on {track.album.title}
                      </p>
                    )}
                  </div>

                  {/* Explanation: Conditionally render spinner or arrow */}
                  <div className="flex-shrink-0 ml-auto flex items-center">
                    {" "}
                    {/* ml-auto pushes it to the right */}
                    {track.isLoadingSimilar ? (
                      // Render the spinner when loading similar tracks
                      <Spinner size="w-5 h-5" color="primary" /> // Adjust size/color as needed
                    ) : (
                      // Render the arrow icon when not loading
                      <svg
                        className={`w-5 h-5 transition-transform duration-300 ${
                          track.isOpen ? "rotate-180" : "rotate-0"
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
                    track.isOpen
                      ? "max-h-screen opacity-100 pt-4"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  {/* Options Bar */}
                  <div className="bg-white/5 border border-white/10 rounded-b-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <label
                      htmlFor={`similar-limit-${index}`}
                      className="text-sm font-medium text-gray-300"
                    >
                      Similar track limit:
                    </label>
                    <select
                      id={`similar-limit-${index}`} // Unique ID for accessibility
                      value={track.similarTracksLimit} // Use the track's specific limit state
                      onChange={(e) =>
                        handleSimilarLimitChange(index, Number(e.target.value))
                      } // Update the track's specific limit state
                      // Adjusted padding/colors for slightly better appearance
                      className="bg-primary border border-primary/20 rounded-lg px-3 py-1 text-white text-sm backdrop-blur-md shadow-smtransition-colors duration-300"
                      disabled={track.isLoadingSimilar} // Disable selector while loading
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(
                        (num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        )
                      )}
                    </select>

                    <button
                      onClick={() => handleFetchSimilarTracks(index)} // Call the fetch similar tracks handler for this track
                      disabled={track.isLoadingSimilar || fetchingRecentListens} // Disable if this track is loading OR if main recent listens is loading
                      className={`px-4 py-1 bg-accent hover:bg-accent-dark text-black rounded-full shadow-lg transition duration-300 text-sm ${
                        track.isLoadingSimilar
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {track.isLoadingSimilar
                        ? "Generating..."
                        : "Generate Similar Tracks"}
                    </button>
                  </div>

                  {/* Similar Tracks List / Loading / Error */}
                  <div className="mt-4 space-y-2 px-4 pb-4">
                    {/* Explanation: Loading indicator is now the inline spinner */}
                    {/* Display error message specific to this track */}
                    {track.similarTracksError && (
                      <p className="text-center text-red-400 text-sm">
                        {track.similarTracksError}
                      </p>
                    )}

                    {/* Explanation: Display similar tracks if fetched and no error */}
                    {track.similarTracks.length > 0 &&
                      !track.isLoadingSimilar &&
                      !track.similarTracksError && (
                        <div>
                          <h4 className="text-md font-semibold mb-2 text-gray-300">
                            Similar Tracks:
                          </h4>
                          <ul className="space-y-2">
                            {track.similarTracks.map(
                              (similarTrack, similarIndex) => (
                                <li
                                  key={similarIndex}
                                  className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3 text-sm"
                                >
                                  {/* <div className="w-12 h-12 bg-gray-300/10 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                                    {similarTrack.album?.coverImages?.length >
                                      0 &&
                                    (similarTrack.album.coverImages[1]?.url ||
                                      similarTrack.album.coverImages[0]
                                        ?.url) ? (
                                      <img
                                        src={
                                          similarTrack.album.coverImages[1]
                                            ?.url ||
                                          similarTrack.album.coverImages[0]?.url
                                        }
                                        alt={
                                          similarTrack.album?.title ||
                                          "Album Cover"
                                        }
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
                                  </div> */}
                                  <div>
                                    <p className="font-medium">
                                      {similarTrack.title}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {similarTrack.artist?.name ||
                                        similarTrack.artist?.title}
                                    </p>
                                  </div>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>{" "}
                {/* End of expandable content div */}
              </div> // End of track wrapper div
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default HomePage;
