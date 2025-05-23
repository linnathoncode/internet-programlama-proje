import React, { useEffect, useState, useCallback } from "react";
import * as apiClient from "../services/apiClient";
import SimpleTrackItem from "../components/SimpleTrackItem";

const PAGE_SIZE = 20;

const ListeningHistoryPage = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursorStack, setCursorStack] = useState([]); // stack of cursors for previous pages
  const [currentCursor, setCurrentCursor] = useState(null); // current "startAfter" cursor
  const [hasNext, setHasNext] = useState(false);

  const initializeTracks = (data) => {
    return data.map((item) => ({
      ...item.track,
      timestamp: item.timestamp,
    }));
  };

  const fetchTracks = useCallback(async (cursor = null, isNext = true) => {
    setLoading(true);
    try {
      const data = await apiClient.getListeningHistory(PAGE_SIZE, cursor);
      const initialized = initializeTracks(data);
      setTracks(initialized);

      // Manage cursor stack for previous navigation
      if (isNext && initialized.length > 0) {
        setCursorStack((prev) => [...prev, cursor]); // push current cursor to stack
        setCurrentCursor(initialized[initialized.length - 1].timestamp); // new cursor
      } else if (!isNext) {
        setCurrentCursor(cursor); // pop logic handled in button
      }

      // Decide if there's a next page
      setHasNext(initialized.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error fetching listening history", err);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks(null, true); // initial load
  }, [fetchTracks]);

  const handleNext = () => {
    fetchTracks(currentCursor, true);
  };

  const handlePrevious = () => {
    if (cursorStack.length < 2) return;
    const newStack = [...cursorStack];
    newStack.pop(); // remove current page cursor
    const previousCursor = newStack[newStack.length - 1] || null;
    setCursorStack(newStack);
    fetchTracks(previousCursor, false);
  };

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">Listening History</h2>

      {loading ? (
        <p className="text-center text-white mt-10">
          Loading recent listens...
        </p>
      ) : (
        <ul className="space-y-4">
          {Array.isArray(tracks) && tracks.length > 0 ? (
            tracks.map((track, index) => (
              <SimpleTrackItem
                key={track.id + track.timestamp}
                track={track}
                index={index}
              />
            ))
          ) : (
            <p className="text-center text-white mt-10">
              No recent listening history found.
            </p>
          )}
        </ul>
      )}

      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={handlePrevious}
          disabled={loading || cursorStack.length < 2}
          className="px-6 py-2 bg-accent hover:bg-accent-dark text-black rounded-full transition duration-300 shadow-md disabled:opacity-50"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={loading || !hasNext}
          className="px-6 py-2 bg-accent hover:bg-accent-dark text-black rounded-full transition duration-300 shadow-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ListeningHistoryPage;
