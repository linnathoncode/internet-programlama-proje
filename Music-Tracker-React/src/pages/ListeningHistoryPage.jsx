// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Sidebar from "../components/Sidebar";
// import TrackItem from "../components/TrackItem"; // Use the correct TrackItem
// import * as apiClient from "../services/apiClient"; // Assuming getListeningHistory is here
// import "./index.css";

// // Assume these handlers are defined elsewhere or will be added
// // Placeholder functions to make the code runnable
// const handleTrackClick = (index) => {
//   console.log("Track clicked:", index);
//   // Implement logic to toggle open state for the track item
//   // This logic should likely update the 'isOpen' state on the specific track object
//   // within the 'tracks' state array in ListeningHistoryPage.
// };
// const handleSimilarLimitChange = (index, limit) => {
//   console.log(`Limit change for track ${index}: ${limit}`);
//   // Implement logic to update similar tracks limit for the specific track object
//   // within the 'tracks' state array.
// };
// const handleFetchSimilarTracks = async (index, trackId, limit) => {
//   console.log(
//     `Workspace similar for track ${index} (${trackId}) with limit ${limit}`
//   );
//   // Implement logic to fetch similar tracks for the specific track object
//   // and update its 'similarTracks' property within the 'tracks' state array.
//   // You'll likely need to call an API like apiClient.getSimilarTracks(trackId, limit)
//   // and update the tracks state array.
// };
// const handleAddTrackToPlaylist = (track) => {
//   console.log("Add track to playlist:", track);
//   // Implement logic to add track to a playlist
// };

// function ListeningHistoryPage({ userInfo, handleLogout }) {
//   const [tracks, setTracks] = useState([]);
//   const [page, setPage] = useState(1); // 1-based current page number
//   const [pageSize] = useState(10); // Number of items per page
//   const [loading, setLoading] = useState(true);

//   // This array will store the *cursor* needed to fetch each page.
//   // pageCursors[0] is the cursor for page 1 (should be null initially).
//   // pageCursors[1] is the cursor for page 2 (timestamp of last item of page 1).
//   // pageCursors[pageIndex - 1] is the cursor for page pageIndex.
//   // The cursor is the timestamp of the last item *of the previous page*.
//   const [pageCursors, setPageCursors] = useState([null]);

//   const [hasMore, setHasMore] = useState(true); // Indicates if there's a next page

//   // Function to fetch data for a specific page number
//   const fetchPage = async (pageNumber) => {
//     setLoading(true);

//     // Get the cursor needed to fetch this specific pageNumber.
//     // For page 1, we use pageCursors[0] which is null.
//     // For page 2, we use pageCursors[1] which is the cursor derived from page 1.
//     const startAfterCursor = pageCursors[pageNumber - 1];

//     try {
//       // Call API with pageSize and the determined cursor
//       const data = await apiClient.getListeningHistory(
//         pageSize,
//         startAfterCursor
//       );

//       // Initialize properties that TrackItem expects
//       const newTracks = data.map((item) => ({
//         ...item.track,
//         timestamp: item.timestamp,
//         // Initialize UI-specific states expected by TrackItem
//         isOpen: false, // Assume closed by default
//         isLoadingSimilar: false, // Assume not loading similar initially
//         similarTracks: [], // Initialize as an empty array
//         similarTracksLimit: 10, // Default limit for similar tracks
//         similarTracksError: null, // No error initially
//       }));

//       // Store the cursor for the *next* page if tracks were returned
//       // The cursor for the next page (pageNumber + 1) is the timestamp of the last item
//       // from the current page (pageNumber).
//       if (newTracks.length > 0) {
//         const nextCursor = newTracks[newTracks.length - 1].timestamp;

