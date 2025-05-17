using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using Music_Tracker_Backend.Models;
using Music_Tracker_Backend.keys;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace InternetProg4.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpotifyController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IDatabaseService _databaseService;
        private readonly IJwtService _jwtService;
        private readonly ILastfmService _lastfmService;
        private readonly ISpotifyService _spotifyService;
        public SpotifyController(IConfiguration config, IHttpClientFactory httpClientFactory, IDatabaseService databaseService, IJwtService jwtService, ILastfmService lastfmService, ISpotifyService spotifyService)
        {
            _config = config;
            _httpClientFactory = httpClientFactory;
            _databaseService = databaseService;
            _jwtService = jwtService;
            _lastfmService = lastfmService;
            _spotifyService = spotifyService;
        }

        // Spotify credentials from appsettings.json
        private string ClientId => _config["Spotify:ClientId"];
        private string ClientSecret => Secrets.SpotifyClientSecret;
        private string RedirectUri => _config["Spotify:RedirectUri"];

        
        // ────────────────────────────────────────────────────────────────
        // 3️ - Get Recently Played Tracks - requires user to be logged in
        // ────────────────────────────────────────────────────────────────
        [Authorize]
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentlyPlayed([FromQuery] int limit = 10)
        {
            // Get claims from the cookie
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");


            // Get user information
            var user = await _databaseService.GetSpotifyUserAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.SpotifyToken.AccessToken))
            {
                return Unauthorized("Spotify access token not found for user.");
            }
            var accessToken = user.SpotifyToken.AccessToken;
            
            // Check if access token still valid
            // If expired refresh it with refresh token
            if (user.SpotifyToken.IsExpired())
            {
                var newAccesToken = await _spotifyService.RefreshSpotifyAccessToken(user.SpotifyToken.RefreshToken);
                if (newAccesToken != null)
                {
                    user.SpotifyToken.AccessToken = newAccesToken;
                    await _databaseService.AddOrUpdateUserAsync(user);
                    accessToken = newAccesToken;
                }
                else
                {
                    return Unauthorized("Unable to refresh access token");
                }
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            // Fetch recently played tracks 
            var response = await client.GetAsync($"https://api.spotify.com/v1/me/player/recently-played?limit={limit}");

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, "Failed to get recently played tracks");


            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var spotifyTracks = new List<SpotifyTrack>();

            // Extract relevant data from each track
            foreach (var item in doc.RootElement.GetProperty("items").EnumerateArray())
            {
                var track = item.GetProperty("track");
                Console.WriteLine($"Track Played At: {item.GetProperty("played_at").GetString()}");

                // Convert played_at to Unix timestamp (milliseconds)
                var playedAt = item.GetProperty("played_at").GetDateTime();
                long timestamp = new DateTimeOffset(playedAt).ToUnixTimeMilliseconds();

                // Add the track to the list
                spotifyTracks.Add(new SpotifyTrack
                {
                    Id = track.GetProperty("id").GetString(),
                    Title = track.GetProperty("name").GetString(),
                    Artist = track.GetProperty("artists")[0].GetProperty("name").GetString(),
                    AlbumName = track.GetProperty("album").GetProperty("name").GetString(),
                    Duration = track.GetProperty("duration_ms").GetInt32(),
                    PlayedAt = playedAt, // Store the DateTime for use later if needed
                });
            }

            var trackWithTimestampDtos = new List<TrackWithTimestampDto>();

            var trackIdList = spotifyTracks.Select(t => t.Id).ToList();
            var knownTracks = await _databaseService.GetTracksAsync(trackIdList); // Dictionary<string, LastfmTrack>

            var tasks = spotifyTracks.Select(async track =>
            {
                if (!knownTracks.TryGetValue(track.Id, out var lastfmTrack))
                {
                    lastfmTrack = await _lastfmService.GetLastfmTrackAsync(track);
                    if (lastfmTrack != null)
                    {
                        await _databaseService.AddTrackAsync(lastfmTrack);
                    }
                }

                if (lastfmTrack != null)
                {
                    await HandleListeningHistory(userId, track.Id, track.PlayedAt);

                    return new TrackWithTimestampDto
                    {
                        Track = lastfmTrack,
                        Timestamp = new DateTimeOffset(track.PlayedAt).ToUnixTimeMilliseconds()
                    };
                }

                return null;
            });

            var results = await Task.WhenAll(tasks);
            return Ok(results.Where(r => r != null));
        }

        // ────────────────────────────────────────────────────────────────
        // Helper Method = Handle Listen History
        // ────────────────────────────────────────────────────────────────
        private async Task HandleListeningHistory(string userId, string trackId, DateTime playedAt)
        {
            // Convert datetime to timestamp
            long timestamp = new DateTimeOffset(playedAt).ToUnixTimeMilliseconds();
         
            bool alreadyLogged = await _databaseService.CheckIfHistoryEntryExists(userId, trackId, timestamp);
         
            if (!alreadyLogged)
            {

                await _databaseService.AddListeningHistoryAsync(userId, new ListeningHistoryEntry
                {
                    TrackId = trackId,
                    Timestamp = timestamp,
                });
            }
            return;
        }

        // ────────────────────────────────────────────────────────────────
        // 4 - Get User Information- requires user to be logged in
        // ────────────────────────────────────────────────────────────────
        // Gets user info from spotify api not from the database
        [Authorize]
        [HttpGet("user-info")]  
        public async Task<IActionResult> GetUserInfo()
        {
            // Get claims from jwt token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            // Get user information
            var user = await _databaseService.GetSpotifyUserAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.SpotifyToken.AccessToken))
            {
                return Unauthorized("Spotify access token not found for user.");
            }
            var accessToken = user.SpotifyToken.AccessToken;

            // Check if access token still valid
            // If expired refresh it with refresh token
            if (user.SpotifyToken.IsExpired())
            {
                var newAccesToken = await _spotifyService.RefreshSpotifyAccessToken(user.SpotifyToken.RefreshToken);
                if (newAccesToken != null)
                {
                    user.SpotifyToken.AccessToken = newAccesToken;
                    await _databaseService.AddOrUpdateUserAsync(user);
                    accessToken = newAccesToken;
                }
                else
                {
                    return Unauthorized("Unable to refresh access token");
                }
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            // Send GET request to Spotify's "Get Current User's Profile" endpoint
            var response = await client.GetAsync("https://api.spotify.com/v1/me");

            // If the response is not successful, return the corresponding error code
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Failed to get user information");
            }

            // Read Json as string then parse it into document
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var userInfo = new SpotifyUser();

            // Get the information about the user
            // Null check for optional fields
            userInfo.Id = doc.RootElement.GetProperty("id").GetString();

            if (doc.RootElement.TryGetProperty("email", out JsonElement emailElement))
            {
                userInfo.Email = emailElement.GetString();
            }
            else
            {
                userInfo.Email = null;
            }

            if (doc.RootElement.TryGetProperty("display_name", out JsonElement displayNameElement))
            {
                userInfo.DisplayName = displayNameElement.GetString();
            }

            if (doc.RootElement.TryGetProperty("images", out JsonElement imagesElement) &&
                imagesElement.ValueKind == JsonValueKind.Array &&
                imagesElement.GetArrayLength() > 0)
            {
                var firstImage = imagesElement[0];

                userInfo.ProfileImage = new ProfileImage
                {
                    Url = firstImage.GetProperty("url").GetString(),
                    Height = firstImage.TryGetProperty("height", out var heightEl) ? heightEl.GetInt32() : 0,
                    Width = firstImage.TryGetProperty("width", out var widthEl) ? widthEl.GetInt32() : 0,
                };
            }

            return Ok(userInfo);
        }

        // ────────────────────────────────────────────────────────────────
        // 8 - Generate Playlists
        // ────────────────────────────────────────────────────────────────
        [Authorize]
        [HttpPost("generate-spotify-playlist")]
        public async Task<IActionResult> GenerateSpotifyPlaylist([FromBody] PlaylistInfo playlistInfo)
        {

            if (playlistInfo == null)
                return BadRequest("No tracks provided.");

            // Extract playlist metadata from the first item
            var playlistName = string.IsNullOrWhiteSpace(playlistInfo.PlaylistName) ? "Generated Playlist" : playlistInfo.PlaylistName;
            var playlistDescription = playlistInfo.Description ?? "Created with Music Tracker";
            var isPublic = playlistInfo?.IsPublic ?? false;

            /*
            // Extract track URIs from all items
            var trackUris = tracks
                .Where(t => !string.IsNullOrWhiteSpace(t.Id))
                .Select(t => $"spotify:track:{t.Id}")
                .ToList();

            if (trackUris.Count == 0)
                return BadRequest("No valid Spotify track IDs provided.");
            */

            // Get claims from jwt token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            // Get user information
            var user = await _databaseService.GetSpotifyUserAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.SpotifyToken.AccessToken))
            {
                return Unauthorized("Spotify access token not found for user.");
            }
            var accessToken = user.SpotifyToken.AccessToken;

            // Check if access token still valid
            // If expired refresh it with refresh token
            if (user.SpotifyToken.IsExpired())
            {
                var newAccesToken = await _spotifyService.RefreshSpotifyAccessToken(user.SpotifyToken.RefreshToken);
                if (newAccesToken != null)
                {
                    user.SpotifyToken.AccessToken = newAccesToken;
                    await _databaseService.AddOrUpdateUserAsync(user);
                    accessToken = newAccesToken;
                }
                else
                {
                    return Unauthorized("Unable to refresh access token");
                }
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            // First create the playlist 
            var createPlaylistPayload = new
            {
                name = playlistName,
                description = playlistDescription,
                @public = isPublic
            };

            var playlistUrl = $"https://api.spotify.com/v1/users/{userId}/playlists";

            var createPlaylistResponse = await client.PostAsJsonAsync(playlistUrl, createPlaylistPayload);

            /*
            var json = await createPlaylistResponse.Content.ReadAsStringAsync();
            Console.Write($"Spotify Response: {json}");
            */

            if (!createPlaylistResponse.IsSuccessStatusCode)
                return StatusCode((int)createPlaylistResponse.StatusCode, "Failed to create Spotify playlist.");


            // Get playlist Id
            var playlistContent = await createPlaylistResponse.Content.ReadAsStringAsync();
            var playlistJson = JsonDocument.Parse(playlistContent);
            var playlistId = playlistJson.RootElement.GetProperty("id").GetString();

            // Add items to the playlist
            if(playlistId == null)
            {
                return StatusCode((int)createPlaylistResponse.StatusCode, "Failed to get Spotify playlist ID.");

            }
            var addItemToPlaylistUrl = $"https://api.spotify.com/v1/playlists/{playlistId}/tracks";


            var addItemsToPlaylistPayload = new
            {
                uris = playlistInfo.TrackIds.Select(id => $"spotify:track:{id}").ToList(),
                position = 0

            };

            var addItemToPlaylistResponse = await client.PostAsJsonAsync(addItemToPlaylistUrl, addItemsToPlaylistPayload);

            if (!addItemToPlaylistResponse.IsSuccessStatusCode)
            {
                return StatusCode((int)createPlaylistResponse.StatusCode, "Failed add tracks to Spotify playlist.");
            }

            return Ok(new
            {
                message = "Playlist created successfully!",
                playlistId,
                playlistUrl = playlistJson.RootElement.GetProperty("external_urls").GetProperty("spotify").GetString()
            });



        }

        // Not connected to spotify 
        // ────────────────────────────────────────────────────────────────
        // 9 - Get listening history
        // ────────────────────────────────────────────────────────────────
        [Authorize]
        [HttpGet("get-listening-history")]
        public async Task<IActionResult> GetListeningHistory([FromQuery] int limit = 10, [FromQuery] long? startAfter = null) // Unix timestamp for pagination)
        {
            // Get userId from the cookie
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");
            try
            {
                var history = await _databaseService.GetListeningHistoryTracksAsync(userId, limit, startAfter);
                Console.WriteLine(history);
                return Ok(history);
            }catch(Exception ex)
            {
                Console.WriteLine($"Error getting listening history: {ex.Message}");
                return StatusCode(500, "Something went wrong");
            }
        }
        
    }
}