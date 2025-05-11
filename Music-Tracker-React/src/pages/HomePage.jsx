import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PlaylistBar from "../components/PlaylistBar";
import RecentListensControls from "../components/RecentListensControls";
import TrackItem from "../components/TrackItem";
import * as apiClient from "../services/apiClient";
import "./index.css";
function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // State for initial page load (auth and user info)
  const [userInfo, setUserInfo] = useState(null); // State for user info

  // Tracks state now includes per-track UI state
  const [tracks, setTracks] = useState([]);

  // State for the main recent listens section
  const [recentListensLimit, setRecentListensLimit] = useState(10);
  const [fetchingRecentListens, setFetchingRecentListens] = useState(false);

  // State for controlling sidebar collapse
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Playlist States
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [playlistName, setPlaylistName] = useState("New Playlist");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  // --- Handle Logout ---
  const handleLogout = async () => {
    try {
      await apiClient.logout();
      window.location.href = "/login"; // Redirect after successful logout
    } catch (err) {
      console.error("Error logging out:", err);
      alert("Logout failed."); // User feedback on error
    }
  };

  // --- Handle Authentication and Initial User Info Fetch ---
  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        const authStatus = await apiClient.getAuthStatus();
        console.log("Auth Status", authStatus);
        if (!authStatus || !authStatus.loggedIn) {
          navigate("/login");
          return;
        }

        const userData = await apiClient.getUserInfo();
        setUserInfo(userData);
        setLoading(false);

        // TO-DO
        // Optionally fetch recent listens immediately after successful auth+user fetch
        // handleFetchRecentListens();
        setFetchingRecentListens(false); // Ensure this is false if not auto-fetching
      } catch (err) {
        console.error("Auth check or user info fetch failed:", err);
        // If auth fails, redirect to login
        navigate("/login");
      }
    };

    checkAuthAndFetchUser();
  }, [navigate]);

  // --- Fetch Recent Listens (Manual Trigger) ---
  const handleFetchRecentListens = async () => {
    setFetchingRecentListens(true);
    setTracks([]); // Clear previous tracks while fetching new ones
    try {
      const data = await apiClient.getRecentListens(recentListensLimit);
      // console.log("Fetched recent listens data:", data);
      // Map fetched data to add initial UI state properties for each track
      const tracksWithUIState = data.map((track) => ({
        ...track, // Keep all original track data
        isOpen: false, // Initially closed
        isLoadingSimilar: false, // Not loading similar tracks initially
        similarTracks: [], // No similar tracks fetched initially
        similarTracksLimit: 10, // Default limit for similar tracks
        similarTracksError: null, // No error initially
      }));

      setTracks(tracksWithUIState);
    } catch (err) {
      console.error("Error fetching recent listens", err);
      alert("Failed to fetch recent listens.");
      setTracks([]); // Clear tracks or set to empty array on error
    } finally {
      setFetchingRecentListens(false);
    }
  };

  // --- Handle Track Tile Click (Toggle Options) ---
  // This function now lives in the parent (HomePage) to update the state array
  const handleTrackClick = (index) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      const wasOpen = newTracks[index].isOpen;

      // Toggle the 'isOpen' property for the track at the given index
      newTracks[index] = {
        ...newTracks[index],
        isOpen: !wasOpen,
        // Clear errors and loading state when closing the panel
        similarTracksError: wasOpen
          ? null
          : newTracks[index].similarTracksError,
        isLoadingSimilar: wasOpen ? false : newTracks[index].isLoadingSimilar,
      };
      return newTracks;
    });
  };

  // --- Handle Similar Tracks Limit Change ---
  // This function also lives in the parent to update the state array
  const handleSimilarLimitChange = (index, newLimit) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      // Update the 'similarTracksLimit' property for the track at the given index
      newTracks[index] = {
        ...newTracks[index],
        similarTracksLimit: newLimit,
      };
      return newTracks;
    });
  };

  // --- Handle Fetch Similar Tracks ---
  // This function lives in the parent to update the state array after fetching
  const handleFetchSimilarTracks = async (index, trackInfo) => {
    // 1. Set loading state for the specific track in the parent's tracks array
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      if (!newTracks[index]) return prevTracks; // Safety check
      newTracks[index] = {
        ...newTracks[index],
        isLoadingSimilar: true,
        similarTracks: [], // Clear previous results
        similarTracksError: null, // Clear previous errors
      };
      return newTracks;
    });

    const { artistName, trackName, mbid } = trackInfo;
    const limit = tracks[index]?.similarTracksLimit || 10; // Use current limit from state

    // Explanation: Check if we have enough information to fetch similar tracks
    // Your backend endpoint requires artist/track name OR mbid. Let's prefer artist/track.
    if ((!artistName || !trackName) && !mbid) {
      setTracks((prevTracks) => {
        const newTracks = [...prevTracks];
        if (!newTracks[index]) return prevTracks; // Safety check
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

    // 2. Perform the API call using the service
    try {
      const similarData = await apiClient.getSimilarTracks({
        artist: artistName,
        track: trackName,
        mbid: mbid,
        limit: limit,
      });

      // 3. Update the specific track's state with results
      setTracks((prevTracks) => {
        const newTracks = [...prevTracks];
        if (!newTracks[index]) return prevTracks; // Safety check
        newTracks[index] = {
          ...newTracks[index],
          similarTracks: similarData,
          similarTracksError:
            similarData.length === 0 ? "No similar tracks found." : null,
        };
        return newTracks;
      });
    } catch (err) {
      // 4. Update the specific track's state with error
      console.error(`Error fetching similar tracks for ${trackName}:`, err);
      setTracks((prevTracks) => {
        const newTracks = [...prevTracks];
        if (!newTracks[index]) return prevTracks; // Safety check
        newTracks[index] = {
          ...newTracks[index],
          similarTracksError: `Error: ${err.message}`,
          similarTracks: [], // Clear partial results
        };
        return newTracks;
      });
    } finally {
      // 5. Set loading state back to false for the specific track
      setTracks((prevTracks) => {
        const newTracks = [...prevTracks];
        if (!newTracks[index]) return prevTracks; // Safety check
        newTracks[index] = {
          ...newTracks[index],
          isLoadingSimilar: false,
        };
        return newTracks;
      });
    }
  };

  // Playlist Handlers
  const handleAddTrackToPlaylist = (track) => {
    if (!track || !track.spotifyId) {
      console.error("Cannot add track to playlist: Missing Spotify ID.");
      alert("Failed to add track: Missing Spotify ID.");
      return;
    }

    const isAlreadyPlaylist = playlistTracks.some(
      (item) => item.spotifyId === track.spotifyId
    );
    if (isAlreadyPlaylist) {
      console.warn("Track already in playlist:", track);
      return;
    }

    // Add the track to the playlist state
    setPlaylistTracks((prevTracks) => [
      ...prevTracks,
      {
        spotifyId: track.spotifyId,
        title: track.title,
        artist: track.artist?.name || track.artist?.title,
        album: track.album.title,
      },
    ]);

    console.log("Added track to playlist", track);
  };

  const handleRemoveTrackFromPlaylist = (trackId) => {
    setPlaylistTracks((prevTracks) =>
      prevTracks.filter((track) => track.spotifyId !== trackId)
    );
    console.log("Removed track from playlist with ID", trackId);
  };

  const handleCreatePlaylist = async () => {
    if (playlistTracks.length === 0) {
      alert("No track in playlist!");
      return;
    }

    const trackIds = playlistTracks
      .map((track) => track.spotifyId)
      .filter(Boolean); // Filter for no nulls

    if (trackIds === 0) {
      alert("No valid Spotify track IDs found!");
      return;
    }

    setCreatingPlaylist(true);
    try {
      const playlistData = {
        track_ids: trackIds,
        playlistName: playlistName,
        description: playlistDescription,
        is_public: true, // Add toggle for this later
      };

      const response = await apiClient.createPlaylist(playlistData);

      console.log("Playlist created successfully:", response);

      // Clear states
      setPlaylistTracks([]);
      setPlaylistName("New Playlist");
      setPlaylistDescription("");
    } catch (err) {
      console.error("Error creating playlist", err.message);
      alert(
        `Failed to create playlist: ${
          err.message || "An unknown error occurred"
        }`
      );
    } finally {
      setCreatingPlaylist(false);
    }
  };

  // Show a full-page loading indicator initially
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-black text-white font-inter selection:bg-accent selection:text-white flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-black text-white font-inter selection:bg-accent selection:text-white relative flex">
      {/* Noise Overlay */}
      <div className="bg-[url('../assets/broken-noise.png')] bg-repeat mix-blend-screen absolute inset-0 opacity-50 z-0" />

      {/* Sidebar Component */}
      <Sidebar
        userInfo={userInfo}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <main className="relative z-10 p-6 md:p-10 flex-1 min-w-0">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 drop-shadow-lg">
          Welcome
          {userInfo?.display_name
            ? `, ${userInfo.display_name.split(" ")[0]}!`
            : "!"}
        </h1>

        {/* Recent Listens Controls Component */}
        <RecentListensControls
          limit={recentListensLimit}
          onLimitChange={setRecentListensLimit} // Pass the state setter directly
          isLoading={fetchingRecentListens}
          onFetch={handleFetchRecentListens}
        />

        {/* List of Tracks */}
        {fetchingRecentListens ? (
          <p className="text-center text-white mt-10">
            Loading recent listens...
          </p>
        ) : (
          <ul className="space-y-4">
            {tracks.map((track, index) => (
              // TrackItem Component
              <TrackItem
                key={index} // Using index as key is ok here since list order doesn't change dynamically beyond the initial fetch
                track={track} // Pass the individual track object (which includes its UI state)
                index={index} // Pass index for callbacks to identify which track is acted upon
                onToggleOpen={handleTrackClick} // Pass handler down
                onSimilarLimitChange={handleSimilarLimitChange} // Pass handler down
                onFetchSimilar={handleFetchSimilarTracks} // Pass handler down
                onAddTrackToPlaylist={handleAddTrackToPlaylist}
              />
            ))}
          </ul>
        )}
      </main>
      <PlaylistBar
        playlistTracks={playlistTracks}
        playlistName={playlistName}
        playlistDescription={playlistDescription}
        onNameChange={setPlaylistName} // Pass state setter
        onDescriptionChange={setPlaylistDescription} // Pass state setter
        onRemoveTrack={handleRemoveTrackFromPlaylist} // Pass remove handler
        onCreatePlaylist={handleCreatePlaylist} // Pass create handler
        creatingPlaylist={creatingPlaylist} // Pass loading state
      />
    </div>
  );
}

export default HomePage;
