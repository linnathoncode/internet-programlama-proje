import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import RecentListensControls from "../components/RecentListensControls";
import TrackItem from "../components/TrackItem";
import * as apiClient from "../services/apiClient";
import { useAppContext } from "../context/AppContext";
import "./index.css";

function HomePage() {
  const { userInfo, addTrackToPlaylist } = useAppContext();

  const [tracks, setTracks] = useState([]);
  const [recentListensLimit, setRecentListensLimit] = useState(10);
  const [fetchingRecentListens, setFetchingRecentListens] = useState(false);

  const initializeTracksWithUIState = (data) => {
    return data.map((item) => ({
      ...item.track,
      timestamp: item.timestamp,
      isOpen: false,
      isLoadingSimilar: false,
      similarTracks: [],
      similarTracksLimit: 10,
      similarTracksError: null,
      similarFetchAttempted: false,
    }));
  };

  const handleFetchListeningHistory = useCallback(
    async (limit = 10, startAfter = null) => {
      setFetchingRecentListens(true);
      // When load more is added remove this
      // if startafter is null settracks([])
      setTracks([]);
      console.log("Fetching listening history...");
      try {
        const data = await apiClient.getListeningHistory(limit, startAfter);
        console.log("Listening history API returned:", data);
        // Initialize state including the new similarFetchAttempted flag
        setTracks(initializeTracksWithUIState(data));
      } catch (err) {
        console.error("Error fetching listening history", err);
        alert("Failed to fetch listening history.");
        setTracks([]);
      } finally {
        setFetchingRecentListens(false);
        console.log("Finished fetching listening history.");
      }
    },
    []
  );

  const handleFetchRecentListens = useCallback(async () => {
    setFetchingRecentListens(true);
    setTracks([]);
    console.log("Fetching recent listens...");
    try {
      const data = await apiClient.getRecentListens(recentListensLimit);
      console.log("Recent listens API returned:", data);
      setTracks(initializeTracksWithUIState(data));
    } catch (err) {
      console.error("Error fetching recent listens", err);
      alert("Failed to fetch recent listens.");
      setTracks([]);
    } finally {
      setFetchingRecentListens(false);
      console.log("Finished fetching recent listens.");
    }
  }, [recentListensLimit]);

  useEffect(() => {
    console.log("HomePage component mounted.");
    handleFetchListeningHistory();
    // Empty dependency array ensures this effect runs only once on mount
  }, []);

  const handleTrackClick = useCallback((index) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      if (!newTracks[index]) return prevTracks;

      const wasOpen = newTracks[index].isOpen;

      newTracks[index] = {
        ...newTracks[index],
        isOpen: !wasOpen,
        similarTracksError: wasOpen
          ? null
          : newTracks[index].similarTracksError,
        // Decide if you want to stop loading if user closes panel mid-fetch
        isLoadingSimilar: wasOpen ? false : newTracks[index].isLoadingSimilar,
      };
      return newTracks;
    });
  }, []);

  const handleSimilarLimitChange = useCallback((index, newLimit) => {
    setTracks((prevTracks) => {
      const newTracks = [...prevTracks];
      if (!newTracks[index]) return prevTracks;
      newTracks[index] = {
        ...newTracks[index],
        similarTracksLimit: newLimit,
      };
      return newTracks;
    });
  }, []);

  const handleFetchSimilarTracks = useCallback(
    async (index, trackInfo) => {
      // 1. Set loading state to true for the specific track
      setTracks((prevTracks) => {
        const newTracks = [...prevTracks];
        if (!newTracks[index]) return prevTracks; // Safety check
        newTracks[index] = {
          ...newTracks[index],
          isLoadingSimilar: true,
          similarTracks: [], // Clear previous results
          similarTracksError: null, // Clear previous errors
          similarFetchAttempted: false, // Reset attempt flag while fetching
        };
        return newTracks;
      });

      const { artistName, trackName, mbid } = trackInfo;
      // Use current limit from state. Access it from the state snapshot if possible,
      // or rely on the state update from handleSimilarLimitChange having finished.
      const currentTrackState = tracks[index];
      const limit = currentTrackState?.similarTracksLimit || 10;
      console.log(`Workspaceing with limit: ${limit}`);

      // Check if we have enough information
      if ((!artistName || !trackName) && !mbid) {
        console.warn(`Missing artist/track name or MBID for index ${index}`);
        setTracks((prevTracks) => {
          const newTracks = [...prevTracks];
          if (!newTracks[index]) return prevTracks;
          console.log(`Workspace skipped for index ${index}, setting error.`);
          newTracks[index] = {
            ...newTracks[index],
            isLoadingSimilar: false, // Stop loading
            similarTracksError:
              "Missing artist/track name or MBID to fetch similar tracks.", // Set error
            similarFetchAttempted: true,
          };
          return newTracks;
        });
        return;
      }

      // 2. Perform the API call
      try {
        const similarData = await apiClient.getSimilarTracks({
          artist: artistName,
          track: trackName,
          mbid: mbid,
          limit: limit,
        });

        console.log(
          `API returned similar data for index ${index}:`,
          similarData
        );

        // 3. Update the specific track's state with results
        setTracks((prevTracks) => {
          const newTracks = [...prevTracks];
          if (!newTracks[index]) return prevTracks; // Safety check
          console.log(`Setting similarTracks for index ${index}`);
          newTracks[index] = {
            ...newTracks[index],
            similarTracks: similarData || [],
            similarTracksError:
              similarData && similarData.length === 0
                ? "No similar tracks found."
                : null,
            similarFetchAttempted: true,
          };
          return newTracks;
        });
      } catch (err) {
        // 4. Update the specific track's state with error
        console.error(
          `Error fetching similar tracks for ${trackName} (index ${index}):`,
          err
        );
        setTracks((prevTracks) => {
          const newTracks = [...prevTracks];
          if (!newTracks[index]) return prevTracks; // Safety check
          console.log(`Setting similarTracksError for index ${index}`);
          newTracks[index] = {
            ...newTracks[index],
            similarTracksError: `Error: ${
              err.message || "An unknown error occurred"
            }`,
            similarTracks: [], // Clear partial results
            similarFetchAttempted: true, // Mark fetch as failed attempt
          };
          return newTracks;
        });
      } finally {
        // 5. Set loading state back to false for the specific track
        setTracks((prevTracks) => {
          const newTracks = [...prevTracks];
          if (!newTracks[index]) return prevTracks; // Safety check
          console.log(`Setting isLoadingSimilar to false for index ${index}`);
          newTracks[index] = {
            ...newTracks[index],
            isLoadingSimilar: false,
          };
          return newTracks;
        });
        console.log(`Finished fetch process for index ${index}`);
      }
    },
    [tracks]
  );

  const handleAddTrackToPlaylist = useCallback(
    (track) => {
      console.log("HomePage received request to add track to playlist:", track);
      addTrackToPlaylist(track);
    },
    [addTrackToPlaylist]
  );

  return (
    <>
      {" "}
      {/* This content is rendered inside the <Layout> from ProtectedLayout */}
      <h1 className="text-3xl md:text-4xl font-bold mb-8 drop-shadow-lg">
        Welcome
        {userInfo?.display_name
          ? `, ${userInfo.display_name.split(" ")[0]}!`
          : "!"}
      </h1>
      {/* Recent Listens Controls Component */}
      <RecentListensControls
        limit={recentListensLimit}
        onLimitChange={setRecentListensLimit}
        isLoading={fetchingRecentListens}
        onFetch={handleFetchRecentListens}
      />
      {/* List of Tracks */}
      {/* Conditional render based on page-level loading state */}
      {fetchingRecentListens ? (
        <p className="text-center text-white mt-10">
          Loading recent listens...
        </p>
      ) : (
        <ul className="space-y-4">
          {Array.isArray(tracks) && tracks.length > 0 ? (
            tracks.map((track, index) => (
              <TrackItem
                key={track.spotifyId || track.mbid || index}
                track={track}
                index={index}
                onToggleOpen={handleTrackClick}
                onSimilarLimitChange={handleSimilarLimitChange}
                onFetchSimilar={handleFetchSimilarTracks}
                onAddTrackToPlaylist={handleAddTrackToPlaylist}
              />
            ))
          ) : (
            <p className="text-center text-white mt-10">
              No recent listening history found.
            </p>
          )}
        </ul>
      )}
    </>
  );
}

export default HomePage;