//         // Only add the cursor if we are navigating forward into a new page
//         // that we haven't cached a cursor for yet.
//         // Check if the current page number's index in pageCursors is not already populated
//         if (pageCursors.length === pageNumber) {
//           // Append the cursor for the page we just fetched (pageNumber),
//           // which will be used as the startAfter for the *next* page (pageNumber + 1).
//           setPageCursors([...pageCursors, nextCursor]);
//         } else if (pageCursors.length > pageNumber) {
//           // This case handles navigating back and then forward.
//           // Ensure the cursor for the next page (pageNumber + 1) is still correct.
//           // This might be overly cautious depending on API consistency, but safer.
//           // In a simple forward/backward where data doesn't change, this isn't strictly needed
//           // if the cursors are always based on the exact timestamp.
//           // A simpler approach is just the check above: if (pageCursors.length === pageNumber)
//         }
//       }

//       setTracks(newTracks);
//       // Determine if there's a potential next page. If we received exactly pageSize items,
//       // there might be more. If less, we've reached the end.
//       setHasMore(newTracks.length === pageSize);
//     } catch (err) {
//       console.error("Failed to fetch tracks", err);
//       // Optionally set hasMore to false on error, depending on desired behavior
//       setHasMore(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Navigate to the next page
//   const goToNextPage = () => {
//     // Check if we have a cursor available for the next page index in pageCursors
//     // and if there's potentially more data based on the last fetch.
//     if (hasMore && !loading) {
//       setPage(page + 1);
//       // The useEffect will trigger fetchPage with the new page number
//     }
//   };

//   // Navigate to the previous page
//   const goToPreviousPage = () => {
//     if (page > 1 && !loading) {
//       // Ensure we are not on the first page and not currently loading
//       setPage(page - 1);
//       // The useEffect will trigger fetchPage with the new page number
//     }
//   };

//   // Effect to fetch data whenever the page number changes
//   useEffect(() => {
//     fetchPage(page);
//   }, [page, pageSize, pageCursors]); // Include pageCursors in dependency array
//   // pageCursors is included because although we primarily update it *inside* fetchPage,
//   // if it were somehow modified externally or due to complex async state updates,
//   // refetching based on the potentially new cursors might be necessary.

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-black text-white font-inter selection:bg-accent selection:text-white relative flex">
//       {/* Noise Overlay */}
//       <div className="bg-[url('../assets/broken-noise.png')] bg-repeat mix-blend-screen absolute inset-0 opacity-50 z-0" />

//       <Sidebar
//         userInfo={userInfo}
//         onLogout={handleLogout}
//         isCollapsed={false}
//         onToggleCollapse={() => {}}
//       />

//       <main className="relative z-10 p-6 md:p-10 flex-1 min-w-0">
//         <h1 className="text-3xl md:text-4xl font-bold mb-8 drop-shadow-lg">
//           Listening History
//         </h1>

//         {loading ? (
//           <p className="text-center mt-8">Loading...</p>
//         ) : (
//           <>
//             <ul className="space-y-4">
//               {tracks.map((track, index) => (
//                 // Using track.id as key is generally better if unique, fallback to timestamp + index
//                 <TrackItem
//                   key={track.id || `${track.timestamp}-${index}`}
//                   track={track} // Pass the track object including initialized states
//                   index={index} // Pass index for handlers to identify which track is acted upon
//                   onToggleOpen={handleTrackClick}
//                   onSimilarLimitChange={handleSimilarLimitChange}
//                   onFetchSimilar={handleFetchSimilarTracks}
//                   onAddTrackToPlaylist={handleAddTrackToPlaylist}
//                 />
//               ))}
//             </ul>
//             {/* Pagination Controls */}
//             <div className="flex justify-center mt-8 gap-4">
//               <button
//                 onClick={goToPreviousPage}
//                 disabled={page === 1 || loading} // Disable if on the first page or loading
//                 className="bg-accent text-white px-4 py-2 rounded disabled:opacity-50"
//               >
//                 Previous
//               </button>
//               <span className="text-lg font-semibold">Page {page}</span>
//               <button
//                 onClick={goToNextPage}
//                 // Disable if no more items were returned on the last fetch
//                 // or if loading the next page.
//                 disabled={!hasMore || loading}
//                 className="bg-accent text-white px-4 py-2 rounded disabled:opacity-50"
//               >
//                 Next
//               </button>
//             </div>
//           </>
//         )}
//       </main>
//     </div>
//   );
// }

// export default ListeningHistoryPage;
