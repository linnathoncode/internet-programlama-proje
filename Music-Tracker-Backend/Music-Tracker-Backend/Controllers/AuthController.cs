using Microsoft.AspNetCore.Mvc;
using Music_Tracker_Backend.keys;
using Music_Tracker_Backend.Models;
using Music_Tracker_Backend.Services;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;

namespace Music_Tracker_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IDatabaseService _databaseService;
        private readonly IJwtService _jwtService;
        private readonly ISpotifyService _spotifyService;
        public AuthController(IConfiguration config, IHttpClientFactory httpClientFactory, IDatabaseService databaseService, IJwtService jwtService, ISpotifyService spotifyService)
        {
            _config = config;
            _httpClientFactory = httpClientFactory;
            _databaseService = databaseService;
            _jwtService = jwtService;
            _spotifyService = spotifyService;
        }
        private string ClientId => _config["Spotify:ClientId"];
        private string ClientSecret => Secrets.SpotifyClientSecret;
        private string RedirectUri => _config["Spotify:RedirectUri"];

        // ────────────────────────────────────────────────────────────────
        // 1️ - Spotify Login Endpoint - redirects user to Spotify login page
        // ────────────────────────────────────────────────────────────────
        [HttpGet("login")]
        public IActionResult Login()
        {
            var scopes = "user-read-recently-played playlist-modify-public playlist-modify-private"; // permissions requested
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
                return BadRequest($"{tokenResponse?.AccessToken}, Failed to retrieve access token from Spotify.");

            }

            Console.WriteLine($"Token Scopes: {tokenResponse.Scope}");


            // Get user profile from spotify
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenResponse.AccessToken);
            var userInfoResponse = await client.GetAsync("https://api.spotify.com/v1/me");

            if (!userInfoResponse.IsSuccessStatusCode)
            {
                var errorContent = await userInfoResponse.Content.ReadAsStringAsync();
                Console.WriteLine($"Spotify API Error: {errorContent}");
                return StatusCode((int)userInfoResponse.StatusCode, errorContent);

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
            if (doc.RootElement.TryGetProperty("images", out var imagesEl)
            && imagesEl.ValueKind == JsonValueKind.Array &&
            imagesEl.GetArrayLength() > 0
            )
            {
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
        // 3 - Returns whether user is logged in or not
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
                return Ok(new { loggedIn = false });

            // Retrieve the user from your database
            var user = await _databaseService.GetSpotifyUserAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.SpotifyToken.AccessToken))
                return Ok(new { loggedIn = false });

            var accessToken = user.SpotifyToken.AccessToken;

            // Check if the token is expired
            if (user.SpotifyToken.IsExpired())
            {
                var newAccessToken = await _spotifyService.RefreshSpotifyAccessToken(user.SpotifyToken.RefreshToken);
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
        // 6     - Logs user out (deletes jwt token from cookies)
        // ────────────────────────────────────────────────────────────────
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // Remove the JWT cookie
            Response.Cookies.Delete("jwt");
            return Ok(new { message = "Logged out successfully" });

        }

    }
}
