import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import * as apiClient from "../services/apiClient";

const AppContext = createContext(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  // Shared states
  const [userInfo, setUserInfo] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [playlistName, setPlaylistName] = useState("New Playlist");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  // Authentication Check and User Info Fetch
  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        const authStatus = await apiClient.getAuthStatus();
        console.log("Auth Status", authStatus);
        if (!authStatus || !authStatus.loggedIn) {
          navigate("/login");
          setLoadingAuth(false);
          return;
        }

        // If logged in, fetch user info
        const userData = await apiClient.getUserInfo();
        setUserInfo(userData);
        setLoadingAuth(false);
      } catch (err) {
        console.error("Auth check or user info fetch failed:", err);
        navigate("/login");
        setLoadingAuth(false);
      }
    };

    checkAuthAndFetchUser();
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
      setUserInfo(null);
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
      alert("Logout failed.");
    }
  }, [navigate]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const addTrackToPlaylist = useCallback(
    (track) => {
      if (!track || !track.spotifyId) {
        console.error("Cannot add track to playlist: Missing Spotify ID.");
        alert("Failed to add track: Missing Spotify ID.");
        return;
      }

      const isAlreadyInPlaylist = playlistTracks.some(
        (item) => item.spotifyId === track.spotifyId
      );
      if (isAlreadyInPlaylist) {
        console.warn("Track already in playlist:", track.title);
        return;
      }

      const trackToAdd = {
        spotifyId: track.spotifyId,
        title: track.title,
        artist: track.artist?.name || track.artist?.title || "Unknown Artist",
        album: track.album?.title || "Unknown Album",
      };

      setPlaylistTracks((prevTracks) => [...prevTracks, trackToAdd]);

      console.log("Added track to playlist", trackToAdd);
    },
    [playlistTracks]
  );

  const removeTrackFromPlaylist = useCallback((trackIdToRemove) => {
    setPlaylistTracks((prevTracks) =>
      prevTracks.filter((track) => track.spotifyId !== trackIdToRemove)
    );
    console.log("Removed track from playlist with ID", trackIdToRemove);
  }, []);

  const createPlaylist = useCallback(async () => {
    if (playlistTracks.length === 0) {
      alert("Add some tracks to the playlist first!");
      return;
    }

    const trackIds = playlistTracks
      .map((track) => track.spotifyId)
      .filter(Boolean);

    if (trackIds.length === 0) {
      alert("No valid Spotify track IDs found in the playlist!");
      return;
    }

    if (!playlistName.trim()) {
      alert("Please enter a playlist name.");
      return;
    }

    setCreatingPlaylist(true);
    try {
      const playlistData = {
        track_ids: trackIds,
        playlistName: playlistName.trim() || "New Playlist",
        description: playlistDescription.trim() || "",
        is_public: true,
      };

      const response = await apiClient.createPlaylist(playlistData);

      console.log("Playlist created successfully:", response);
      alert(`Playlist "${response.playlistUrl}" created successfully!`);

      setPlaylistTracks([]);
      setPlaylistName("New Playlist");
      setPlaylistDescription("");
    } catch (err) {
      console.error("Error creating playlist", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unknown error occurred";
      alert(`Failed to create playlist: ${errorMessage}`);
    } finally {
      setCreatingPlaylist(false);
    }
  }, [playlistTracks, playlistName, playlistDescription]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      userInfo,
      loadingAuth, // Expose loading state
      isSidebarCollapsed,
      toggleSidebar,
      logout,

      // Playlist State and Handlers
      playlistTracks,
      playlistName,
      playlistDescription,
      creatingPlaylist,
      setPlaylistName,
      setPlaylistDescription,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      createPlaylist,
    }),
    [
      userInfo,
      loadingAuth,
      isSidebarCollapsed,
      toggleSidebar,
      logout,
      playlistTracks,
      playlistName,
      playlistDescription,
      creatingPlaylist,
      setPlaylistName,
      setPlaylistDescription,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      createPlaylist,
    ]
  );

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-black text-white font-inter selection:bg-accent selection:text-white flex items-center justify-center">
        {/* Noise Overlay - Keep here as it covers the whole initial load screen too */}
        {/* Assuming noise overlay is in index.css or App.js top level */}
        {/* <div className="bg-[url('../assets/broken-noise.png')] bg-repeat mix-blend-screen absolute inset-0 opacity-50 z-0" /> */}
        <p className="relative z-10 text-white text-xl">Loading...</p>{" "}
        {/* Ensure text is above noise */}
      </div>
    );
  }

  // Render the children (the rest of the app) wrapped in the provider
  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
