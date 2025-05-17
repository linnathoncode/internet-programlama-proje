using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Music_Tracker_Backend.keys;
using Music_Tracker_Backend.Models;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;

namespace Music_Tracker_Backend.Services
{
    public class SpotifyService : ISpotifyService
    {
        private readonly IDatabaseService _databaseService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;
        public SpotifyService(IDatabaseService databaseService, IHttpClientFactory httpClientFactory, IConfiguration config) { 
            _databaseService = databaseService;
            _httpClientFactory = httpClientFactory;
            _config = config;
        }
        private string ClientId => _config["Spotify:ClientId"];
        private string ClientSecret => Secrets.SpotifyClientSecret;

        public async Task<String?> RefreshSpotifyAccessToken(string refreshToken)
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

            if (refreshedToken != null && !string.IsNullOrEmpty(refreshedToken.AccessToken))
            {
                return refreshedToken.AccessToken;
            }
            else
            {
                return null;
            }
        }

        public async Task<SpotifyTrack> SearchSpotifyForTrack(string artist, string track, string userId)
        {
            // Get user information
            var user = await _databaseService.GetSpotifyUserAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.SpotifyToken.AccessToken))
            {
                return null;
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
                    return null;
                }
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var baseUrl = "https://api.spotify.com/v1/search";

            var queryUrl = $"?q=track:{Uri.EscapeDataString(track)}%20artist:{Uri.EscapeDataString(artist)}";

            var url = baseUrl +
                      queryUrl +
                      "&type=track&limit=1";

            Console.WriteLine(url);
            // Make a GET request to the Spotify API with the search query
            var response = await client.GetAsync(url);
            Console.WriteLine($"Response Status Code: {response.StatusCode}");
            if (!response.IsSuccessStatusCode)
            {
                // Handle errors, return null or throw exception
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Search Error: {errorContent}");
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            // Safely get the items array
            var items = doc.RootElement.GetProperty("tracks").GetProperty("items");

            if (items.GetArrayLength() == 0)
            {
                // Spotify returned no tracks
                return null;
            }

            var item = items[0];

            var trackResult = new SpotifyTrack
            {
                Id = item.GetProperty("id").GetString(),
                Title = item.GetProperty("name").GetString(),
                Artist = item.GetProperty("artists")[0].GetProperty("name").GetString(),
                AlbumName = item.GetProperty("album").GetProperty("name").GetString(),
                Duration = item.GetProperty("duration_ms").GetInt32()
            };

            return trackResult;

        }
    }
}

public interface ISpotifyService{
    Task<String?> RefreshSpotifyAccessToken(string refreshToken);
    Task<SpotifyTrack> SearchSpotifyForTrack(string artist, string track, string userId);
}