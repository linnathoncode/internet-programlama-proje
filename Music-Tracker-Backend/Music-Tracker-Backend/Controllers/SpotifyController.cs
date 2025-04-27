using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using Music_Tracker_Backend.Models;
using System.Runtime.InteropServices;
using Music_Tracker_Backend.keys;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Music_Tracker_Backend.Services;

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
        public SpotifyController(IConfiguration config, IHttpClientFactory httpClientFactory, IDatabaseService databaseService, IJwtService jwtService, ILastfmService lastfmService)
        {
            _config = config;
            _httpClientFactory = httpClientFactory;
            _databaseService = databaseService;
            _jwtService = jwtService;
            _lastfmService = lastfmService;
        }

        // Spotify credentials from appsettings.json
        private string ClientId => _config["Spotify:ClientId"];
        private string ClientSecret => Secrets.SpotifyClientSecret;
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

            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
            {
                return BadRequest($"{tokenResponse.AccessToken}, Failed to retrieve access token from Spotify.");

            }
            
            // Get user profile from spotify
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenResponse.AccessToken);
            var userInfoResponse = await client.GetAsync("https://api.spotify.com/v1/me");

            if(!userInfoResponse.IsSuccessStatusCode)
            {
                return StatusCode((int)userInfoResponse.StatusCode, "Failed to get user info");

            }
            var userJson = await userInfoResponse.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(userJson);
            
            // Handle user info and tokens
            var user = new SpotifyUser
            {
                Id = doc.RootElement.GetProperty("id").GetString(),
                Email = doc.RootElement.TryGetProperty("email", out var emailEl) ? emailEl.GetString() : null,
                DisplayName = doc.RootElement.TryGetProperty("display_name", out var displayNameEl) ? displayNameEl.GetString() : null,
                SpotifyToken = tokenResponse,
            };

            // Handle profile image
            if(doc.RootElement.TryGetProperty("images", out var imagesEl)
            && imagesEl.ValueKind == JsonValueKind.Array &&
            imagesEl.GetArrayLength() > 0
            ){
                var img = imagesEl[0];
                user.ProfileImage = new ProfileImage
                {
                    Url = img.GetProperty("url").GetString(),
                    Height = img.TryGetProperty("height", out var heightEl) ? heightEl.GetInt32() : 300,
                    Width = img.TryGetProperty("width", out var widthEl) ? widthEl.GetInt32() : 300,

                };
            }

            await _databaseService.AddOrUpdateUserAsync(user);

            // Generate a JWT token
            string token = _jwtService.GenerateToken(user.Id);
            
            // Debug only
            //Console.WriteLine("Generated JWT Token: " + token);

            // Set the JWT token in secure cookie
            Response.Cookies.Append("jwt", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(_config["JwtSettings:ExpiryMinutes"]))
            });

            return Redirect("http://localhost:5173/");

        }

        // ────────────────────────────────────────────────────────────────
        // 3️ - Get Recently Played Tracks - requires user to be logged in
        // ────────────────────────────────────────────────────────────────
        // CHANGE HOW ACCESS TOKENS OR RETRIEVED
        [Authorize] // to access claims
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
                var newAccesToken = await RefreshSpotifyAccessToken(user.SpotifyToken.RefreshToken);
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


            // 

            var spotifyTracks = new List<SpotifyTrack>();

            // Extract relevant data from each track
            foreach (var item in doc.RootElement.GetProperty("items").EnumerateArray())
            {
                var track = item.GetProperty("track");


                // id, title, artists, albumname, duration
                spotifyTracks.Add(new SpotifyTrack
                {
                    Id = track.GetProperty("id").GetString(),
                    Title = track.GetProperty("name").GetString(),
                    Artist = track.GetProperty("artists")[0].GetProperty("name").GetString(),
                    AlbumName = track.GetProperty("album").GetProperty("name").GetString(),
                    Duration = track.GetProperty("duration_ms").GetInt32(),
                    //TrackName = track.GetProperty("name").GetString(),
                    //ArtistName = track.GetProperty("artists")[0].GetProperty("name").GetString(),
                    //AlbumName = track.GetProperty("album").GetProperty("name").GetString(),
                    //PlayedAt = item.GetProperty("played_at").GetDateTime(),
                }) ;
            }
            var LastfmTracks = new List<LastfmTrack>();
            // Get Last.fm tracks
            foreach (SpotifyTrack track in spotifyTracks)
            {
                // Check if track exists in the database
                var (found, lastfmTrack) = await _databaseService.GetTrackAsync(track.Id);

                if (found)
                {
                    // If exists, add to the list and continue
                    LastfmTracks.Add(lastfmTrack);
                    continue;
                }

                // Track not found in database, fetch details from Last.fm API
                lastfmTrack = await _lastfmService.GetLastfmTrackAsync(track);

                if (lastfmTrack != null)
                {
                    // If track details were successfully retrieved, add to database and list
                    await _databaseService.AddTrackAsync(lastfmTrack);
                    LastfmTracks.Add(lastfmTrack);
                }
                else
                {
                    // Handle the case where Last.fm API does not return a valid track (optional)
                    Console.WriteLine($"Track with Spotify ID {track.Id} not found on Last.fm.");
                }
            }

            return Ok(LastfmTracks); // return track list to frontend
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
                var newAccesToken = await RefreshSpotifyAccessToken(user.SpotifyToken.RefreshToken);
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
        // 5 - Returns whether user is logged in or not
        // ────────────────────────────────────────────────────────────────
            [HttpGet("auth-status")]
            public async Task<IActionResult> IsUserLoggedIn()
            {
                // Checks whether jwt exists
                var token = Request.Cookies["jwt"];
                if (string.IsNullOrEmpty(token))
                    return Ok(new { loggedIn = false });

                // Extract userId from JWT claims
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Ok(new { loggedIn = false});

                // Retrieve the user from your database
                var user = await _databaseService.GetSpotifyUserAsync(userId);
                if (user == null || string.IsNullOrEmpty(user.SpotifyToken.AccessToken))
                    return Ok(new { loggedIn = false });

                var accessToken = user.SpotifyToken.AccessToken;

                // Check if the token is expired
                if (user.SpotifyToken.IsExpired())
                {
                    var newAccessToken = await RefreshSpotifyAccessToken(user.SpotifyToken.RefreshToken);
                    if (!string.IsNullOrEmpty(newAccessToken))
                    {
                        // Save the new token
                        user.SpotifyToken.AccessToken = newAccessToken;
                        await _databaseService.AddOrUpdateUserAsync(user);
                        return Ok(new { loggedIn = true });
                    }
                    else
                    {
                        return Ok(new { loggedIn = false }); // Could not refresh token
                    }
                }

                return Ok(new { loggedIn = true }); // Token is still valid
            }


        // ────────────────────────────────────────────────────────────────
        // 6 - Logs user out (deletes jwt token from cookies)
        // ────────────────────────────────────────────────────────────────
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // Remove the JWT cookie
            Response.Cookies.Delete("jwt");
            return Ok(new { message = "Logged out successfully" });

        }


        // ────────────────────────────────────────────────────────────────
        // Helper Method = Refresh access token
        // ────────────────────────────────────────────────────────────────
        private async Task<String?> RefreshSpotifyAccessToken(string refreshToken)
        {
            var client = _httpClientFactory.CreateClient();
            var postData = new Dictionary<string, string>
            {
                {"grant_type", "refresh_token" },
                {"refresh_token", refreshToken  },
                {"client_id", ClientId },
                {"client_secret", ClientSecret }
            };

            var response = await client.PostAsync("https://accounts.spotify.com/api/token", new FormUrlEncodedContent(postData));
            var content = await response.Content.ReadAsStringAsync();
            var refreshedToken = JsonSerializer.Deserialize<SpotifyTokenResponse>(content);

            if(refreshedToken != null && !string.IsNullOrEmpty(refreshedToken.AccessToken))
            {
                return refreshedToken.AccessToken;
            }
            else
            {
                return null;
            }
        } 
    }
}