using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using Music_Tracker_Backend.Models;
using System.Runtime.InteropServices;

namespace InternetProg4.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpotifyController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        // These will temporarily store tokens after login
        private static string _accessToken;
        private static string _refreshToken;

        public SpotifyController(IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _config = config;
            _httpClientFactory = httpClientFactory;
        }

        // Spotify credentials from appsettings.json
        private string ClientId => _config["Spotify:ClientId"];
        private string ClientSecret => _config["Spotify:ClientSecret"];
        private string RedirectUri => _config["Spotify:RedirectUri"];

        // ────────────────────────────────────────────────────────────────
        // 1️ - Spotify Login Endpoint - redirects user to Spotify login page
        // ────────────────────────────────────────────────────────────────
        [HttpGet("login")]
        public IActionResult Login()
        {
            var scopes = "user-read-recently-played"; // permissions requested
            var authUrl = $"https://accounts.spotify.com/authorize" +
                $"?response_type=code" +
                $"&client_id={ClientId}" +
                $"&scope={Uri.EscapeDataString(scopes)}" +
                $"&redirect_uri={Uri.EscapeDataString(RedirectUri)}";

            return Redirect(authUrl); // redirects user to Spotify login
        }

        // ────────────────────────────────────────────────────────────────
        // 2️ - Callback Endpoint - handles Spotify's redirect after login
        // ────────────────────────────────────────────────────────────────
        [HttpGet("callback")]
        public async Task<IActionResult> Callback(string code)
        {
            var client = _httpClientFactory.CreateClient();

            // Prepare data to exchange the authorization code for tokens
            var postData = new Dictionary<string, string>
            {
                { "grant_type", "authorization_code" },
                { "code", code },
                { "redirect_uri", RedirectUri },
                { "client_id", ClientId },
                { "client_secret", ClientSecret }
            };

            // Send POST request to Spotify to get the tokens
            var response = await client.PostAsync("https://accounts.spotify.com/api/token", new FormUrlEncodedContent(postData));
            var content = await response.Content.ReadAsStringAsync();
            var tokenResponse = JsonSerializer.Deserialize<SpotifyTokenResponse>(content);

            // Save access and refresh tokens (this should be stored more securely in real apps)
            _accessToken = tokenResponse.AccessToken;
            _refreshToken = tokenResponse.RefreshToken;

            return Ok("Authorization successful! You can now hit /spotify/recent");
        }

        // ────────────────────────────────────────────────────────────────
        // 3️ - Get Recently Played Tracks - requires user to be logged in
        // ────────────────────────────────────────────────────────────────
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentlyPlayed()
        {
            // Ensure user has authenticated
            if (string.IsNullOrEmpty(_accessToken))
                return Unauthorized("You need to authenticate first at /spotify/login");

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);

            // Fetch recently played tracks (limit 10)
            var response = await client.GetAsync("https://api.spotify.com/v1/me/player/recently-played?limit=10");

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, "Failed to get recently played tracks");

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var playedTracks = new List<RecentlyPlayedTrack>();

            // Extract relevant data from each track
            foreach (var item in doc.RootElement.GetProperty("items").EnumerateArray())
            {
                var track = item.GetProperty("track");

                playedTracks.Add(new RecentlyPlayedTrack
                {
                    TrackName = track.GetProperty("name").GetString(),
                    ArtistName = track.GetProperty("artists")[0].GetProperty("name").GetString(),
                    AlbumName = track.GetProperty("album").GetProperty("name").GetString(),
                    PlayedAt = item.GetProperty("played_at").GetDateTime(),
                });
            }

            return Ok(playedTracks); // return track list to frontend
        }

        // ────────────────────────────────────────────────────────────────
        // 4 - Get User Information- requires user to be logged in
        // ────────────────────────────────────────────────────────────────
        [HttpGet("user-info")]
        public async Task<IActionResult> GetUserInfo()
        {
            // Check if the user has authenticated (access token must be present)
            if (string.IsNullOrEmpty(_accessToken))
                return Unauthorized("You need to authenticate first at /spotify/login");

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);

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

    }
}