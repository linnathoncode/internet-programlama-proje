const BASE_URL_SPOTIFY = "/api/spotify";
const BASE_URL_AUTH = "/api/auth";
const BASE_URL_LASTFM = "/api/lastfm";
/**
 * Helper function to handle fetching and basic error checking
 */
const fetchApi = async (endpoint, baseUrl, options = {}) => {
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,

      credentials: options.credentials || "include", // Include cookies by default
    });

    if (!response.ok) {
      let errorMsg = `API error: ${response.status} ${response.statusText}`;

      try {
        // Attempt to read error body if available

        const errorBody = await response.json();

        if (errorBody.message) errorMsg = `API error: ${errorBody.message}`;
        else if (errorBody.error) errorMsg = `API error: ${errorBody.error}`;
        else if (typeof errorBody === "string")
          errorMsg = `API error: ${errorBody}`;
      } catch (jsonErr) {
        // Ignore if body is not JSON
      }

      const error = new Error(errorMsg);

      error.response = response; // Attach response for potential further handling

      throw error;
    } // Handle cases where response might be empty (e.g., logout success with no body)

    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return null; // Indicate success with no content
    }

    return await response.json();
  } catch (error) {
    console.error("API call failed:", error.message); // Rethrow to be handled by the calling component/hook

    throw error;
  }
};

// /api/auth
export const getAuthStatus = () => {
  return fetchApi("/auth-status", BASE_URL_AUTH);
};
// /api/spotify
export const getUserInfo = () => {
  return fetchApi("/user-info", BASE_URL_SPOTIFY);
};
// /api/spotify
export const getListeningHistory = (limit = 10, startAfter = null) => {
  const query =
    startAfter !== null
      ? `/get-listening-history?limit=${limit}&startAfter=${startAfter}`
      : `/get-listening-history?limit=${limit}`;
  console.log(query);
  return fetchApi(query, BASE_URL_SPOTIFY);
};
// /api/spotify
export const getRecentListens = (limit = 10) => {
  return fetchApi(`/recent?limit=${limit}`, BASE_URL_SPOTIFY);
};
// /api/auth
export const logout = () => {
  return fetchApi("/logout", BASE_URL_AUTH, { method: "POST" });
};

// // /api/auth
// export const login = () => {
//   return fetchApi("/login", BASE_URL_AUTH);
// };

// /api/lastfm
export const getSimilarTracks = ({ artist, track, mbid, limit = 10 }) => {
  const queryParams = new URLSearchParams();
  if (artist) queryParams.append("artist", artist);
  if (track) queryParams.append("track", track);
  if (mbid) queryParams.append("mbid", mbid);
  queryParams.append("limit", limit);

  return fetchApi(`/get-similar?${queryParams.toString()}`, BASE_URL_LASTFM);
};

// /api/spotify
export const createPlaylist = ({
  track_ids,
  playlistName,
  description = "",
  is_public = true,
}) => {
  // Request body
  const body = {
    track_ids: track_ids,
    name: playlistName,
    description: description,
    is_public: is_public,
  };

  // Post request
  return fetchApi("/generate-spotify-playlist", BASE_URL_SPOTIFY, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
};
