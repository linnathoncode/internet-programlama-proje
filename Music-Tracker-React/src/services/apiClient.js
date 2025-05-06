const BASE_URL = "/api/spotify";

/**
 * Helper function to handle fetching and basic error checking
 */
const fetchApi = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
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
    }

    // Handle cases where response might be empty (e.g., logout success with no body)
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return null; // Indicate success with no content
    }

    return await response.json();
  } catch (error) {
    console.error("API call failed:", error);
    // Rethrow to be handled by the calling component/hook
    throw error;
  }
};

export const getAuthStatus = () => {
  return fetchApi("/auth-status");
};

export const getUserInfo = () => {
  return fetchApi("/user-info");
};

export const getRecentListens = (limit = 10) => {
  return fetchApi(`/recent?limit=${limit}`);
};

export const logout = () => {
  return fetchApi("/logout", { method: "POST" });
};

export const getSimilarTracks = ({ artist, track, mbid, limit = 10 }) => {
  const queryParams = new URLSearchParams();
  if (artist) queryParams.append("artist", artist);
  if (track) queryParams.append("track", track);
  if (mbid) queryParams.append("mbid", mbid);
  queryParams.append("limit", limit);

  return fetchApi(`/last-fm-get-similar?${queryParams.toString()}`);
};
