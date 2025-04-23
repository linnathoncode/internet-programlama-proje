using Google.Cloud.Firestore;
using System.Text.Json.Serialization;

namespace Music_Tracker_Backend.Models
{
    [FirestoreData]
    public class SpotifyUser
    {
        [FirestoreProperty]
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [FirestoreProperty]
        [JsonPropertyName("display_name")]
        public string DisplayName { get; set; }

        [FirestoreProperty]
        [JsonPropertyName("email")]
        public string Email { get; set; }

        [FirestoreProperty]
        [JsonPropertyName("profile_image")]
        public ProfileImage ProfileImage { get; set; }

        [FirestoreProperty]
        [JsonPropertyName("spotify_token")]
        public SpotifyTokenResponse SpotifyToken { get; set; }
    }

    [FirestoreData]
    public class ProfileImage
    {
        [FirestoreProperty]
        [JsonPropertyName("url")]
        public string Url { get; set; }

        [FirestoreProperty]
        [JsonPropertyName("height")]
        public int Height { get; set; }

        [FirestoreProperty]
        [JsonPropertyName("width")]
        public int Width { get; set; }
    }

    [FirestoreData]
    public class SpotifyTokenResponse
    {
        [FirestoreProperty]
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; }

        [FirestoreProperty]
        [JsonPropertyName("token_type")]
        public string TokenType { get; set; }

        [FirestoreProperty]
        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [FirestoreProperty]
        [JsonPropertyName("refresh_token")]
        public string RefreshToken { get; set; }

        [FirestoreProperty]
        [JsonPropertyName("scope")]
        public string Scope { get; set; }

        [FirestoreProperty]
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public bool IsExpired() => DateTime.UtcNow > IssuedAt.AddSeconds(ExpiresIn - 60); // 60 seconds as buffer
    }
}
